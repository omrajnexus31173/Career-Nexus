import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets } from "@/db/schema";
import { hashToken, randomToken, requireUser } from "@/lib/auth";
import { apiHandler, ok, rateLimit } from "@/lib/http";
import { recordActivity } from "@/lib/engage";

/**
 * Offline recovery path. Email delivery requires RESEND_API_KEY; a signed-in user can mint a
 * single-use recovery code instead, which is shown exactly once and stored only as a hash.
 */
export async function POST() {
  return apiHandler(async () => {
    await rateLimit("recovery-code", 5, 60 * 60 * 1000);
    const user = await requireUser();

    await db.update(passwordResets).set({ usedAt: new Date() })
      .where(and(eq(passwordResets.userId, user.id), isNull(passwordResets.usedAt)));

    const code = `${randomToken(4)}-${randomToken(4)}-${randomToken(4)}`;
    await db.insert(passwordResets).values({
      userId: user.id,
      tokenHash: hashToken(code),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await recordActivity(user.id, "auth", "Generated a password recovery code");

    return ok({ code, expiresInHours: 24 });
  });
}
