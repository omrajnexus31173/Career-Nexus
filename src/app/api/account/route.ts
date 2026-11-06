import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { destroySession, requireUser, requireWritableUser } from "@/lib/auth";
import { apiHandler, ok, parseBody } from "@/lib/http";
import { z } from "zod";

const schema = z.object({ confirmEmail: z.string().trim().max(180) });

/**
 * Account deletion. Requires the user to retype their email address; every related row is
 * removed by ON DELETE CASCADE and the session is revoked in the same request.
 */
export async function DELETE(request: Request) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const body = await parseBody(request, schema);
    if (body.confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
      return ok({ ok: false, error: "The email you typed does not match your account." }, 422);
    }
    await db.delete(users).where(eq(users.id, user.id));
    await destroySession();
    return ok({ ok: true });
  });
}
