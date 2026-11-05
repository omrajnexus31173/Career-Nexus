import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { certifications } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { certificationSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/engage";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await parseBody(request, certificationSchema.partial());
    const [row] = await db
      .update(certifications)
      .set(body)
      .where(and(eq(certifications.id, id), eq(certifications.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That certification does not exist.");
    await recordActivity(user.id, "certification", `Updated certification: ${row.name}`, "/documents");
    return ok({ item: row });
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const [row] = await db
      .delete(certifications)
      .where(and(eq(certifications.id, id), eq(certifications.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That certification does not exist.");
    await recordActivity(user.id, "certification", `Removed certification: ${row.name}`, "/documents");
    return ok({ ok: true });
  });
}
