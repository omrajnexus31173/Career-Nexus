import { requireUser } from "@/lib/auth";
import { apiHandler } from "@/lib/http";
import { readFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiHandler(async () => {
    const user = await requireUser();
    if (!user.avatarUrl) return new Response(null, { status: 404 });
    const buffer = await readFile(user.avatarUrl);
    const type = user.avatarUrl.endsWith(".png")
      ? "image/png"
      : user.avatarUrl.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";
    return new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=300" },
    });
  });
}
