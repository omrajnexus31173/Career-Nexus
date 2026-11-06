import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, createSession, normalizeEmail, requestMeta, verifyPassword } from "@/lib/auth";
import { apiHandler, ok, parseBody, rateLimit } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import { publicUser } from "@/lib/serialize";
import { recordActivity } from "@/lib/engage";
import { DEMO_EMAIL, resetDemoAccount } from "@/lib/seed";

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: Request) {
  return apiHandler(async () => {
    await rateLimit("login", 12, 5 * 60 * 1000);
    const body = await parseBody(request, loginSchema);

    const user = await db.query.users.findFirst({ where: eq(users.email, normalizeEmail(body.email)) });
    if (!user) {
      await pause(250); // equalise timing so account existence is not inferable
      throw new ApiError(401, "Incorrect email or password.");
    }
    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      await pause(250);
      throw new ApiError(401, "Incorrect email or password.");
    }

    if (normalizeEmail(body.email) === DEMO_EMAIL) {
      const freshUser = await resetDemoAccount();
      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, freshUser.id));
      await createSession(freshUser.id, await requestMeta());
      return ok({ user: publicUser(freshUser) });
    }

    if (normalizeEmail(body.email) === DEMO_EMAIL) {
      const freshUser = await resetDemoAccount();
      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, freshUser.id));
      await createSession(freshUser.id, await requestMeta());
      return ok({ user: publicUser(freshUser) });
    }

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    await createSession(user.id, await requestMeta());
    await recordActivity(user.id, "auth", "Signed in");

    return ok({ user: publicUser(user) });
  });
}
