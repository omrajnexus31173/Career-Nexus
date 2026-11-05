import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { roadmapTasks, roadmaps } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { apiHandler, created, ok, parseBody } from "@/lib/http";
import { roadmapSchema } from "@/lib/validation";
import { buildRoadmap, computeProgress } from "@/lib/engines";
import { notify, recordActivity } from "@/lib/engage";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiHandler(async () => {
    const user = await requireUser();
    const rows = await db
      .select()
      .from(roadmaps)
      .where(eq(roadmaps.userId, user.id))
      .orderBy(desc(roadmaps.createdAt));

    const items = await Promise.all(
      rows.map(async (r) => {
        const tasks = await db.select().from(roadmapTasks).where(eq(roadmapTasks.roadmapId, r.id));
        return { ...r, progress: computeProgress(tasks) };
      }),
    );
    return ok({ items });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const body = await parseBody(request, roadmapSchema);
    const result = await buildRoadmap(user.id, body);

    await recordActivity(
      user.id,
      "roadmap",
      `Generated "${result.roadmap.title}" — ${result.taskCount} tasks across ${result.phases.length} phases`,
      `/roadmaps/${result.roadmap.id}`,
    );
    await notify(user.id, {
      type: "success",
      title: "Your roadmap is ready",
      body: `${result.roadmap.title}: ${result.taskCount} tasks planned over ${result.roadmap.durationDays} days at ${result.roadmap.weeklyHours} h/week.`,
      link: `/roadmaps/${result.roadmap.id}`,
    });

    return created({ roadmap: result.roadmap, phases: result.phases, taskCount: result.taskCount });
  });
}
