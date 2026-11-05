"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import {
  Alert, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, IconButton, PageHeader,
  Skeleton, Tabs, useToast, cn,
} from "@/components/ui";
import { useFetch } from "@/lib/use-api";
import { api, errorMessage, relativeTime } from "@/lib/client";

type Item = {
  id: string; type: string; title: string; body: string | null; link: string | null;
  readAt: string | null; createdAt: string;
};

const DOT: Record<string, string> = {
  success: "bg-emerald-500", info: "bg-blue-500", warning: "bg-flare-500", error: "bg-red-500",
};

export default function NotificationsPage() {
  const toast = useToast();
  const res = useFetch<{ items: Item[]; unread: number }>("/api/notifications");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const items = (res.data?.items ?? []).filter((n) => (filter === "unread" ? !n.readAt : true));

  async function markAll() {
    try {
      await api("/api/notifications", { method: "PATCH" });
      toast.success("All notifications marked as read");
      res.reload();
    } catch (e) {
      toast.error("Could not update notifications", errorMessage(e));
    }
  }

  async function toggle(n: Item) {
    const previous = res.data;
    res.setData((prev) =>
      prev
        ? {
            ...prev,
            unread: n.readAt ? prev.unread + 1 : Math.max(0, prev.unread - 1),
            items: prev.items.map((x) => (x.id === n.id ? { ...x, readAt: x.readAt ? null : new Date().toISOString() } : x)),
          }
        : prev,
    );
    try {
      await api(`/api/notifications/${n.id}`, { method: "PATCH", json: { read: !n.readAt } });
      res.reload();
    } catch (e) {
      res.setData(previous);
      toast.error("Could not update", errorMessage(e));
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/notifications/${id}`, { method: "DELETE" });
      toast.success("Notification deleted");
      res.reload();
    } catch (e) {
      toast.error("Could not delete", errorMessage(e));
    } finally {
      setConfirmId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        description="Real events from your account: analyses, roadmap milestones, uploads and profile reminders."
        actions={
          <Button variant="secondary" icon={<CheckCheck className="size-4" />} onClick={markAll} disabled={!res.data?.unread}>
            Mark all read
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-4">
          <Tabs
            tabs={[
              { id: "all", label: "All", count: res.data?.items.length ?? 0 },
              { id: "unread", label: "Unread", count: res.data?.unread ?? 0 },
            ]}
            value={filter}
            onChange={(v) => setFilter(v as "all" | "unread")}
          />
        </div>

        <div className="p-4">
          {res.error ? <Alert tone="error">{res.error}</Alert> : null}
          {res.loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Bell className="size-5" />}
              title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
              message={filter === "unread" ? "You are all caught up." : "Milestones, analyses and account events will appear here."}
              action={filter === "unread" ? <Button size="sm" variant="secondary" onClick={() => setFilter("all")}>Show all</Button> : undefined}
            />
          ) : (
            <ul className="space-y-2">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3.5 transition-colors",
                    n.readAt ? "border-ink-200 bg-white" : "border-brand-200 bg-brand-50/40",
                  )}
                >
                  <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", DOT[n.type] ?? DOT.info)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("text-[13.5px]", n.readAt ? "text-ink-700" : "font-semibold text-ink-900")}>{n.title}</p>
                      {!n.readAt ? <Badge tone="brand">new</Badge> : null}
                      <span className="text-[11.5px] text-ink-400">{relativeTime(n.createdAt)}</span>
                    </div>
                    {n.body ? <p className="mt-1 text-[12.5px] leading-relaxed text-ink-600">{n.body}</p> : null}
                    {n.link ? (
                      <Link href={n.link} className="mt-1.5 inline-block text-[12.5px] font-medium text-brand-700 hover:underline">
                        Open →
                      </Link>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <IconButton label={n.readAt ? "Mark as unread" : "Mark as read"} onClick={() => toggle(n)}>
                      <CheckCheck className="size-4" />
                    </IconButton>
                    <IconButton label="Delete" onClick={() => setConfirmId(n.id)} className="hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Delete this notification?"
        message="It will be permanently removed from your account."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && remove(confirmId)}
      />
    </>
  );
}
