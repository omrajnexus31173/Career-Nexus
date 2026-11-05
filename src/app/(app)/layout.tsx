import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { resolveSession, withSessionScope } from "@/lib/auth";
import { unreadCount } from "@/lib/engage";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await ensureSeed().catch(() => undefined);

  const ctx = await withSessionScope(() => resolveSession());
  if (!ctx) redirect("/login");

  const unread = await unreadCount(ctx.user.id);

  return (
    <AppShell
      user={{
        id: ctx.user.id,
        fullName: ctx.user.fullName,
        email: ctx.user.email,
        avatarUrl: ctx.user.avatarUrl ? "/api/avatar/file" : null,
      }}
      initialUnread={unread}
    >
      {children}
    </AppShell>
  );
}
