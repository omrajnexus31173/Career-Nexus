import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { experiences } from "@/db/schema";
import { requireUser, requireWritableUser } from "@/lib/auth";
import { apiHandler, created, ok, parseBody } from "@/lib/http";
import { experienceSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/engage";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiHandler(async () => {
    const user = await requireUser();
    const rows = await db
      .select()
      .from(experiences)
      .where(eq(experiences.userId, user.id))
      .orderBy(experiences.orderIndex, desc(experiences.createdAt));
    return ok({ items: rows });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const body = await parseBody(request, experienceSchema);
    const [row] = await db
      .insert(experiences)
      .values({ userId: user.id, ...body })
      .returning();
    await recordActivity(user.id, "experience", `Added work experience: ${row.role} at ${row.company}`, "/profile");
    return created({ item: row });
  });
}
