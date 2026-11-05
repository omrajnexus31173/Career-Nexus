import { db } from "@/db";
import { requireUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { settingsSchema } from "@/lib/validation";
import { ensureSettings } from "@/lib/engage";
import { eq } from "drizzle-orm";
import { settings } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiHandler(async () => {
    const user = await requireUser();
    return ok({ settings: await ensureSettings(user.id) });
  });
}

export async function PATCH(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const body = await parseBody(request, settingsSchema);
    await ensureSettings(user.id);
    const [row] = await db
      .update(settings)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(settings.userId, user.id))
      .returning();
    return ok({ settings: row });
  });
}
