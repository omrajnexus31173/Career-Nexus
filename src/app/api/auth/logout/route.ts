import { destroySession } from "@/lib/auth";
import { apiHandler, ok } from "@/lib/http";
import { rateLimit } from "@/lib/http";

export async function POST() {
  return apiHandler(async () => {
    await rateLimit("logout", 30, 5 * 60 * 1000);
    await destroySession();
    return ok({ ok: true });
  });
}
