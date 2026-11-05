import { CAREERS, CAREER_FAMILIES, getCareer } from "@/lib/catalog";
import { apiHandler, fail, ok } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return apiHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return fail(401, "Please sign in to continue.");
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (id) {
      const career = getCareer(id);
      if (!career) return fail(404, "Unknown career.");
      return ok({ career });
    }
    const family = url.searchParams.get("family");
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const items = CAREERS.filter((c) => (family && family !== "all" ? c.family === family : true)).filter((c) =>
      q ? `${c.title} ${c.family} ${c.summary}`.toLowerCase().includes(q) : true,
    );
    return ok({ items, families: CAREER_FAMILIES });
  });
}
