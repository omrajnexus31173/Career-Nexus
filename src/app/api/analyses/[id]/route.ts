import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyses } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler, ok } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const row = await db.query.analyses.findFirst({
      where: and(eq(analyses.id, id), eq(analyses.userId, user.id)),
    });
    if (!row) throw new ApiError(404, "That analysis does not exist.");
    return ok({ item: row });
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const [row] = await db
      .delete(analyses)
      .where(and(eq(analyses.id, id), eq(analyses.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That analysis does not exist.");
    return ok({ ok: true });
  });
}
