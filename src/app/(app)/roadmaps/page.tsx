"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Map, Pause, Play, Sparkles, Trash2, Wand2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  ProgressBar,
  Select,
  Skeleton,
  TagInput,
  useToast,
  cn,
} from "@/components/ui";
import { useFetch } from "@/lib/use-api";
import { api, errorMessage, formatDate, label } from "@/lib/client";
import { CAREERS } from "@/lib/catalog-shared";

type Progress = {
  total: number;
  done: number;
  pending: number;
  inProgress: number;
  percent: number;
  milestonesDone: number;
  milestonesTotal: number;
  remainingHours: number;
  nextAction: string;
};

type Roadmap = {
  id: string;
  title: string;
  careerTitle: string;
  durationDays: number;
  weeklyHours: number;
  status: string;
  startDate: string;
  createdAt: string;
  progress: Progress;
};

type Analysis = {
  id: string;
  careerId: string;
  careerTitle: string;
  gaps: { skill: string; priority: string }[] | null;
  recommendedSkills: string[] | null;
};

const DURATIONS = [30, 60, 90, 100, 180, 365];

export default function RoadmapsPage() {
  const toast = useToast();
  const router = useRouter();
  const res = useFetch<{ items: Roadmap[] }>("/api/roadmaps");
  const analyses = useFetch<{ items: Analysis[] }>("/api/analyses");
  const profile = useFetch<{ profile: { targetCareerId?: string | null; weeklyHours?: number | null } | null }>("/api/profile");

  const [careerId, setCareerId] = useState("");
  const [duration, setDuration] = useState(90);
  const [hours, setHours] = useState(10);
  const [focus, setFocus] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Roadmap | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    const target = analyses.data?.items[0]?.careerId ?? profile.data?.profile?.targetCareerId ?? "";
    if (target && !careerId) setCareerId(target);
    const h = profile.data?.profile?.weeklyHours;
    if (h) setHours(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyses.data, profile.data]);

  const suggestedFocus = analyses.data?.items[0]?.recommendedSkills ?? [];

  async function generate() {
    if (!careerId) {
      toast.error("Choose a target career", "The roadmap is built around the gaps for that profession.");
      return;
    }
    setBusy(true);
    try {
      const out = await api<{ roadmap: { id: string } }>("/api/roadmaps", {
        method: "POST",
        json: { careerId, durationDays: duration, weeklyHours: hours, focus, title },
      });
      toast.success("Roadmap generated", "Opening your plan…");
      router.push(`/roadmaps/${out.roadmap.id}`);
    } catch (e) {
      toast.error("Could not generate the roadmap", errorMessage(e));
      setBusy(false);
    }
  }

  async function toggle(r: Roadmap) {
    const status = r.status === "paused" ? "active" : "paused";
    try {
      await api(`/api/roadmaps/${r.id}`, { method: "PATCH", json: { status } });
      res.reload();
      toast.success(status === "paused" ? "Roadmap paused" : "Roadmap resumed");
    } catch (e) {
      toast.error("Could not update", errorMessage(e));
    }
  }

  async function remove(r: Roadmap) {
    setDeleteBusy(true);
    try {
      await api(`/api/roadmaps/${r.id}`, { method: "DELETE" });
      toast.success("Roadmap deleted");
      res.reload();
    } catch (e) {
      toast.error("Could not delete", errorMessage(e));
    } finally {
      setDeleteBusy(false);
      setConfirm(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Grow"
        title="Personalized career roadmaps"
        description="Roadmaps are generated from your actual gap analysis and paced by the hours you really have each week. 30 to 365 days, with phases, tasks, resources and milestones."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <Card>
          <CardHeader
            icon={<Map className="size-[18px]" />}
            title="Your roadmaps"
            subtitle={`${res.data?.items.length ?? 0} created`}
          />
          <div className="p-5">
            {res.error ? <Alert tone="error">{res.error}</Alert> : null}
            {res.loading ? (
              <div className="space-y-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : (res.data?.items.length ?? 0) === 0 ? (
              <EmptyState
                icon={<Map className="size-5" />}
                title="No roadmap yet"
                message="Configure the generator on the right and create your first plan. You can add, edit and reorder tasks afterwards."
              />
            ) : (
              <ul className="space-y-3">
                {res.data!.items.map((r) => (
                  <li key={r.id} className="rounded-xl border border-ink-200 p-4 transition-colors hover:border-brand-300">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/roadmaps/${r.id}`} className="text-[15px] font-semibold text-ink-900 hover:text-brand-700">
                          {r.title}
                        </Link>
                        <p className="mt-0.5 text-[12.5px] text-ink-500">
                          {r.careerTitle} · {r.durationDays} days · {r.weeklyHours} h/week · started {formatDate(r.startDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge tone={r.status === "active" ? "green" : r.status === "completed" ? "brand" : r.status === "paused" ? "amber" : "neutral"}>
                          {label(r.status)}
                        </Badge>
                        {r.status !== "completed" ? (
                          <IconButton label={r.status === "paused" ? "Resume roadmap" : "Pause roadmap"} onClick={() => toggle(r)}>
                            {r.status === "paused" ? <Play className="size-4" /> : <Pause className="size-4" />}
                          </IconButton>
                        ) : null}
                        <IconButton label="Delete roadmap" onClick={() => setConfirm(r)} className="hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="size-4" />
                        </IconButton>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar value={r.progress.percent} className="flex-1" />
                      <span className="w-12 shrink-0 text-right text-[13px] font-semibold text-ink-900">{r.progress.percent}%</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-500">
                      <span>{r.progress.done}/{r.progress.total} tasks done</span>
                      <span>{r.progress.milestonesDone}/{r.progress.milestonesTotal} milestones</span>
                      <span>{r.progress.remainingHours} h remaining</span>
                      {r.progress.nextAction ? (
                        <span className="flex items-center gap-1 font-medium text-brand-700">
                          <ArrowRight className="size-3" /> {r.progress.nextAction}
                        </span>
                      ) : null}
                    </div>

                    <Link
                      href={`/roadmaps/${r.id}`}
                      className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-700 hover:text-brand-700"
                    >
                      Open roadmap <ArrowRight className="size-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader icon={<Wand2 className="size-[18px]" />} title="Generate a new roadmap" subtitle="Adapts to your level, gaps and available time" />
          <div className="space-y-4 p-5">
            <Field label="Target career" required>
              <Select value={careerId} onChange={(e) => setCareerId(e.target.value)}>
                <option value="">Select a career…</option>
                {CAREERS.map((c) => (
                  <option key={c.id} value={c.id}>{c.title} — {c.family}</option>
                ))}
              </Select>
            </Field>

            <div>
              <p className="mb-1.5 text-[13px] font-medium text-ink-700">Duration</p>
              <div className="grid grid-cols-3 gap-1.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={cn(
                      "rounded-xl border py-2 text-[13px] font-semibold transition-all",
                      duration === d
                        ? "border-brand-600 bg-brand-600 text-white shadow-soft"
                        : "border-ink-200 bg-white text-ink-700 hover:border-ink-300",
                    )}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            <Field label={`Study time: ${hours} hours per week`}>
              <input
                type="range"
                min={1}
                max={40}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full accent-brand-600"
                aria-label="Weekly study hours"
              />
              <div className="flex justify-between text-[11px] text-ink-400">
                <span>1 h</span>
                <span>40 h</span>
              </div>
            </Field>

            <Field label="Focus areas (optional)" hint="Leave empty to cover every gap in priority order.">
              <TagInput value={focus} onChange={setFocus} suggestions={suggestedFocus} placeholder="e.g. Python, Machine Learning" />
            </Field>

            <Field label="Custom title (optional)">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My 90-day data science plan" />
            </Field>

            <Button full size="lg" onClick={generate} loading={busy} icon={<Sparkles className="size-4" />}>
              Generate roadmap
            </Button>

            <div className="rounded-xl bg-ink-50 p-3.5">
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold tracking-wide text-ink-600 uppercase">
                <CalendarDays className="size-3.5" /> How it is built
              </p>
              <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-ink-500">
                <li>· Phases scale with duration (3 phases at 30 days, up to 6 at 365).</li>
                <li>· Task volume is derived from your weekly hours, not a fixed template.</li>
                <li>· Every gap gets a learn task, a practice task and a due day.</li>
                <li>· Progress is computed only from tasks you actually complete.</li>
              </ul>
            </div>

            {!analyses.data?.items.length ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-flare-100 bg-flare-50 p-3">
                <p className="text-[12px] leading-snug text-flare-600">
                  No career analysis yet — running one first makes focus suggestions accurate.
                </p>
                <Link href="/analyzer" className="shrink-0 text-[12px] font-semibold text-flare-600 hover:underline">
                  Analyse
                </Link>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={`Delete "${confirm?.title ?? ""}"?`}
        message="All phases, tasks and completion history for this roadmap will be permanently deleted."
        loading={deleteBusy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm)}
      />
    </>
  );
}
