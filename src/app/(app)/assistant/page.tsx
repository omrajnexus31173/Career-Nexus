"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Plus, Send, Sparkles, Trash2, User } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Skeleton,
  Textarea,
  useToast,
  cn,
} from "@/components/ui";
import { useFetch } from "@/lib/use-api";
import { api, errorMessage, relativeTime } from "@/lib/client";

type Message = { id: string; role: string; content: string; provider: string | null; createdAt: string };
type Conversation = { id: string; title: string; createdAt: string };
type AiStatus = { configured: boolean; provider: string; model: string };

const QUICK_PROMPTS = [
  "What should I work on this week?",
  "Review my résumé for my target role",
  "Which certification should I do next?",
  "Prepare me for an interview",
  "Plan a 90-day career change",
  "Explain my current roadmap",
];

/** Minimal markdown: bold, bullets, numbered lists and paragraphs. */
function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l) || !l.trim());
        if (isList && lines.filter(Boolean).length > 1) {
          return (
            <ul key={i} className="space-y-1.5">
              {lines.filter(Boolean).map((l, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand-400" />
                  <span className="flex-1">{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="leading-relaxed whitespace-pre-line">
            {inline(block)}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-ink-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function AssistantPage() {
  const toast = useToast();
  const list = useFetch<{ items: Conversation[]; ai: AiStatus }>("/api/assistant");
  const [activeId, setActiveId] = useState<string | null>(null);
  const thread = useFetch<{ conversation: Conversation; messages: Message[]; ai: AiStatus }>(
    activeId ? `/api/assistant?id=${activeId}` : null,
    [activeId],
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.data?.messages.length, sending]);

  const messages = thread.data?.messages ?? [];
  const ai = list.data?.ai ?? thread.data?.ai;

  async function send(text?: string) {
    const content = (text ?? draft).trim();
    if (!content || sending) return;
    setSending(true);
    setDraft("");
    setNotice(null);
    try {
      const res = await api<{ conversation: Conversation; message: Message; notice: string | null }>(
        "/api/assistant",
        { method: "POST", json: { conversationId: activeId, message: content } },
      );
      setNotice(res.notice);
      if (!activeId) setActiveId(res.conversation.id);
      list.reload();
      thread.reload();
      if (activeId) {
        thread.setData((prev) =>
          prev
            ? {
                ...prev,
                messages: [
                  ...prev.messages,
                  { id: `u-${Date.now()}`, role: "user", content, provider: null, createdAt: new Date().toISOString() },
                  res.message,
                ],
              }
            : prev,
        );
      }
    } catch (e) {
      setDraft(content);
      toast.error("Nexus AI could not respond", errorMessage(e));
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/assistant/${id}`, { method: "DELETE" });
      if (activeId === id) setActiveId(null);
      toast.success("Conversation deleted");
      list.reload();
    } catch (e) {
      toast.error("Could not delete", errorMessage(e));
    } finally {
      setConfirmId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Grow"
        title="Nexus AI career assistant"
        description="Answers are grounded in your stored profile, analysis and active roadmap — never generic filler."
        actions={
          <Button
            variant="secondary"
            icon={<Plus className="size-4" />}
            onClick={() => {
              setActiveId(null);
              setNotice(null);
            }}
          >
            New conversation
          </Button>
        }
      />

      {ai && !ai.configured ? (
        <div className="mb-5">
          <Alert tone="warning" title="Running on the built-in guidance engine">
            No AI provider key is configured on this server, so Nexus AI answers using Career Nexus&apos;s deterministic
            guidance engine with your real profile data. Set <code>OPENAI_API_KEY</code> (optionally{" "}
            <code>OPENAI_MODEL</code>, <code>OPENAI_BASE_URL</code>) or <code>ANTHROPIC_API_KEY</code> to enable
            large-language-model answers. Keys never reach the browser.
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-[13px] font-semibold text-ink-900">Conversations</p>
            <Badge tone="neutral">{list.data?.items.length ?? 0}</Badge>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {list.loading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : (list.data?.items.length ?? 0) === 0 ? (
              <p className="px-3 py-6 text-center text-[12.5px] text-ink-500">No conversations yet.</p>
            ) : (
              <ul className="space-y-1">
                {list.data!.items.map((c) => (
                  <li key={c.id}>
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors",
                        activeId === c.id ? "bg-ink-900 text-white" : "hover:bg-ink-100",
                      )}
                    >
                      <button onClick={() => setActiveId(c.id)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-[12.5px] font-medium">{c.title}</p>
                        <p className={cn("text-[11px]", activeId === c.id ? "text-white/55" : "text-ink-400")}>
                          {relativeTime(c.createdAt)}
                        </p>
                      </button>
                      <button
                        onClick={() => setConfirmId(c.id)}
                        aria-label="Delete conversation"
                        className={cn("shrink-0", activeId === c.id ? "text-white/60 hover:text-white" : "text-ink-400 hover:text-red-600")}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-ink-100 p-4">
            <Link href="/profile" className="text-[12px] font-medium text-brand-700 hover:underline">
              Improve answers → complete your profile
            </Link>
          </div>
        </Card>

        <Card className="flex min-h-[62vh] flex-col">
          <div className="flex items-center gap-2.5 border-b border-ink-100 px-5 py-3.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Bot className="size-[18px]" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink-900">Nexus AI</p>
              <p className="text-[11.5px] text-ink-500">
                {ai?.configured ? `${ai.provider} · ${ai.model}` : "Guidance engine · grounded in your data"}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {notice ? <Alert tone="info">{notice}</Alert> : null}

            {!activeId && !sending ? (
              <div>
                <EmptyState
                  icon={<Sparkles className="size-5" />}
                  title="Ask anything about your career"
                  message="Nexus AI reads your skills, projects, certifications, latest analysis and active roadmap before answering."
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-ink-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {thread.loading && activeId ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-28" />
              </div>
            ) : null}

            {messages.map((m) => (
              <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" ? (
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <Bot className="size-4" />
                  </span>
                ) : null}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-[13.5px]",
                    m.role === "user"
                      ? "rounded-br-sm bg-ink-900 text-white"
                      : "rounded-bl-sm border border-ink-200 bg-white text-ink-700",
                  )}
                >
                  {m.role === "user" ? (
                    <p className="leading-relaxed whitespace-pre-line">{m.content}</p>
                  ) : (
                    <RichText text={m.content} />
                  )}
                  <p className={cn("mt-2 text-[10.5px]", m.role === "user" ? "text-white/45" : "text-ink-400")}>
                    {relativeTime(m.createdAt)}
                    {m.role === "assistant" && m.provider && m.provider !== "none" ? ` · ${m.provider}` : ""}
                  </p>
                </div>
                {m.role === "user" ? (
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-600">
                    <User className="size-4" />
                  </span>
                ) : null}
              </div>
            ))}

            {sending ? (
              <div className="flex gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Bot className="size-4" />
                </span>
                <div className="rounded-2xl rounded-bl-sm border border-ink-200 bg-white px-4 py-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="size-2 animate-bounce rounded-full bg-brand-400"
                        style={{ animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-ink-100 p-4">
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Ask about skills, interviews, your roadmap or a career change… (Enter to send, Shift+Enter for a new line)"
                className="min-h-[52px] flex-1 resize-none"
                disabled={sending}
              />
              <Button onClick={() => send()} loading={sending} disabled={!draft.trim()} className="h-[52px]" icon={<Send className="size-4" />}>
                Send
              </Button>
            </div>
            <p className="mt-2 text-[11.5px] text-ink-400">
              Your message and the reply are stored in your account. Only you can read them.
            </p>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Delete this conversation?"
        message="The conversation and all of its messages will be permanently removed."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && remove(confirmId)}
      />
    </>
  );
}
