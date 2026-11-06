import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser, requireWritableUser } from "@/lib/auth";
import { apiHandler, ok } from "@/lib/http";
import { listNotifications, unreadCount } from "@/lib/engage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const summary = new URL(request.url).searchParams.get("summary") === "1";
    const unread = await unreadCount(user.id);
    if (summary) return ok({ unread });
    const items = await listNotifications(user.id, 50);
    return ok({ items, unread });
  });
}

export async function PATCH() {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
    return ok({ ok: true, unread: 0 });
  });
}
