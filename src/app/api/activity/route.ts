import { requireUser } from "@/lib/auth";
import { apiHandler, ok } from "@/lib/http";
import { recentActivity } from "@/lib/engage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const limit = Math.min(Number(new URL(request.url).searchParams.get("limit") ?? 12) || 12, 50);
    return ok({ items: await recentActivity(user.id, limit) });
  });
}
