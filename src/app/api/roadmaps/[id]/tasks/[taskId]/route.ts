import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { roadmapTasks, roadmaps } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { taskPatchSchema } from "@/lib/validation";
import { computeProgress } from "@/lib/engines";
import { notify, recordActivity } from "@/lib/engage";

type Ctx = { params: Promise<{ id: string; taskId: string }> };

async function ownedTask(userId: string, id: string, taskId: string) {
  const roadmap = await db.query.roadmaps.findFirst({
    where: and(eq(roadmaps.id, id), eq(roadmaps.userId, userId)),
  });
  if (!roadmap) throw new ApiError(404, "That roadmap does not exist.");
  const task = await db.query.roadmapTasks.findFirst({
    where: and(eq(roadmapTasks.id, taskId), eq(roadmapTasks.roadmapId, id)),
  });
  if (!task) throw new ApiError(404, "That task does not exist.");
  return { roadmap, task };
}

export async function PATCH(request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id, taskId } = await ctx.params;
    const { roadmap } = await ownedTask(user.id, id, taskId);
    const body = await parseBody(request, taskPatchSchema);

    const patch: Record<string, unknown> = { ...body };
    if (body.status === "done") patch.completedAt = new Date();
    else if (body.status) patch.completedAt = null;
    if (body.kind) patch.isMilestone = body.kind === "milestone";

    const [row] = await db
      .update(roadmapTasks)
      .set(patch)
      .where(and(eq(roadmapTasks.id, taskId), eq(roadmapTasks.roadmapId, id)))
      .returning();

    const tasks = await db.select().from(roadmapTasks).where(eq(roadmapTasks.roadmapId, id));
    const progress = computeProgress(tasks);

    let roadmapStatus = roadmap.status;
    if (progress.percent === 100 && progress.total > 0 && roadmap.status !== "completed") {
      roadmapStatus = "completed";
      await notify(user.id, {
        type: "success",
        title: "Roadmap complete",
        body: `You finished every task in "${roadmap.title}". Update your résumé to capture the new evidence.`,
        link: "/resume",
      });
    }
    await db
      .update(roadmaps)
      .set({ nextAction: progress.nextAction, status: roadmapStatus })
      .where(eq(roadmaps.id, id));

    if (body.status === "done") {
      await recordActivity(user.id, "task", `Completed "${row.title}" in ${roadmap.title}`, `/roadmaps/${id}`);
      if (row.isMilestone) {
        await notify(user.id, {
          type: "success",
          title: "Milestone reached",
          body: `${row.title} — ${progress.percent}% of the roadmap is done.`,
          link: `/roadmaps/${id}`,
        });
      }
    }

    return ok({ item: row, progress, roadmapStatus });
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id, taskId } = await ctx.params;
    const { roadmap, task } = await ownedTask(user.id, id, taskId);
    await db.delete(roadmapTasks).where(eq(roadmapTasks.id, taskId));
    const tasks = await db.select().from(roadmapTasks).where(eq(roadmapTasks.roadmapId, id));
    const progress = computeProgress(tasks);
    await db.update(roadmaps).set({ nextAction: progress.nextAction }).where(eq(roadmaps.id, id));
    await recordActivity(user.id, "task", `Removed task "${task.title}" from ${roadmap.title}`, `/roadmaps/${id}`);
    return ok({ ok: true, progress });
  });
}
