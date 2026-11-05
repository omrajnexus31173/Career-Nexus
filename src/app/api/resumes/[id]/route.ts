import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { resumeSchema } from "@/lib/validation";
import { resolveResumeData } from "@/lib/resume";
import { recordActivity } from "@/lib/engage";

type Ctx = { params: Promise<{ id: string }> };

async function owned(userId: string, id: string) {
  const row = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, id), eq(resumes.userId, userId)),
  });
  if (!row) throw new ApiError(404, "That résumé does not exist.");
  return row;
}

export async function GET(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const resume = await owned(user.id, id);
    return ok({ resume, data: await resolveResumeData(user, resume) });
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    await owned(user.id, id);
    const body = await parseBody(request, resumeSchema.partial());
    const [row] = await db
      .update(resumes)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
      .returning();
    await recordActivity(user.id, "resume", `Updated résumé: ${row.title}`, "/resume");
    return ok({ resume: row, data: await resolveResumeData(user, row) });
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const row = await owned(user.id, id);
    await db.delete(resumes).where(eq(resumes.id, id));
    await recordActivity(user.id, "resume", `Deleted résumé: ${row.title}`, "/resume");
    return ok({ ok: true });
  });
}
