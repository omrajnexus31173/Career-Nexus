import { and, eq } from "drizzle-orm";
import { readFile } from "@/lib/storage";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler } from "@/lib/http";
import { renderResumePdf, resolveResumeData } from "@/lib/resume";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const resume = await db.query.resumes.findFirst({
      where: and(eq(resumes.id, id), eq(resumes.userId, user.id)),
    });
    if (!resume) throw new ApiError(404, "That résumé does not exist.");

    const data = await resolveResumeData(user, resume);

    let avatarBuffer: Awaited<ReturnType<typeof readFile>> | undefined;

    const avatarExtension = user.avatarUrl?.split(".").pop()?.toLowerCase();

    if (
      user.avatarUrl &&
      ["png", "jpg", "jpeg"].includes(avatarExtension ?? "")
    ) {
      try {
        avatarBuffer = await readFile(user.avatarUrl);
      } catch (error) {
        console.error("Resume avatar could not be loaded: - route.ts:35", error);
      }
    }

    const pdf = await renderResumePdf(data, resume.title, avatarBuffer);
    const filename = `${resume.title.replace(/[^\w\-]+/g, "-").replace(/^-|-$/g, "") || "resume"}.pdf`;

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.length),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  });
}
