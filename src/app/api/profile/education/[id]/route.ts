import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { educations } from "@/db/schema";
import { ApiError, requireUser, requireWritableUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { educationSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/engage";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const { id } = await ctx.params;
    const body = await parseBody(request, educationSchema.partial());
    const [row] = await db
      .update(educations)
      .set(body)
      .where(and(eq(educations.id, id), eq(educations.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That education entry does not exist.");
    await recordActivity(user.id, "education", `Updated education: ${row.degree}`, "/profile");
    return ok({ item: row });
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const { id } = await ctx.params;
    const [row] = await db
      .delete(educations)
      .where(and(eq(educations.id, id), eq(educations.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That education entry does not exist.");
    await recordActivity(user.id, "education", `Removed education: ${row.degree}`, "/profile");
    return ok({ ok: true });
  });
}
