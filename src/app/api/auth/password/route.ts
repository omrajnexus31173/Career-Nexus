import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { ApiError, hashPassword, requireUser, resolveSession } from "@/lib/auth";
import { apiHandler, ok, parseBody, rateLimit } from "@/lib/http";
import { changePasswordSchema } from "@/lib/validation";
import { verifyPassword } from "@/lib/auth";
import { recordActivity } from "@/lib/engage";

export async function POST(request: Request) {
  return apiHandler(async () => {
    await rateLimit("change-password", 8, 15 * 60 * 1000);
    const user = await requireUser();
    const ctx = await resolveSession();
    const body = await parseBody(request, changePasswordSchema);

    if (!(await verifyPassword(body.currentPassword, user.passwordHash))) {
      throw new ApiError(401, "Your current password is incorrect.");
    }
    if (await verifyPassword(body.newPassword, user.passwordHash)) {
      throw new ApiError(422, "Choose a password you have not used before.");
    }

    await db.update(users).set({ passwordHash: await hashPassword(body.newPassword), updatedAt: new Date() })
      .where(eq(users.id, user.id));
    await db.update(sessions).set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, user.id), isNull(sessions.revokedAt), ne(sessions.id, ctx!.sessionId)));
    await recordActivity(user.id, "auth", "Changed account password");

    return ok({ ok: true });
  });
}
