import type { User } from "@/db/schema";

/** Strips the password hash and internal storage paths before any user record leaves the server. */
export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    // The stored path is internal. Clients load the photo through the authenticated endpoint.
    avatarUrl: user.avatarUrl ? "/api/avatar/file" : null,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Removes the internal storage path from a document row. Files are only reachable via the owner-checked route. */
export function publicDocument<T extends { storagePath: string }>(row: T): Omit<T, "storagePath"> {
  const { storagePath: _internal, ...rest } = row;
  return rest;
}
