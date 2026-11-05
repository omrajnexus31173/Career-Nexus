"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  Bell,
  Bot,
  CheckCircle2,
  Circle,
  Compass,
  FileStack,
  FolderKanban,
  Languages,
  ListChecks,
  Map,
  Pause,
  Play,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  ProgressBar,
  Ring,
  Skeleton,
  StatCard,
  useToast,
} from "@/components/ui";
import { useFetch } from "@/lib/use-api";
import { api, errorMessage, label, relativeTime } from "@/lib/client";

type ProfileRes = {
  user: { id: string; fullName: string; email: string; avatarUrl: string | null };
  profile: Record<string, unknown> | null;
  counts: Record<string, number>;
  completion: { percent: number; completed: string[]; missing: { label: string; link: string }[] };
};

type RoadmapItem = {
  id: string;
  title: string;
  careerTitle: string;
  durationDays: number;
  weeklyHours: number;
  status: string;
  nextAction: string | null;
  createdAt: string;
  progress: { total: number; done: number; percent: number; pending: number; inProgress: number; milestonesDone: number; milestonesTotal: number; remainingHours: number; nextAction: string };
};

type AnalysisItem = {
  id: string;
  careerId: string;
  careerTitle: string;
  readinessScore: number;
  strengths: { skill: string; note: string }[] | null;
  gaps: { skill: string; priority: string; note: string }[] | null;
  createdAt: string;
};

type ActivityItem = { id: string; type: string; message: string; link: string | null; createdAt: string };
type NotificationItem = { id: string; type: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string };

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const profile = useFetch<ProfileRes>("/api/profile");
  const roadmaps = useFetch<{ items: RoadmapItem[] }>("/api/roadmaps");
  const analyses = useFetch<{ items: AnalysisItem[] }>("/api/analyses");
  const activity = useFetch<{ items: ActivityItem[] }>("/api/activity?limit=8");
  const notifications = useFetch<{ items: NotificationItem[]; unread: number }>("/api/notifications");

  const loading = profile.loading || roadmaps.loading;
  const p = profile.data?.profile as Record<string, string | number | string[] | null> | null | undefined;
  const counts = profile.data?.counts;
  const active = roadmaps.data?.items.find((r) => r.status === "active" || r.status === "paused");
  const latest = analyses.data?.items[0];
  const firstName = (profile.data?.user.fullName ?? "").split(" ")[0] || "there";

  // Computed after mount: the server render and the browser can be in different time zones,
  // and a time-based greeting computed during render would cause a hydration mismatch.
  const [greeting, setGreeting] = useState("Welcome back");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hour = new Date().getHours();
      setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function toggleRoadmap(r: RoadmapItem) {
    const next = r.status === "paused" ? "active" : "paused";
    try {
      await api(`/api/roadmaps/${r.id}`, { method: "PATCH", json: { status: next } });
      roadmaps.reload();
      toast.success(next === "paused" ? "Roadmap paused" : "Roadmap resumed");
    } catch (e) {
      toast.error("Could not update the roadmap", errorMessage(e));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={`${greeting}, ${firstName}`}
        title="Your career dashboard"
        description={
          p?.careerGoal
            ? String(p.careerGoal)
            : "Set a career goal in your profile and every recommendation below becomes specific to you."
        }
        actions={
          <>
            <Button variant="secondary" icon={<Compass className="size-4" />} onClick={() => router.push("/analyzer")}>
              Run analysis
            </Button>
            <Button icon={<Map className="size-4" />} onClick={() => router.push("/roadmaps")}>
              Build roadmap
            </Button>
          </>
        }
      />

      {profile.error ? (
        <div className="mb-6">
          <Alert tone="error" title="Could not load your dashboard">
            {profile.error}
          </Alert>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-2xl" />)
        ) : (
          <>
            <Card className="flex items-center gap-4 p-4">
              <Ring value={profile.data?.completion.percent ?? 0} size={72} />
              <div className="min-w-0">
                <p className="text-[12px] font-medium tracking-wide text-ink-500 uppercase">Profile</p>
                <p className="mt-0.5 text-[15px] font-semibold text-ink-900">
                  {profile.data?.completion.missing.length ?? 0} items to add
                </p>
                <Link href="/profile" className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-700 hover:underline">
                  Complete profile <ArrowRight className="size-3" />
                </Link>
              </div>
            </Card>

            <StatCard
              label="Skills"
              value={counts?.skills ?? 0}
              hint={`${counts?.languages ?? 0} languages recorded`}
              icon={<Languages className="size-[18px]" />}
            />

            <StatCard
              label="Roadmap progress"
              value={`${active?.progress.percent ?? 0}%`}
              hint={active ? `${active.progress.done}/${active.progress.total} tasks done` : "No active roadmap"}
              icon={<TrendingUp className="size-[18px]" />}
              tone="dark"
            />

            <StatCard
              label="Career readiness"
              value={latest ? `${latest.readinessScore}%` : "—"}
              hint={latest ? `for ${latest.careerTitle}` : "Run an analysis to measure"}
              icon={<Target className="size-[18px]" />}
              tone="amber"
            />
          </>
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          {/* Career goal */}
          <Card>
            <CardHeader
              icon={<Target className="size-[18px]" />}
              title="Career direction"
              subtitle={latest ? `Last analysed ${relativeTime(latest.createdAt)}` : "No analysis yet"}
              action={
                <Button size="sm" variant="secondary" onClick={() => router.push("/analyzer")} icon={<Compass className="size-3.5" />}>
                  {latest ? "Re-analyse" : "Analyse now"}
                </Button>
              }
            />
            <div className="p-5">
              {loading ? (
                <Skeleton className="h-24" />
              ) : latest ? (
                <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-ink-50 p-4 text-center">
                    <Ring value={latest.readinessScore} size={92} label="ready" />
                    <p className="mt-2 text-[13px] font-semibold text-ink-800">{latest.careerTitle}</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-emerald-700 uppercase">
                        <CheckCircle2 className="size-3.5" /> Strengths ({latest.strengths?.length ?? 0})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(latest.strengths ?? []).slice(0, 6).map((s) => (
                          <Badge key={s.skill} tone="green">
                            {s.skill}
                          </Badge>
                        ))}
                        {(latest.strengths?.length ?? 0) === 0 ? (
                          <span className="text-[13px] text-ink-500">Add skills to your profile to see strengths.</span>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-flare-600 uppercase">
                        <Circle className="size-3.5" /> Skill gaps ({(latest.gaps ?? []).length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(latest.gaps ?? []).slice(0, 6).map((g) => (
                          <Badge key={g.skill} tone={g.priority === "high" ? "red" : g.priority === "medium" ? "amber" : "neutral"}>
                            {g.skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  compact
                  icon={<Compass className="size-5" />}
                  title="No career analysis yet"
                  message="Choose a target career and Career Nexus will compare it against your real skills, projects, education and certifications."
                  action={
                    <Button size="sm" onClick={() => router.push("/analyzer")} icon={<Sparkles className="size-4" />}>
                      Run your first analysis
                    </Button>
                  }
                />
              )}
            </div>
          </Card>

          {/* Active roadmap */}
          <Card>
            <CardHeader
              icon={<Map className="size-[18px]" />}
              title="Active roadmap"
              subtitle={active ? `${active.durationDays} days · ${active.weeklyHours} h/week · ${active.careerTitle}` : undefined}
              action={
                <Button size="sm" variant="secondary" onClick={() => router.push("/roadmaps")} icon={<Plus className="size-3.5" />}>
                  New roadmap
                </Button>
              }
            />
            <div className="p-5">
              {loading ? (
                <Skeleton className="h-32" />
              ) : active ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/roadmaps/${active.id}`} className="text-[15px] font-semibold text-ink-900 hover:text-brand-700">
                      {active.title}
                    </Link>
                    <div className="flex items-center gap-2">
                      <Badge tone={active.status === "active" ? "green" : "amber"}>{label(active.status)}</Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toggleRoadmap(active)}
                        icon={active.status === "paused" ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                      >
                        {active.status === "paused" ? "Resume" : "Pause"}
                      </Button>
                    </div>
                  </div>

                  <ProgressBar value={active.progress.percent} />

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Completed", value: active.progress.done },
                      { label: "Remaining", value: active.progress.total - active.progress.done },
                      { label: "Milestones", value: `${active.progress.milestonesDone}/${active.progress.milestonesTotal}` },
                      { label: "Hours left", value: active.progress.remainingHours },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-ink-50 px-3 py-2.5">
                        <p className="text-[11.5px] tracking-wide text-ink-500 uppercase">{s.label}</p>
                        <p className="text-[17px] font-semibold text-ink-900">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
                    <div>
                      <p className="text-[11.5px] font-semibold tracking-wide text-brand-700 uppercase">Next recommended action</p>
                      <p className="mt-0.5 text-[13.5px] font-medium text-ink-800">{active.progress.nextAction}</p>
                    </div>
                    <Button size="sm" onClick={() => router.push(`/roadmaps/${active.id}`)} icon={<ArrowRight className="size-3.5" />}>
                      Open roadmap
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  compact
                  icon={<Map className="size-5" />}
                  title="No roadmap yet"
                  message="Generate a personalised 30–365 day plan with phases, tasks, resources and milestones built from your gap analysis."
                  action={
                    <Button size="sm" onClick={() => router.push("/roadmaps")}>
                      Build my roadmap
                    </Button>
                  }
                />
              )}
            </div>
          </Card>

          {/* Next steps */}
          <Card>
            <CardHeader icon={<ListChecks className="size-[18px]" />} title="Recommended next steps" subtitle="Derived from your profile gaps and analysis results" />
            <div className="divide-y divide-ink-100">
              {loading ? (
                <div className="space-y-2 p-5">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : (
                [...(profile.data?.completion.missing ?? []).slice(0, 4).map((m) => ({ text: `Add ${m.label.toLowerCase()} to your record`, link: m.link })),
                 ...(latest?.gaps ?? []).slice(0, 3).map((g) => ({ text: `Close the ${g.priority}-priority gap: ${g.skill}`, link: "/skills" })),
                 ...(active && active.progress.percent < 100 ? [{ text: `Finish "${active.progress.nextAction}"`, link: `/roadmaps/${active.id}` }] : []),
                ]
                  .slice(0, 6)
                  .map((step, i) => (
                    <Link key={i} href={step.link} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-ink-50">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-[13.5px] text-ink-700">{step.text}</span>
                      <ArrowRight className="size-4 text-ink-300" />
                    </Link>
                  ))
              )}
              {!loading && (profile.data?.completion.missing.length ?? 0) === 0 && !latest ? (
                <div className="p-5">
                  <EmptyState compact icon={<CheckCircle2 className="size-5" />} title="Everything is complete" message="Add a career goal or run an analysis to unlock tailored next steps." />
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          {/* Record summary */}
          <Card>
            <CardHeader icon={<FileStack className="size-[18px]" />} title="Your record" />
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl bg-ink-100">
              {[
                { label: "Projects", value: counts?.projects ?? 0, href: "/projects", icon: <FolderKanban className="size-4" /> },
                { label: "Documents", value: counts?.documents ?? 0, href: "/documents", icon: <FileStack className="size-4" /> },
                { label: "Certificates", value: counts?.certifications ?? 0, href: "/documents", icon: <Award className="size-4" /> },
                { label: "Résumés", value: counts?.resumes ?? 0, href: "/resume", icon: <FileStack className="size-4" /> },
                { label: "Work history", value: counts?.experiences ?? 0, href: "/profile", icon: <UserRound className="size-4" /> },
                { label: "Education", value: counts?.educations ?? 0, href: "/profile", icon: <UserRound className="size-4" /> },
              ].map((item) => (
                <Link key={item.label} href={item.href} className="group bg-white px-4 py-3.5 transition-colors hover:bg-brand-50/50">
                  <span className="flex items-center gap-2 text-ink-400 group-hover:text-brand-600">{item.icon}</span>
                  <p className="mt-1.5 text-[19px] font-semibold text-ink-900">{item.value}</p>
                  <p className="text-[12px] text-ink-500">{item.label}</p>
                </Link>
              ))}
            </div>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader icon={<TrendingUp className="size-[18px]" />} title="Recent activity" subtitle="Everything you have actually done" />
            <div className="p-5">
              {activity.loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-9" />
                  <Skeleton className="h-9" />
                  <Skeleton className="h-9" />
                </div>
              ) : activity.data?.items.length ? (
                <ol className="relative space-y-4 border-l border-ink-200 pl-5">
                  {activity.data.items.map((a) => (
                    <li key={a.id} className="relative">
                      <span className="absolute top-1.5 -left-[26px] size-2.5 rounded-full bg-brand-500 ring-4 ring-brand-50" />
                      <p className="text-[13px] leading-snug text-ink-700">{a.message}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-400">{relativeTime(a.createdAt)}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[13px] text-ink-500">No activity yet — your actions will appear here.</p>
              )}
            </div>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader
              icon={<Bell className="size-[18px]" />}
              title="Notifications"
              subtitle={`${notifications.data?.unread ?? 0} unread`}
              action={
                <Link href="/notifications" className="text-[12.5px] font-medium text-brand-700 hover:underline">
                  View all
                </Link>
              }
            />
            <div className="divide-y divide-ink-100">
              {notifications.loading ? (
                <div className="space-y-2 p-5">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : notifications.data?.items.length ? (
                notifications.data.items.slice(0, 4).map((n) => (
                  <Link key={n.id} href={n.link ?? "/notifications"} className="flex gap-3 px-5 py-3 transition-colors hover:bg-ink-50">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? "bg-ink-200" : "bg-flare-500"}`} />
                    <div className="min-w-0">
                      <p className={`truncate text-[13px] ${n.readAt ? "text-ink-600" : "font-semibold text-ink-900"}`}>{n.title}</p>
                      {n.body ? <p className="line-clamp-2 text-[12px] text-ink-500">{n.body}</p> : null}
                      <p className="mt-0.5 text-[11px] text-ink-400">{relativeTime(n.createdAt)}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-5">
                  <EmptyState compact icon={<Bell className="size-5" />} title="Nothing to report" message="Milestones, analyses and roadmap updates will show up here." />
                </div>
              )}
            </div>
          </Card>

          <Card className="grain overflow-hidden bg-ink-900 p-5 text-white">
            <Bot className="size-5 text-brand-300" />
            <h3 className="mt-3 font-display text-[17px] font-semibold">Ask Nexus AI</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">
              Interview prep, résumé review, skill ordering or a career-change plan — answered using your stored profile.
            </p>
            <Link
              href="/assistant"
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-4 text-[13px] font-semibold text-ink-950 transition-colors hover:bg-brand-400"
            >
              Open assistant <ArrowRight className="size-3.5" />
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
