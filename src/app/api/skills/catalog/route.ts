import { eq } from "drizzle-orm";
import { db } from "@/db";
import { skillCatalog, userSkills } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { apiHandler, fail, ok } from "@/lib/http";
import { ALL_SKILLS, SKILL_CATEGORIES } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/**
 * Searchable skill catalogue. Public taxonomy plus the signed-in user's own custom skills.
 * Nothing is restricted to a small hardcoded list.
 */
export async function GET(request: Request) {
  return apiHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return fail(401, "Please sign in to continue.");
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const category = url.searchParams.get("category") ?? "";

    const custom = await db
      .select()
      .from(skillCatalog)
      .where(eq(skillCatalog.createdByUserId, user.id));

    const owned = new Set(
      (await db.select({ name: userSkills.name }).from(userSkills).where(eq(userSkills.userId, user.id))).map(
        (r) => r.name.toLowerCase(),
      ),
    );

    const merged = [
      ...ALL_SKILLS,
      ...custom.map((c) => ({ name: c.name, category: c.category, custom: true })),
    ];

    const filtered = merged
      .filter((s) => (category ? s.category === category : true))
      .filter((s) => (query ? s.name.toLowerCase().includes(query) : true))
      .slice(0, query ? 60 : 400)
      .map((s) => ({ ...s, added: owned.has(s.name.toLowerCase()) }));

    return ok({
      categories: Object.keys(SKILL_CATEGORIES),
      items: filtered,
      total: merged.length,
    });
  });
}
