import { NextResponse, type NextRequest } from "next/server";
import { PROTECTED_PREFIXES, SESSION_COOKIE } from "@/lib/constants";

/**
 * Hosts allowed to embed Career Nexus in a frame. The hosting platform previews the app inside an
 * iframe on its own origin, so `X-Frame-Options: SAMEORIGIN` rendered the preview blank. Framing is
 * now limited to HTTPS parents and local development hosts. Override with FRAME_ANCESTORS.
 */
const FRAME_ANCESTORS =
  process.env.FRAME_ANCESTORS || "'self' https: http://localhost:* http://127.0.0.1:*";

/**
 * First line of defence: protected pages are not served without a session cookie.
 * This checks cookie presence only. Authoritative validation (hash lookup, expiry, revocation,
 * ownership) happens in `resolveSession()` for every page and API call.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (isProtected && !hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.delete("X-Frame-Options");
  response.headers.set("Content-Security-Policy", `frame-ancestors ${FRAME_ANCESTORS}`);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
