import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userLanguages } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { languageSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/engage";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await parseBody(request, languageSchema.partial());
    const [row] = await db
      .update(userLanguages)
      .set(body)
      .where(and(eq(userLanguages.id, id), eq(userLanguages.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That language is not on your profile.");
    await recordActivity(user.id, "language", `Updated ${row.name} proficiency`, "/skills");
    return ok({ item: row });
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const [row] = await db
      .delete(userLanguages)
      .where(and(eq(userLanguages.id, id), eq(userLanguages.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That language is not on your profile.");
    await recordActivity(user.id, "language", `Removed ${row.name}`, "/skills");
    return ok({ ok: true });
  });
}
