import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyses } from "@/db/schema";
import { ApiError, requireUser, requireWritableUser } from "@/lib/auth";
import { apiHandler, created, ok, parseBody } from "@/lib/http";
import { analysisSchema } from "@/lib/validation";
import { analyseAgainst, loadSnapshot, persistAnalysis, getCareer } from "@/lib/engines";
import { aiCareerInsight, aiStatus } from "@/lib/ai";
import { notify, recordActivity } from "@/lib/engage";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiHandler(async () => {
    const user = await requireUser();
    const rows = await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, user.id))
      .orderBy(desc(analyses.createdAt));
    return ok({ items: rows, ai: aiStatus() });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const body = await parseBody(request, analysisSchema);
    const career = getCareer(body.careerId);
    if (!career) throw new ApiError(404, "That career path is not in the catalogue.");

    const snapshot = await loadSnapshot(user.id);
    const result = analyseAgainst(snapshot, career);

    let aiInsight: string | null = null;
    let engine = "rules";
    if (body.useAi) {
      const ai = aiStatus();
      if (ai.configured) {
        aiInsight = await aiCareerInsight(result, {
          userName: user.fullName,
          snapshot,
          analysis: result,
          roadmap: null,
          progress: null,
          history: [],
        });
        if (aiInsight) engine = `rules+${ai.provider}`;
      }
    }

    const row = await persistAnalysis(user.id, result, engine, aiInsight ?? undefined);

    await recordActivity(user.id, "analysis", `Ran a career analysis for ${career.title} — ${result.readinessScore}% ready`, "/analyzer");
    await notify(user.id, {
      type: result.readinessScore >= 70 ? "success" : "info",
      title: `Career analysis ready: ${career.title}`,
      body: `${result.readinessScore}% match · ${result.gaps.filter((g) => g.priority === "high").length} high-priority gaps identified from your real profile data.`,
      link: `/analyzer?id=${row.id}`,
    });

    return created({ item: row, ai: aiStatus() });
  });
}