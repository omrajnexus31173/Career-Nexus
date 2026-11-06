import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { certifications, documents } from "@/db/schema";
import { ApiError, requireUser, requireWritableUser } from "@/lib/auth";
import { apiHandler, created, ok } from "@/lib/http";
import { recordActivity } from "@/lib/engage";
import { storeFile, ALLOWED_LABEL, MAX_UPLOAD_BYTES } from "@/lib/storage";
import { publicDocument } from "@/lib/serialize";

export const dynamic = "force-dynamic";

const CATEGORIES = ["certificate", "resume", "project", "portfolio", "academic", "other"];

export async function GET(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const rows = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, user.id))
      .orderBy(desc(documents.createdAt));
    const filtered = rows
      .filter((r) => (category && category !== "all" ? r.category === category : true))
      .filter((r) => (q ? `${r.title} ${r.originalName} ${r.note ?? ""}`.toLowerCase().includes(q) : true));
    return ok({
      items: filtered.map((row) => publicDocument(row)),
      categories: CATEGORIES,
      maxBytes: MAX_UPLOAD_BYTES,
      allowed: ALLOWED_LABEL,
    });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const form = await request.formData().catch(() => {
      throw new ApiError(400, "Expected a multipart/form-data upload.");
    });

    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "No file was attached to the upload.");

    const title = String(form.get("title") ?? "").trim().slice(0, 160);
    const category = String(form.get("category") ?? "other").trim();
    const note = String(form.get("note") ?? "").trim().slice(0, 500) || null;
    const issuer = String(form.get("issuer") ?? "").trim().slice(0, 140) || null;
    const issuedAt = String(form.get("issuedAt") ?? "").trim().slice(0, 20) || null;

    if (!title) throw new ApiError(422, "Give the document a title so you can find it later.");
    if (!CATEGORIES.includes(category)) throw new ApiError(422, "Unknown document category.");

    const stored = await storeFile(user.id, file);
    const [row] = await db
      .insert(documents)
      .values({
        userId: user.id,
        title,
        category,
        note,
        originalName: stored.originalName,
        storagePath: stored.storagePath,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      })
      .returning();

    if (category === "certificate") {
      await db.insert(certifications).values({
        userId: user.id,
        name: title,
        issuer,
        issuedAt,
        documentId: row.id,
      });
    }

    await recordActivity(user.id, "document", `Uploaded ${title} (${stored.originalName})`, "/documents");
    return created({ item: publicDocument(row) });
  });
}
