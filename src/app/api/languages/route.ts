import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { userLanguages } from "@/db/schema";
import { ApiError, requireUser, requireWritableUser } from "@/lib/auth";
import { apiHandler, created, ok, parseBody } from "@/lib/http";
import { languageSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/engage";
import { LANGUAGES } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiHandler(async () => {
    const user = await requireUser();
    const rows = await db
      .select()
      .from(userLanguages)
      .where(eq(userLanguages.userId, user.id))
      .orderBy(desc(userLanguages.createdAt));
    return ok({ items: rows, suggestions: LANGUAGES });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const body = await parseBody(request, languageSchema);
    const name = body.name.trim();
    const [row] = await db
      .insert(userLanguages)
      .values({ userId: user.id, ...body, name })
      .onConflictDoNothing()
      .returning();
    if (!row) throw new ApiError(409, `${name} is already on your profile.`);
    await recordActivity(user.id, "language", `Added ${name} (${body.overall}) to your languages`, "/skills");
    return created({ item: row });
  });
}
