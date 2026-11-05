import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, settings, users } from "@/db/schema";
import { ApiError, createSession, hashPassword, normalizeEmail, requestMeta } from "@/lib/auth";
import { apiHandler, created, parseBody, rateLimit } from "@/lib/http";
import { registerSchema } from "@/lib/validation";
import { publicUser } from "@/lib/serialize";
import { notify, recordActivity } from "@/lib/engage";

export async function POST(request: Request) {
  return apiHandler(async () => {
    await rateLimit("register", 8, 10 * 60 * 1000);
    const body = await parseBody(request, registerSchema);
    const email = normalizeEmail(body.email);

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      throw new ApiError(409, "An account already exists with that email. Try signing in instead.");
    }

    const [user] = await db
      .insert(users)
      .values({ email, passwordHash: await hashPassword(body.password), fullName: body.fullName.trim() })
      .returning();

    await db.insert(profiles).values({ userId: user.id });
    await db.insert(settings).values({ userId: user.id });
    await createSession(user.id, await requestMeta());
    await recordActivity(user.id, "account", "Created a Career Nexus account");
    await notify(user.id, {
      type: "success",
      title: "Welcome to Career Nexus",
      body: "Start with your profile — every recommendation on this platform is computed from it.",
      link: "/profile",
    });

    return created({ user: publicUser(user) });
  });
}
