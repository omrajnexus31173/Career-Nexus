import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { apiHandler } from "@/lib/http";
import { readFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Streams the file after verifying row ownership — never served from a public directory. */
export async function GET(request: Request, ctx: Ctx) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const row = await db.query.documents.findFirst({
      where: and(eq(documents.id, id), eq(documents.userId, user.id)),
    });
    if (!row) throw new ApiError(404, "That document does not exist or is not yours.");

    const buffer = await readFile(row.storagePath);
    const download = new URL(request.url).searchParams.get("download") === "1";
    const inline = row.mimeType.startsWith("image/") || row.mimeType === "application/pdf";

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": row.mimeType,
        "Content-Length": String(buffer.length),
        "Content-Disposition": `${download || !inline ? "attachment" : "inline"}; filename="${row.originalName.replace(/"/g, "")}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  });
}
