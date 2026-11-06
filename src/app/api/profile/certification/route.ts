import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { certifications } from "@/db/schema";
import { requireUser, requireWritableUser } from "@/lib/auth";
import { apiHandler, created, ok, parseBody } from "@/lib/http";
import { certificationSchema } from "@/lib/validation";
import { notify, recordActivity } from "@/lib/engage";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiHandler(async () => {
    const user = await requireUser();
    const rows = await db
      .select()
      .from(certifications)
      .where(eq(certifications.userId, user.id))
      .orderBy(desc(certifications.createdAt));
    return ok({ items: rows });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireWritableUser();
    const body = await parseBody(request, certificationSchema);
    const [row] = await db.insert(certifications).values({ userId: user.id, ...body }).returning();
    await recordActivity(user.id, "certification", `Added certification: ${row.name}`, "/documents");
    await notify(user.id, {
      type: "success",
      title: "Certification recorded",
      body: `${row.name}${row.issuer ? ` from ${row.issuer}` : ""} is now part of your verified profile.`,
      link: "/documents",
    });
    return created({ item: row });
  });
}
