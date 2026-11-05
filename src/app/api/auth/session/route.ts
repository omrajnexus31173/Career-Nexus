import { resolveSession } from "@/lib/auth";
import { apiHandler, fail, ok } from "@/lib/http";
import { publicUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/** The single endpoint the client uses to verify "am I still signed in?". */
export async function GET() {
  return apiHandler(async () => {
    const ctx = await resolveSession();
    if (!ctx) return fail(401, "You are not signed in.");
    return ok({ authenticated: true, user: publicUser(ctx.user) });
  });
}
