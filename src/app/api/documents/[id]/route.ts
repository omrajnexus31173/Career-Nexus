import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { certifications, documents } from "@/db/schema";
import { ApiError, requireUser, requireWritableUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { recordActivity } from "@/lib/engage";
import { deleteFile } from "@/lib/storage";
import { publicDocument } from "@/lib/serialize";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty.").max(160).optional(),
  category: z.enum(["certificate", "resume", "project", "portfolio", "academic", "other"]).optional(),
  note: z.string().trim().max(500).nullable().optional(),
});

async function owned(userId: string, id: string) {
  const row = await db.query.documents.findFirst({
    where: and(eq(documents.id, id), eq(documents.userId, userId)),
  });
  if (!row) throw new ApiError(404, "That document does not exist or is not yours.");
  return row;
}

export async function GET(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const row = await owned(user.id, id);
    return ok({ item: publicDocument(row) });
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const { id } = await ctx.params;
    const existing = await owned(user.id, id);
    const body = await parseBody(request, patchSchema);

    // Nothing to change: return the current record instead of issuing an empty UPDATE.
    if (Object.keys(body).length === 0) {
      return ok({ item: publicDocument(existing) });
    }

    const [row] = await db
      .update(documents)
      .set(body)
      .where(and(eq(documents.id, id), eq(documents.userId, user.id)))
      .returning();
    await recordActivity(user.id, "document", `Updated document details: ${row.title}`, "/documents");
    return ok({ item: publicDocument(row) });
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const { id } = await ctx.params;
    const row = await owned(user.id, id);
    await db.delete(certifications).where(eq(certifications.documentId, row.id));
    await db.delete(documents).where(and(eq(documents.id, id), eq(documents.userId, user.id)));
    await deleteFile(row.storagePath);
    await recordActivity(user.id, "document", `Deleted document: ${row.title}`, "/documents");
    return ok({ ok: true });
  });
}
