import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { hashToken, normalizeEmail, randomToken } from "@/lib/auth";
import { apiHandler, ok, parseBody, rateLimit } from "@/lib/http";
import { forgotPasswordSchema } from "@/lib/validation";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  return apiHandler(async () => {
    await rateLimit("forgot-password", 5, 15 * 60 * 1000);
    const body = await parseBody(request, forgotPasswordSchema);
    const origin = new URL(request.url).origin;

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizeEmail(body.email)),
    });

    if (!user) {
      // Identical response for unknown emails: no account enumeration.
      return ok({ ok: true, delivered: false, unknownAccount: true });
    }

    await db
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResets.userId, user.id), isNull(passwordResets.usedAt)));

    const token = randomToken(32);
    await db.insert(passwordResets).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const link = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
    const result = await sendEmail({
      to: user.email,
      subject: "Reset your Career Nexus password",
      text: `Hi ${user.fullName},\n\nUse this link to reset your password (valid for 1 hour):\n${link}\n\nIf you did not request this, ignore this email.`,
      html: `<p>Hi ${user.fullName},</p><p><a href="${link}">Reset your Career Nexus password</a> — valid for 1 hour.</p><p>If you did not request this, ignore this email.</p>`,
    });

    return ok({ ok: true, delivered: result.delivered, reason: result.reason });
  });
}
