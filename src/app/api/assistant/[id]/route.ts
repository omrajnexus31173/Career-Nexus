import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler, ok } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const [row] = await db
      .delete(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That conversation does not exist.");
    return ok({ ok: true });
  });
}
