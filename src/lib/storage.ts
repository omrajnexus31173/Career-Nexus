
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "@/lib/auth";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const ALLOWED: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "application/pdf": {
    ext: "pdf",
    magic: (b) => b.subarray(0, 5).toString("latin1") === "%PDF-",
  },
  "image/png": {
    ext: "png",
    magic: (b) => b.subarray(1, 4).toString("latin1") === "PNG",
  },
  "image/jpeg": {
    ext: "jpg",
    magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  "image/webp": {
    ext: "webp",
    magic: (b) =>
      b.subarray(0, 4).toString("latin1") === "RIFF" &&
      b.subarray(8, 12).toString("latin1") === "WEBP",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    ext: "docx",
    magic: (b) => b[0] === 0x50 && b[1] === 0x4b,
  },
};

export const ALLOWED_TYPES = Object.keys(ALLOWED);
export const ALLOWED_LABEL = "PDF, PNG, JPG, WEBP or DOCX";

export type StoredFile = {
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
};

type CloudinaryResourceType = "image" | "raw";

function ensureCloudinaryConfigured() {
  if (!process.env.CLOUDINARY_URL) {
    throw new ApiError(500, "Cloudinary is not configured. Check CLOUDINARY_URL.");
  }
}

function safeOriginalName(name: string, ext: string) {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(-120) || `file.${ext}`;
}

async function uploadToCloudinary(
  buffer: Buffer,
  userId: string,
  ext: string,
  mimeType: string,
): Promise<string> {
  ensureCloudinaryConfigured();

  const resourceType: CloudinaryResourceType = mimeType.startsWith("image/")
    ? "image"
    : "raw";

  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const randomId = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;

  const publicId =
    resourceType === "raw"
      ? `career-nexus/${safeUserId}/${randomId}.${ext}`
      : `career-nexus/${safeUserId}/${randomId}`;

  try {
    await new Promise<void>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          type: "authenticated",
          public_id: publicId,
          overwrite: false,
        },
        (error) => {
          if (error) reject(error);
          else resolve();
        },
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  } catch {
    throw new ApiError(502, "File upload to Cloudinary failed. Please try again.");
  }

  // Keep the extension in the stored reference so existing MIME detection works.
  return resourceType === "image"
    ? `cloudinary:${resourceType}:${publicId}.${ext}`
    : `cloudinary:${resourceType}:${publicId}`;
}

export async function storeBuffer(
  userId: string,
  buffer: Buffer,
  originalName: string,
  declaredType: string,
): Promise<StoredFile> {
  if (!buffer || buffer.length === 0) {
    throw new ApiError(400, "The uploaded file is empty.");
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new ApiError(
      413,
      `File is too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
    );
  }

  const declared = declaredType.toLowerCase().split(";")[0].trim();
  const spec = ALLOWED[declared];

  if (!spec) {
    throw new ApiError(
      415,
      `Unsupported file type "${declared || "unknown"}". Allowed: ${ALLOWED_LABEL}.`,
    );
  }

  if (!spec.magic(buffer)) {
    throw new ApiError(
      415,
      "File content does not match its declared type. Upload rejected.",
    );
  }

  const storagePath = await uploadToCloudinary(
    buffer,
    userId,
    spec.ext,
    declared,
  );

  return {
    storagePath,
    mimeType: declared,
    sizeBytes: buffer.length,
    originalName: safeOriginalName(originalName, spec.ext),
  };
}

export async function storeFile(
  userId: string,
  file: File,
  declaredType?: string,
): Promise<StoredFile> {
  if (!file || file.size === 0) {
    throw new ApiError(400, "The uploaded file is empty.");
  }

  const declared = (file.type || declaredType || "")
    .toLowerCase()
    .split(";")[0]
    .trim();

  return storeBuffer(
    userId,
    Buffer.from(await file.arrayBuffer()),
    file.name,
    declared,
  );
}

function parseStoragePath(storagePath: string): {
  resourceType: CloudinaryResourceType;
  publicId: string;
  format?: string;
} {
  const match = /^cloudinary:(image|raw):(.+)$/.exec(storagePath);

  if (!match) {
    throw new ApiError(400, "Invalid Cloudinary storage reference.");
  }

  const resourceType = match[1] as CloudinaryResourceType;
  let publicId = match[2];
  let format: string | undefined;

  if (resourceType === "image") {
    const extensionMatch = /\.([a-z0-9]+)$/i.exec(publicId);

    if (!extensionMatch) {
      throw new ApiError(400, "Invalid image storage reference.");
    }

    format = extensionMatch[1].toLowerCase();
    publicId = publicId.slice(0, -(format.length + 1));
  }

  return { resourceType, publicId, format };
}

export async function readFile(storagePath: string): Promise<Buffer> {
  ensureCloudinaryConfigured();

  const parsed = parseStoragePath(storagePath);

  try {
    const signedUrl = cloudinary.url(parsed.publicId, {
      resource_type: parsed.resourceType,
      type: "authenticated",
      sign_url: true,
      secure: true,
      ...(parsed.format ? { format: parsed.format } : {}),
    });

    const response = await fetch(signedUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Cloudinary download failed.");
    }

    return Buffer.from(await response.arrayBuffer());
  } catch {
    throw new ApiError(404, "Stored file could not be found on Cloudinary.");
  }
}

export async function deleteFile(storagePath: string) {
  if (!storagePath.startsWith("cloudinary:")) {
    return;
  }

  ensureCloudinaryConfigured();

  try {
    const { resourceType, publicId } = parseStoragePath(storagePath);

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: "authenticated",
      invalidate: true,
    });
  } catch {
    // A missing Cloudinary file should not prevent database cleanup.
  }
}
