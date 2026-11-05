import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { educations } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { apiHandler, created, ok, parseBody } from "@/lib/http";
import { educationSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/engage";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiHandler(async () => {
    const user = await requireUser();
    const rows = await db
      .select()
      .from(educations)
      .where(eq(educations.userId, user.id))
      .orderBy(educations.orderIndex, desc(educations.createdAt));
    return ok({ items: rows });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const body = await parseBody(request, educationSchema);
    const [row] = await db
      .insert(educations)
      .values({ userId: user.id, ...body })
      .returning();
    await recordActivity(user.id, "education", `Added education: ${row.degree} at ${row.institution}`, "/profile");
    return created({ item: row });
  });
}
