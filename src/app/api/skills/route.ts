import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { skillCatalog, userSkills } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler, created, ok, parseBody } from "@/lib/http";
import { skillSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/engage";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiHandler(async () => {
    const user = await requireUser();
    const rows = await db
      .select()
      .from(userSkills)
      .where(eq(userSkills.userId, user.id))
      .orderBy(desc(userSkills.createdAt));
    return ok({ items: rows });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const body = await parseBody(request, skillSchema);
    const name = body.name.trim();

    const dupe = await db.query.userSkills.findFirst({
      where: (s, { and, eq }) => and(eq(s.userId, user.id), eq(s.name, name)),
    });
    if (dupe) throw new ApiError(409, `${name} is already on your profile.`);

    const [row] = await db
      .insert(userSkills)
      .values({ userId: user.id, ...body, name })
      .onConflictDoNothing()
      .returning();
    if (!row) throw new ApiError(409, `${name} is already on your profile.`);

    if (body.isCustom) {
      await db
        .insert(skillCatalog)
        .values({ name, category: body.category, isCustom: true, createdByUserId: user.id })
        .onConflictDoNothing();
    }
    await recordActivity(user.id, "skill", `Added ${name} (${body.proficiency}) to your skills`, "/skills");
    return created({ item: row });
  });
}
