import { cookies, headers } from "next/headers";
import crypto from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/constants";

export { SESSION_COOKIE };

/**
 * SINGLE SOURCE OF TRUTH FOR AUTH.
 *
 * Every entry point (layout, page, route handler) validates the session through `resolveSession()`,
 * which checks one DB-stored, hashed, expiring token. The cookie is written in exactly one place
 * (`cookieAttributes`), so the browser and the server always agree about the session.
 */
export const SESSION_TTL_DAYS = 30;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/**
 * Cookie attributes live in one place. Production is HTTPS-only with SameSite=None so the session
 * still works when the app is rendered inside an embedded preview on another origin.
 */
function cookieAttributes() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    path: "/",
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    secure: isProduction,
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}

/** Server Components may read cookies but cannot write them, so writes are attempted only when allowed. */
function writeSessionCookie(jar: CookieStore, token: string) {
  try {
    jar.set(SESSION_COOKIE, token, cookieAttributes());
  } catch {
    // Read-only render: the refreshed cookie is written by the next route-handler call.
  }
}

function clearSessionCookie(jar: CookieStore) {
  try {
    jar.delete(SESSION_COOKIE);
  } catch {
    // Read-only render: resolveSession() already rejects the stale token, so this is harmless.
  }
}

export async function createSession(
  userId: string,
  meta?: { userAgent?: string; ipAddress?: string },
) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    userAgent: meta?.userAgent?.slice(0, 300) ?? null,
    ipAddress: meta?.ipAddress ?? null,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieAttributes());
  return { token, expiresAt };
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.tokenHash, hashToken(token)), isNull(sessions.revokedAt)));
  }
  jar.delete(SESSION_COOKIE);
}

export type SessionContext = { user: User; sessionId: string } | null;

/**
 * Request-scoped memo via AsyncLocalStorage. A module-level variable would let one request's
 * identity leak into a concurrent request, so it is deliberately avoided.
 */
const sessionStore = new AsyncLocalStorage<{ value: SessionContext | undefined }>();

export async function withSessionScope<T>(fn: () => Promise<T>): Promise<T> {
  if (sessionStore.getStore()) return fn();
  return sessionStore.run({ value: undefined }, fn);
}

async function loadSession(token: string, jar: CookieStore): Promise<SessionContext> {
  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    // Expired, revoked or unknown token: clear it so the browser stops presenting it.
    clearSessionCookie(jar);
    return null;
  }

  // Sliding expiration: once less than half of the lifetime remains, extend the session.
  if (row.session.expiresAt.getTime() - Date.now() < SESSION_TTL_MS / 2) {
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
      .where(eq(sessions.id, row.session.id));
    writeSessionCookie(jar, token);
  }

  return { user: row.user, sessionId: row.session.id };
}

/** Reads and validates the session cookie. Used by pages, layouts and API routes alike. */
export async function resolveSession(): Promise<SessionContext> {
  const store = sessionStore.getStore();
  const cached = store?.value;
  if (cached !== undefined) return cached;

  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const result = token ? await loadSession(token, jar) : null;
  if (store) store.value = result;
  return result;
}

export async function getCurrentUser(): Promise<User | null> {
  const ctx = await resolveSession();
  return ctx?.user ?? null;
}

export async function requireUser(): Promise<User> {
  const ctx = await resolveSession();
  if (!ctx) {
    throw new ApiError(401, "Please sign in to continue.");
  }
  return ctx.user;
}
export function isDemoUser(user: User): boolean {
  return user.email.trim().toLowerCase() === "demo@careernexus.app";
}

export async function requireWritableUser(): Promise<User> {
  const user = await requireUser();

  if (isDemoUser(user)) {
    throw new ApiError(403, "Demo mode is read-only. Changes are disabled.");
  }

  return user;
}
export async function requestMeta() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return {
    userAgent: h.get("user-agent") ?? undefined,
    ipAddress: forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined,
  };
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value.trim());
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
