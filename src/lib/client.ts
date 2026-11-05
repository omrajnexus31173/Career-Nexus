"use client";

export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Every browser request goes through here so credentials (the session cookie) are always sent,
 * even when the app is embedded in a cross-origin preview frame.
 */
export async function api<T = unknown>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers = new Headers(init?.headers);
  let body = init?.body;

  if (init?.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(init.json);
  }

  const res = await fetch(path, {
    ...init,
    body,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const envelope = data as { error?: string; details?: unknown } | null;
    throw new ApiClientError(
      res.status,
      envelope?.error || `Request failed (${res.status}).`,
      envelope?.details,
    );
  }
  return data as T;
}

export function errorMessage(e: unknown) {
  if (e instanceof ApiClientError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong. Please try again.";
}

export function fieldErrors(e: unknown): Record<string, string> {
  if (e instanceof ApiClientError && Array.isArray(e.details)) {
    const out: Record<string, string> = {};
    for (const d of e.details as { path?: string; message?: string }[]) {
      if (d.path && d.message) out[d.path] = d.message;
    }
    return out;
  }
  return {};
}

export { CAPITALIZE, label, formatDate, relativeTime, formatBytes } from "@/lib/labels";
