"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  Compass,
  History,
  Lightbulb,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  Ring,
  Skeleton,
  useToast,
  cn,
} from "@/components/ui";
import { useFetch } from "@/lib/use-api";
import { api, errorMessage, relativeTime } from "@/lib/client";

type Career = {
  id: string;
  title: string;
  family: string;
  summary: string;
  minEducation: string;
  salaryRange: string;
  outlook: string;
  coreSkills: string[];
  certifications: string[];
};

type Analysis = {
  id: string;
  careerId: string;
  careerTitle: string;
  readinessScore: number;
  profileSummary: string;
  strengths: { skill: string; note: string }[] | null;
  gaps: { skill: string; priority: string; note: string }[] | null;
  recommendedSkills: string[] | null;
  recommendedCertifications: string[] | null;
  suggestedProjects: { title: string; detail: string }[] | null;
  opportunities: string[] | null;
  shortTerm: string[] | null;
  longTerm: string[] | null;
  engine: string;
  aiInsight: string | null;
  createdAt: string;
};

type AiStatus = { configured: boolean; provider: string; model: string };

const PRIORITY_TONE: Record<string, string> = { high: "red", medium: "amber", low: "neutral" };

export default function AnalyzerPage() {
  const toast = useToast();
  const router = useRouter();
  const careers = useFetch<{ items: Career[]; families: string[] }>("/api/careers");
  const analyses = useFetch<{ items: Analysis[]; ai: AiStatus }>("/api/analyses");

  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [useAi, setUseAi] = useState(true);
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) setViewId(id);
  }, []);

  useEffect(() => {
    if (!analyses.data?.items.length || viewId) return;
    setViewId(analyses.data.items[0].id);
  }, [analyses.data, viewId]);

  const families = useMemo(() => careers.data?.families ?? [], [careers.data]);
  const filtered = (careers.data?.items ?? [])
    .filter((c) => (family === "all" ? true : c.family === family))
    .filter((c) => (query.trim() ? `${c.title} ${c.family} ${c.summary}`.toLowerCase().includes(query.toLowerCase()) : true));

  const current = analyses.data?.items.find((a) => a.id === viewId) ?? null;
  const ai = analyses.data?.ai;

  async function run() {
    if (!selected) {
      toast.error("Choose a career first", "Pick the profession you want to be measured against.");
      return;
    }
    setRunning(true);
    try {
      const res = await api<{ item: Analysis }>("/api/analyses", {
        method: "POST",
        json: { careerId: selected, useAi },
      });
      setViewId(res.item.id);
      analyses.reload();
      toast.success("Analysis complete", `${res.item.careerTitle}: ${res.item.readinessScore}% ready.`);
    } catch (e) {
      toast.error("Analysis failed", errorMessage(e));
    } finally {
      setRunning(false);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/analyses/${id}`, { method: "DELETE" });
      toast.success("Analysis deleted");
      if (viewId === id) setViewId(null);
      analyses.reload();
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
        title="Intelligent career analyzer"
        description="Choose any profession. Career Nexus compares it against your stored education, skills, projects, certifications and experience — then reports strengths, gaps and the exact next moves."
      />

      {ai && !ai.configured ? (
        <div className="mb-5">
          <Alert tone="warning" title="AI enrichment is disabled on this server">
            The analysis below is fully computed by the built-in rules engine from your real data — it does not need an
            AI provider. To add an AI-written strategic insight, set <code>OPENAI_API_KEY</code> or{" "}
            <code>ANTHROPIC_API_KEY</code> on the server (optionally <code>OPENAI_MODEL</code> /{" "}
            <code>ANTHROPIC_MODEL</code>).
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader icon={<Target className="size-[18px]" />} title="1 · Choose a target career" subtitle={`${careers.data?.items.length ?? 0} professions available`} />
            <div className="p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search careers…" className="pl-9" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <button
                  onClick={() => setFamily("all")}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11.5px] font-medium",
                    family === "all" ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 text-ink-600 hover:border-ink-300",
                  )}
                >
                  All fields
                </button>
                {families.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFamily(family === f ? "all" : f)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11.5px] font-medium",
                      family === f ? "border-brand-600 bg-brand-600 text-white" : "border-ink-200 text-ink-600 hover:border-ink-300",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="mt-3 max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
                {careers.loading ? (
                  Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)
                ) : filtered.length === 0 ? (
                  <EmptyState compact icon={<Search className="size-5" />} title="No career matches" message="Try a broader term such as 'nurse', 'analyst' or 'engineer'." />
                ) : (
                  filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c.id)}
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-all",
                        selected === c.id
                          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500/30"
                          : "border-ink-200 hover:border-ink-300 hover:bg-ink-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold text-ink-900">{c.title}</p>
                          <p className="text-[11.5px] text-ink-500">{c.family} · {c.salaryRange}</p>
                        </div>
                        {selected === c.id ? <CheckCircle2 className="size-4 shrink-0 text-brand-600" /> : null}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-ink-500">{c.summary}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader icon={<Compass className="size-[18px]" />} title="2 · Run the analysis" />
            <div className="space-y-3 p-5">
              {ai?.configured ? (
                <label className="flex items-start gap-2.5 rounded-xl border border-ink-200 p-3">
                  <input
                    type="checkbox"
                    checked={useAi}
                    onChange={(e) => setUseAi(e.target.checked)}
                    className="mt-0.5 size-4 accent-brand-600"
                  />
                  <span>
                    <span className="block text-[13px] font-medium text-ink-800">Add AI strategic insight</span>
                    <span className="block text-[11.5px] text-ink-500">
                      Uses {ai.provider} ({ai.model}). Clearly separated from the rule-based results.
                    </span>
                  </span>
                </label>
              ) : null}
              <Button full size="lg" onClick={run} loading={running} icon={<Sparkles className="size-4" />}>
                Analyse my readiness
              </Button>
              <p className="text-[11.5px] leading-relaxed text-ink-400">
                Results are deterministic: the same profile data always produces the same score and gap list.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader icon={<History className="size-[18px]" />} title="Analysis history" subtitle={`${analyses.data?.items.length ?? 0} saved`} />
            <div className="max-h-64 overflow-y-auto p-3">
              {analyses.loading ? (
                <Skeleton className="h-12" />
              ) : (analyses.data?.items.length ?? 0) === 0 ? (
                <p className="px-2 py-3 text-[12.5px] text-ink-500">No analyses yet.</p>
              ) : (
                <ul className="space-y-1">
                  {analyses.data!.items.map((a) => (
                    <li key={a.id}>
                      <div
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors",
                          viewId === a.id ? "bg-ink-900 text-white" : "hover:bg-ink-100",
                        )}
                      >
                        <button onClick={() => setViewId(a.id)} className="min-w-0 flex-1 text-left">
                          <p className="truncate text-[12.5px] font-medium">{a.careerTitle}</p>
                          <p className={cn("text-[11px]", viewId === a.id ? "text-white/60" : "text-ink-400")}>
                            {a.readinessScore}% · {relativeTime(a.createdAt)}
                          </p>
                        </button>
                        <button
                          onClick={() => setConfirmId(a.id)}
                          aria-label="Delete analysis"
                          className={cn("shrink-0", viewId === a.id ? "text-white/60 hover:text-white" : "text-ink-400 hover:text-red-600")}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        <div>
          {running ? (
            <Card className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            </Card>
          ) : !current ? (
            <Card className="p-6">
              <EmptyState
                icon={<Compass className="size-5" />}
                title="Select a career and run your analysis"
                message="You will get a readiness score, a strengths list, prioritised skill gaps, certification recommendations, project ideas and short/long-term plans — all computed from your own data."
              />
            </Card>
          ) : (
            <div className="space-y-5">
              <Card>
                <CardHeader
                  icon={<Target className="size-[18px]" />}
                  title={`${current.careerTitle} — readiness report`}
                  subtitle={`Run ${relativeTime(current.createdAt)} · engine: ${current.engine}`}
                  action={<Badge tone={current.readinessScore >= 70 ? "green" : current.readinessScore >= 40 ? "amber" : "red"}>{current.readinessScore}% ready</Badge>}
                />
                <div className="grid gap-5 p-5 sm:grid-cols-[150px_1fr]">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-ink-50 p-4">
                    <Ring value={current.readinessScore} size={110} label="match" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-400 uppercase">Current career profile</p>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-700">{current.profileSummary}</p>
                    {current.aiInsight ? (
                      <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3.5">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-violet-700 uppercase">
                          <Lightbulb className="size-3.5" /> AI-generated insight
                        </p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-violet-900">{current.aiInsight}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardHeader icon={<CheckCircle2 className="size-[18px]" />} title="Existing strengths" subtitle={`${current.strengths?.length ?? 0} identified from your data`} />
                  <ul className="space-y-2.5 p-5">
                    {(current.strengths ?? []).map((s) => (
                      <li key={s.skill} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                        <p className="text-[13px] font-semibold text-emerald-900">{s.skill}</p>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-emerald-800/80">{s.note}</p>
                      </li>
                    ))}
                    {(current.strengths?.length ?? 0) === 0 ? (
                      <li className="text-[13px] text-ink-500">No matching strengths were found. Add your skills to be scored.</li>
                    ) : null}
                  </ul>
                </Card>

                <Card>
                  <CardHeader icon={<TrendingUp className="size-[18px]" />} title="Skill-gap analysis" subtitle="Missing and under-developed requirements" />
                  <ul className="max-h-[420px] space-y-2.5 overflow-y-auto p-5">
                    {(current.gaps ?? []).map((g) => (
                      <li key={g.skill} className="rounded-xl border border-ink-200 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold text-ink-900">{g.skill}</p>
                          <Badge tone={PRIORITY_TONE[g.priority] ?? "neutral"}>{g.priority} priority</Badge>
                        </div>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">{g.note}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardHeader icon={<Sparkles className="size-[18px]" />} title="Recommended skills" subtitle="Add these to your profile as you learn them" />
                  <div className="flex flex-wrap gap-1.5 p-5">
                    {(current.recommendedSkills ?? []).map((s) => (
                      <Badge key={s} tone="brand">{s}</Badge>
                    ))}
                  </div>
                </Card>

                <Card>
                  <CardHeader icon={<Award className="size-[18px]" />} title="Relevant certifications" subtitle="You do not hold these yet" />
                  <ul className="space-y-2 p-5">
                    {(current.recommendedCertifications ?? []).map((c) => (
                      <li key={c} className="flex items-start gap-2 rounded-xl bg-ink-50 px-3 py-2.5 text-[13px] text-ink-700">
                        <Award className="mt-0.5 size-4 shrink-0 text-brand-600" />
                        {c}
                      </li>
                    ))}
                    {(current.recommendedCertifications?.length ?? 0) === 0 ? (
                      <li className="text-[13px] text-ink-500">You already hold the recognised certifications for this path.</li>
                    ) : null}
                  </ul>
                </Card>
              </div>

              <Card>
                <CardHeader icon={<Target className="size-[18px]" />} title="Suggested projects" subtitle="Built to close the gaps above and create visible evidence" />
                <div className="grid gap-3 p-5 sm:grid-cols-3">
                  {(current.suggestedProjects ?? []).map((p) => (
                    <div key={p.title} className="rounded-xl border border-ink-200 p-3.5">
                      <p className="text-[13px] font-semibold text-ink-900">{p.title}</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">{p.detail}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Short-term priorities" subtitle="Next 30–90 days" />
                  <ol className="space-y-2 p-5">
                    {(current.shortTerm ?? []).map((s, i) => (
                      <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-700">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </Card>
                <Card>
                  <CardHeader title="Long-term development" subtitle="12–36 months" />
                  <ol className="space-y-2 p-5">
                    {(current.longTerm ?? []).map((s, i) => (
                      <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-700">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ink-100 text-[11px] font-bold text-ink-600">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </Card>
              </div>

              <Card>
                <CardHeader icon={<TrendingUp className="size-[18px]" />} title="Career opportunities" />
                <ul className="grid gap-2 p-5 sm:grid-cols-2">
                  {(current.opportunities ?? []).map((o) => (
                    <li key={o} className="rounded-xl bg-ink-50 px-3.5 py-2.5 text-[13px] text-ink-700">{o}</li>
                  ))}
                </ul>
                <div className="border-t border-ink-100 px-5 py-4">
                  <Button onClick={() => router.push("/roadmaps")} icon={<TrendingUp className="size-4" />}>
                    Turn this into a roadmap
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Delete this analysis?"
        message="The saved report will be permanently removed. Your profile data is unaffected."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && remove(confirmId)}
      />
    </>
  );
}
