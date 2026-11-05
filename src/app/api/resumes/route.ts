import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { apiHandler, created, ok, parseBody } from "@/lib/http";
import { resumeSchema } from "@/lib/validation";
import { defaultResumeInput, resolveResumeData } from "@/lib/resume";
import { recordActivity } from "@/lib/engage";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiHandler(async () => {
    const user = await requireUser();
    const rows = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, user.id))
      .orderBy(desc(resumes.updatedAt));
    return ok({ items: rows });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const body = await parseBody(request, resumeSchema.partial()).catch(() => ({}));
    const values = { userId: user.id, ...defaultResumeInput(user), ...body };
    const [row] = await db.insert(resumes).values(values).returning();
    const data = await resolveResumeData(user, row);
    await recordActivity(user.id, "resume", `Created résumé: ${row.title}`, "/resume");
    return created({ resume: row, data });
  });
}
