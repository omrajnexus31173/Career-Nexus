import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler, ok } from "@/lib/http";
import { deleteFile, storeFile } from "@/lib/storage";
import { recordActivity } from "@/lib/engage";

export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const form = await request.formData().catch(() => {
      throw new ApiError(400, "Expected a multipart/form-data upload.");
    });
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "No image was attached.");

    const stored = await storeFile(user.id, file);
    if (!stored.mimeType.startsWith("image/")) {
      await deleteFile(stored.storagePath);
      throw new ApiError(415, "Profile photo must be a PNG, JPG or WEBP image.");
    }
    if (user.avatarUrl) await deleteFile(user.avatarUrl);

    await db.update(users).set({ avatarUrl: stored.storagePath, updatedAt: new Date() }).where(eq(users.id, user.id));
    await recordActivity(user.id, "profile", "Updated profile photo", "/profile");
    return ok({ avatarUrl: "/api/avatar/file" });
  });
}
