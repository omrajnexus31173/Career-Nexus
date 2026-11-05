import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets, sessions, users } from "@/db/schema";
import { ApiError, createSession, hashPassword, hashToken, requestMeta } from "@/lib/auth";
import { apiHandler, ok, parseBody, rateLimit } from "@/lib/http";
import { resetPasswordSchema } from "@/lib/validation";
import { publicUser } from "@/lib/serialize";
import { recordActivity } from "@/lib/engage";

export async function POST(request: Request) {
  return apiHandler(async () => {
    await rateLimit("reset-password", 8, 15 * 60 * 1000);
    const body = await parseBody(request, resetPasswordSchema);

    const token = await db.query.passwordResets.findFirst({
      where: and(
        eq(passwordResets.tokenHash, hashToken(body.token)),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date()),
      ),
    });
    if (!token) {
      throw new ApiError(400, "This reset link is invalid or has expired. Request a new one.");
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, token.userId) });
    if (!user) throw new ApiError(400, "That account no longer exists.");

    await db.update(users).set({ passwordHash: await hashPassword(body.password), updatedAt: new Date() })
      .where(eq(users.id, user.id));
    await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, token.id));
    // Invalidate every existing session for this account.
    await db.update(sessions).set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, user.id), isNull(sessions.revokedAt)));

    await createSession(user.id, await requestMeta());
    await recordActivity(user.id, "auth", "Reset password and signed in");

    return ok({ user: publicUser(user) });
  });
}
