import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { roadmapTasks, roadmaps } from "@/db/schema";
import { ApiError, requireUser, requireWritableUser } from "@/lib/auth";
import { apiHandler, created, parseBody } from "@/lib/http";
import { taskSchema } from "@/lib/validation";
import { computeProgress } from "@/lib/engines";
import { recordActivity } from "@/lib/engage";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const { id } = await ctx.params;
    const roadmap = await db.query.roadmaps.findFirst({
      where: and(eq(roadmaps.id, id), eq(roadmaps.userId, user.id)),
    });
    if (!roadmap) throw new ApiError(404, "That roadmap does not exist.");

    const body = await parseBody(request, taskSchema);
    if (body.dueDay > roadmap.durationDays) {
      throw new ApiError(422, `Day ${body.dueDay} is outside this ${roadmap.durationDays}-day roadmap.`);
    }

    const [row] = await db
      .insert(roadmapTasks)
      .values({ roadmapId: id, ...body, isCustom: true, isMilestone: body.kind === "milestone" })
      .returning();

    const tasks = await db.select().from(roadmapTasks).where(eq(roadmapTasks.roadmapId, id));
    const progress = computeProgress(tasks);
    await db.update(roadmaps).set({ nextAction: progress.nextAction }).where(eq(roadmaps.id, id));
    await recordActivity(user.id, "task", `Added task to ${roadmap.title}: ${row.title}`, `/roadmaps/${id}`);
    return created({ item: row, progress });
  });
}
