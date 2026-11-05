import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { experiences } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { experienceSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/engage";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await parseBody(request, experienceSchema.partial());
    const [row] = await db
      .update(experiences)
      .set(body)
      .where(and(eq(experiences.id, id), eq(experiences.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That work experience entry does not exist.");
    await recordActivity(user.id, "experience", `Updated work experience: ${row.role}`, "/profile");
    return ok({ item: row });
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const [row] = await db
      .delete(experiences)
      .where(and(eq(experiences.id, id), eq(experiences.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That work experience entry does not exist.");
    await recordActivity(user.id, "experience", `Removed work experience: ${row.role}`, "/profile");
    return ok({ ok: true });
  });
}
