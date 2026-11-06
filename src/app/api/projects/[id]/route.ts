import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { ApiError, requireUser, requireWritableUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { projectSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/engage";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const row = await db.query.projects.findFirst({
      where: and(eq(projects.id, id), eq(projects.userId, user.id)),
    });
    if (!row) throw new ApiError(404, "That project does not exist.");
    return ok({ item: row });
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const { id } = await ctx.params;
    const body = await parseBody(request, projectSchema.partial());
    const [row] = await db
      .update(projects)
      .set(body)
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That project does not exist.");
    await recordActivity(user.id, "project", `Updated project: ${row.name}`, "/projects");
    return ok({ item: row });
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const { id } = await ctx.params;
    const [row] = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That project does not exist.");
    await recordActivity(user.id, "project", `Deleted project: ${row.name}`, "/projects");
    return ok({ ok: true });
  });
}
