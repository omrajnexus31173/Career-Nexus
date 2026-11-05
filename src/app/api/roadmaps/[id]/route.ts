import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { roadmapPhases, roadmapTasks, roadmaps } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { roadmapPatchSchema } from "@/lib/validation";
import { computeProgress } from "@/lib/engines";
import { recordActivity } from "@/lib/engage";

type Ctx = { params: Promise<{ id: string }> };

async function owned(userId: string, id: string) {
  const row = await db.query.roadmaps.findFirst({
    where: and(eq(roadmaps.id, id), eq(roadmaps.userId, userId)),
  });
  if (!row) throw new ApiError(404, "That roadmap does not exist.");
  return row;
}

export async function GET(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const roadmap = await owned(user.id, id);
    const [phases, tasks] = await Promise.all([
      db.select().from(roadmapPhases).where(eq(roadmapPhases.roadmapId, id)).orderBy(asc(roadmapPhases.orderIndex)),
      db.select().from(roadmapTasks).where(eq(roadmapTasks.roadmapId, id)).orderBy(asc(roadmapTasks.dueDay), asc(roadmapTasks.orderIndex)),
    ]);
    return ok({ roadmap, phases, tasks, progress: computeProgress(tasks) });
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    await owned(user.id, id);
    const body = await parseBody(request, roadmapPatchSchema);
    const [row] = await db.update(roadmaps).set(body).where(eq(roadmaps.id, id)).returning();
    await recordActivity(user.id, "roadmap", `Roadmap ${body.status ?? "details"} updated: ${row.title}`, `/roadmaps/${id}`);
    return ok({ roadmap: row });
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const row = await owned(user.id, id);
    await db.delete(roadmaps).where(eq(roadmaps.id, id));
    await recordActivity(user.id, "roadmap", `Deleted roadmap: ${row.title}`, "/roadmaps");
    return ok({ ok: true });
  });
}
