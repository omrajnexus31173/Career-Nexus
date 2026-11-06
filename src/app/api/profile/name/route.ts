import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser, requireWritableUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { publicUser } from "@/lib/serialize";
import { recordActivity } from "@/lib/engage";

const schema = z.object({ fullName: z.string().trim().min(2).max(120) });

export async function PATCH(request: Request) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const body = await parseBody(request, schema);
    const [row] = await db
      .update(users)
      .set({ fullName: body.fullName, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();
    await recordActivity(user.id, "profile", "Updated full name", "/profile");
    return ok({ user: publicUser(row) });
  });
}
