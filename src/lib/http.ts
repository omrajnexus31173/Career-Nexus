import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { ApiError, requestMeta, withSessionScope } from "@/lib/auth";

/** Wraps every route handler: request-scoped session cache + uniform error envelope. */
export async function apiHandler(fn: () => Promise<Response>): Promise<Response> {
  return withSessionScope(async () => {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message, details: error.details },
          { status: error.status },
        );
      }
      const detail = error instanceof Error ? error.message : String(error);
      // Never leak stack traces or driver internals to the client.
      console.error("[apierror] - http.ts:19", error);

      if (error instanceof Error && error.cause) {
        console.error("[apierrorcause] - http.ts:22", error.cause);
      }
      return NextResponse.json(
        { error: "Something went wrong on our side. Please try again." },
        { status: 500 },
      );
    }
  });
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function fail(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    throw new ApiError(422, issues[0]?.message ?? "Invalid request.", issues);
  }
  return result.data;
}

/* ------------------------------- rate limit ------------------------------- */

type Bucket = { hits: number[] };
const buckets = new Map<string, Bucket>();

/**
 * Fixed-window rate limiter (per process instance). Used on credential and token endpoints
 * to blunt brute-force and enumeration attacks.
 */
export async function rateLimit(scope: string, limit: number, windowMs: number) {
  const meta = await requestMeta();
  const identity = meta.ipAddress ?? "unknown";
  const key = `${scope}:${identity}`;
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  bucket.hits.push(now);
  buckets.set(key, bucket);

  if (bucket.hits.length > limit) {
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) {
        if (b.hits.length === 0 || now - b.hits[b.hits.length - 1] > windowMs) buckets.delete(k);
      }
    }
    throw new ApiError(429, "Too many attempts. Please wait a moment and try again.");
  }
}

export async function clientIp() {
  const meta = await requestMeta();
  return meta.ipAddress ?? "unknown";
}

/** Ownership guard: every user-owned row is verified against the session user. */
export function assertOwner(rowUserId: string | null | undefined, userId: string) {
  if (!rowUserId || rowUserId !== userId) {
    throw new ApiError(404, "That record does not exist.");
  }
}
