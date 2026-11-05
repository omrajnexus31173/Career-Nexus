import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { notificationPatchSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await parseBody(request, notificationPatchSchema);
    const [row] = await db
      .update(notifications)
      .set({ readAt: body.read ? new Date() : null })
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That notification does not exist.");
    return ok({ item: row });
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const [row] = await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
      .returning();
    if (!row) throw new ApiError(404, "That notification does not exist.");
    return ok({ ok: true });
  });
}
