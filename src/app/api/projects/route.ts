import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { apiHandler, created, ok, parseBody } from "@/lib/http";
import { projectSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/engage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const status = new URL(request.url).searchParams.get("status");
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, user.id))
      .orderBy(projects.orderIndex, desc(projects.createdAt));
    return ok({ items: status && status !== "all" ? rows.filter((r) => r.status === status) : rows });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const body = await parseBody(request, projectSchema);
    const [row] = await db.insert(projects).values({ userId: user.id, ...body }).returning();
    await recordActivity(user.id, "project", `Added project: ${row.name}`, "/projects");
    return created({ item: row });
  });
}
