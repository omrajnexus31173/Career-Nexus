import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages, roadmapTasks, roadmaps } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler, created, ok, parseBody } from "@/lib/http";
import { chatSchema } from "@/lib/validation";
import { aiStatus, askAssistant } from "@/lib/ai";
import { computeProgress, latestAnalysis, loadSnapshot } from "@/lib/engines";
import { recordActivity } from "@/lib/engage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const convo = await db.query.conversations.findFirst({
        where: and(eq(conversations.id, id), eq(conversations.userId, user.id)),
      });
      if (!convo) throw new ApiError(404, "That conversation does not exist.");
      const history = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, convo.id))
        .orderBy(asc(messages.createdAt));
      return ok({ conversation: convo, messages: history, ai: aiStatus() });
    }

    const items = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, user.id))
      .orderBy(desc(conversations.createdAt))
      .limit(40);
    return ok({ items, ai: aiStatus() });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const body = await parseBody(request, chatSchema);

    let conversation = body.conversationId
      ? await db.query.conversations.findFirst({
          where: and(eq(conversations.id, body.conversationId), eq(conversations.userId, user.id)),
        })
      : null;
    if (body.conversationId && !conversation) {
      throw new ApiError(404, "That conversation does not exist.");
    }
    if (!conversation) {
      [conversation] = await db
        .insert(conversations)
        .values({ userId: user.id, title: body.message.slice(0, 70) })
        .returning();
    }

    const prior = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(desc(messages.createdAt))
      .limit(12);
    const history = prior.reverse().map((m) => ({ role: m.role, content: m.content }));

    const [snapshot, latest, activeRoadmap] = await Promise.all([
      loadSnapshot(user.id),
      latestAnalysis(user.id),
      db.query.roadmaps.findFirst({
        where: and(eq(roadmaps.userId, user.id), eq(roadmaps.status, "active")),
        orderBy: [desc(roadmaps.createdAt)],
      }),
    ]);

    let progress: { percent: number; done: number; total: number; nextAction: string } | null = null;
    if (activeRoadmap) {
      const tasks = await db.select().from(roadmapTasks).where(eq(roadmapTasks.roadmapId, activeRoadmap.id));
      const p = computeProgress(tasks);
      progress = { percent: p.percent, done: p.done, total: p.total, nextAction: p.nextAction };
    }

    await db.insert(messages).values({
      conversationId: conversation.id,
      userId: user.id,
      role: "user",
      content: body.message,
    });

    const reply = await askAssistant(body.message, {
      userName: user.fullName,
      snapshot,
      analysis: latest
        ? {
            careerId: latest.careerId,
            careerTitle: latest.careerTitle,
            readinessScore: latest.readinessScore,
            gaps: latest.gaps ?? [],
            strengths: latest.strengths ?? [],
            recommendedCertifications: latest.recommendedCertifications ?? [],
          }
        : null,
      roadmap: activeRoadmap
        ? {
            title: activeRoadmap.title,
            durationDays: activeRoadmap.durationDays,
            weeklyHours: activeRoadmap.weeklyHours,
            status: activeRoadmap.status,
          }
        : null,
      progress,
      history,
    });

    const [saved] = await db
      .insert(messages)
      .values({
        conversationId: conversation.id,
        userId: user.id,
        role: "assistant",
        content: reply.content,
        provider: reply.provider,
      })
      .returning();

    if (history.length === 0) {
      await recordActivity(user.id, "assistant", `Started a Nexus AI conversation: "${conversation.title}"`, "/assistant");
    }

    return created({
      conversation,
      message: saved,
      notice: reply.notice,
      provider: reply.provider,
      ai: aiStatus(),
    });
  });
}
