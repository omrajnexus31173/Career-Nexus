import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, settings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { profileSchema } from "@/lib/validation";
import { computeCompletion, ensureSettings, loadCounts, recordActivity } from "@/lib/engage";
import { publicUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiHandler(async () => {
    const user = await requireUser();
    const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });
    const userSettings = await ensureSettings(user.id);
    const counts = await loadCounts(user.id);
    return ok({
      user: publicUser(user),
      profile,
      settings: userSettings,
      counts,
      completion: computeCompletion(user, profile ?? undefined, counts),
    });
  });
}

export async function PATCH(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const body = await parseBody(request, profileSchema);

    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") cleaned[key] = value.trim() === "" ? null : value.trim();
      else cleaned[key] = value;
    }

    const [profile] = await db
      .insert(profiles)
      .values({ userId: user.id, ...cleaned })
      .onConflictDoUpdate({ target: profiles.userId, set: { ...cleaned, updatedAt: new Date() } })
      .returning();

    await recordActivity(user.id, "profile", "Updated profile details", "/profile");
    const counts = await loadCounts(user.id);
    return ok({ profile, completion: computeCompletion(user, profile, counts) });
  });
}
