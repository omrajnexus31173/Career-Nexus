import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userSkills } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { skillSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/engage";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await parseBody(request, skillSchema.partial());
    const [row] = await db
      .update(userSkills)
      .set(body)
      .where(and(eq(userSkills.id, id), eq(userSkills.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That skill is not on your profile.");
    await recordActivity(user.id, "skill", `Updated ${row.name} to ${row.proficiency}`, "/skills");
    return ok({ item: row });
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const [row] = await db
      .delete(userSkills)
      .where(and(eq(userSkills.id, id), eq(userSkills.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That skill is not on your profile.");
    await recordActivity(user.id, "skill", `Removed ${row.name} from your skills`, "/skills");
    return ok({ ok: true });
  });
}
