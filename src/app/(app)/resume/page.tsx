"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  FileText,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
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
  Skeleton,
  Textarea,
  useToast,
  cn,
} from "@/components/ui";
import { useFetch } from "@/lib/use-api";
import { api, errorMessage, label } from "@/lib/client";
import { RESUME_TEMPLATES } from "@/lib/resume-shared";

type ResumeMeta = {
  id: string;
  title: string;
  template: string;
  accentColor: string;
  summary: string | null;
  contact: Record<string, string> | null;
  sections: string[] | null;
  extras: Record<string, { title: string; detail: string }[]> | null;
  updatedAt: string;
};

type ResumeData = {
  name: string;
  avatarUrl: string | null;
  headline: string;
  contact: Record<string, string>;
  summary: string;
  template: string;
  accentColor: string;
  sections: string[];
  skills: { name: string; proficiency: string; category: string }[];
  languages: { name: string; overall: string }[];
  experience: { role: string; company: string; location: string; start: string; end: string; description: string }[];
  education: { degree: string; institution: string; field: string; start: string; end: string; grade: string }[];
  projects: { name: string; description: string; technologies: string[]; url: string; github: string }[];
  certifications: { name: string; issuer: string; issuedAt: string }[];
  achievements: { title: string; detail: string }[];
};

const ALL_SECTIONS = ["summary", "skills", "experience", "projects", "education", "certifications", "languages", "achievements"];
const ACCENTS = ["#0f766e", "#1d4ed8", "#7c3aed", "#b91c1c", "#0f172a", "#c2410c"];

export default function ResumePage() {
  const toast = useToast();
  const list = useFetch<{ items: ResumeMeta[] }>("/api/resumes");
  const [activeId, setActiveId] = useState<string | null>(null);
  const detail = useFetch<{ resume: ResumeMeta; data: ResumeData }>(
    activeId ? `/api/resumes/${activeId}` : null,
    [activeId],
  );

  const [form, setForm] = useState<ResumeMeta | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    if (list.data?.items.length && !activeId) setActiveId(list.data.items[0].id);
  }, [list.data, activeId]);

  useEffect(() => {
    if (detail.data?.resume) {
      setForm(detail.data.resume);
      setDirty(false);
    }
  }, [detail.data]);

  const data = detail.data?.data;

  async function createResume() {
    try {
      const res = await api<{ resume: ResumeMeta }>("/api/resumes", { method: "POST", json: {} });
      toast.success("Résumé created", "It is pre-filled from your profile data.");
      list.reload();
      setActiveId(res.resume.id);
    } catch (e) {
      toast.error("Could not create the résumé", errorMessage(e));
    }
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      await api(`/api/resumes/${form.id}`, {
        method: "PATCH",
        json: {
          title: form.title,
          template: form.template,
          accentColor: form.accentColor,
          summary: form.summary ?? "",
          contact: form.contact ?? {},
          sections: form.sections ?? [],
          extras: form.extras ?? {},
        },
      });
      setDirty(false);
      toast.success("Résumé saved");
      list.reload();
      detail.reload();
    } catch (e) {
      toast.error("Could not save", errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/resumes/${id}`, { method: "DELETE" });
      toast.success("Résumé deleted");
      if (activeId === id) setActiveId(null);
      list.reload();
    } catch (e) {
      toast.error("Could not delete", errorMessage(e));
    } finally {
      setConfirmId(null);
    }
  }

  const set = <K extends keyof ResumeMeta>(key: K, value: ResumeMeta[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setDirty(true);
  };

  return (
    <>
      <PageHeader
        eyebrow="Grow"
        title="Résumé builder"
        description="Builds directly from your verified profile, skills, experience, projects and certifications. Export a real PDF at any time."
        actions={
          <>
            <Button variant="secondary" icon={<Plus className="size-4" />} onClick={createResume}>
              New résumé
            </Button>
            {activeId ? (
              <Button
                icon={<Download className="size-4" />}
                onClick={() => window.open(`/api/resumes/${activeId}/pdf`, "_blank", "noopener")}
              >
                Download PDF
              </Button>
            ) : null}
          </>
        }
      />

      {!list.loading && (list.data?.items.length ?? 0) === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<FileText className="size-5" />}
            title="No résumés yet"
            message="Create one and Career Nexus will pull your name, contact details, summary, skills, experience, projects, education and certifications straight from your profile."
            action={<Button onClick={createResume} icon={<Plus className="size-4" />}>Create my first résumé</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <Card className="h-fit">
            <CardHeader title="Saved résumés" subtitle={`${list.data?.items.length ?? 0} versions`} />
            <div className="p-2">
              {list.loading ? (
                <Skeleton className="m-2 h-12" />
              ) : (
                <ul className="space-y-1">
                  {list.data!.items.map((r) => (
                    <li key={r.id}>
                      <div
                        className={cn(
                          "group flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors",
                          activeId === r.id ? "bg-ink-900 text-white" : "hover:bg-ink-100",
                        )}
                      >
                        <button onClick={() => setActiveId(r.id)} className="min-w-0 flex-1 text-left">
                          <p className="truncate text-[12.5px] font-medium">{r.title}</p>
                          <p className={cn("text-[11px]", activeId === r.id ? "text-white/55" : "text-ink-400")}>
                            {label(r.template)} template
                          </p>
                        </button>
                        <button
                          onClick={() => setConfirmId(r.id)}
                          aria-label="Delete résumé"
                          className={cn("shrink-0 opacity-0 transition-opacity group-hover:opacity-100", activeId === r.id ? "text-white/60 hover:text-white" : "text-ink-400 hover:text-red-600")}
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

          {detail.loading || !form || !data ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <Skeleton className="h-[520px] rounded-2xl" />
              <Skeleton className="hidden h-[520px] rounded-2xl xl:block" />
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              <Card className="h-fit">
                <CardHeader
                  title="Editor"
                  subtitle={dirty ? "Unsaved changes" : "All changes saved"}
                  action={
                    <Button size="sm" onClick={save} loading={saving} disabled={!dirty} icon={<Save className="size-3.5" />}>
                      Save
                    </Button>
                  }
                />
                <div className="space-y-4 p-5">
                  <Field label="Résumé title">
                    <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
                  </Field>

                  <div>
                    <p className="mb-1.5 text-[13px] font-medium text-ink-700">Template</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {RESUME_TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => set("template", t.id)}
                          className={cn(
                            "rounded-xl border p-3 text-left transition-all",
                            form.template === t.id ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500/30" : "border-ink-200 hover:border-ink-300",
                          )}
                        >
                          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-900">
                            {form.template === t.id ? <Check className="size-3.5 text-brand-600" /> : null}
                            {t.name}
                          </p>
                          <p className="mt-1 text-[11.5px] leading-snug text-ink-500">{t.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[13px] font-medium text-ink-700">Accent colour</p>
                    <div className="flex flex-wrap gap-2">
                      {ACCENTS.map((c) => (
                        <button
                          key={c}
                          onClick={() => set("accentColor", c)}
                          aria-label={`Use accent ${c}`}
                          className={cn(
                            "grid size-8 place-items-center rounded-full ring-offset-2 transition-all",
                            form.accentColor === c ? "ring-2 ring-ink-900" : "hover:scale-110",
                          )}
                          style={{ background: c }}
                        >
                          {form.accentColor === c ? <Check className="size-4 text-white" /> : null}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Field label="Professional summary" hint="Overrides the summary from your profile.">
                    <Textarea
                      value={form.summary ?? ""}
                      onChange={(e) => set("summary", e.target.value)}
                      placeholder="Three lines: who you are, your strongest evidence, what you want next."
                    />
                  </Field>

                  <div>
                    <p className="mb-1.5 text-[13px] font-medium text-ink-700">Contact details</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {["email", "phone", "location", "linkedin", "github", "portfolio"].map((k) => (
                        <Field key={k} label={label(k)}>
                          <Input
                            value={form.contact?.[k] ?? ""}
                            onChange={(e) => set("contact", { ...(form.contact ?? {}), [k]: e.target.value })}
                          />
                        </Field>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11.5px] text-ink-400">
                      Empty fields fall back to your profile values. Blank entries are omitted from the PDF.
                    </p>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[13px] font-medium text-ink-700">Sections & order</p>
                    <ul className="space-y-1.5">
                      {(form.sections ?? []).map((s, i) => (
                        <li key={s} className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2">
                          <span className="grid size-5 place-items-center rounded bg-ink-100 text-[11px] font-bold text-ink-600">{i + 1}</span>
                          <span className="flex-1 text-[13px] font-medium text-ink-800">{SECTION_LABELS[s] ?? label(s)}</span>
                          <IconButton label="Move up" className="size-7" disabled={i === 0} onClick={() => move(i, -1)}>
                            <ArrowUp className="size-3.5" />
                          </IconButton>
                          <IconButton label="Move down" className="size-7" disabled={i === (form.sections?.length ?? 0) - 1} onClick={() => move(i, 1)}>
                            <ArrowDown className="size-3.5" />
                          </IconButton>
                          <IconButton label="Remove section" className="size-7 hover:bg-red-50 hover:text-red-600" onClick={() => set("sections", (form.sections ?? []).filter((x) => x !== s))}>
                            <Trash2 className="size-3.5" />
                          </IconButton>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ALL_SECTIONS.filter((s) => !(form.sections ?? []).includes(s)).map((s) => (
                        <button
                          key={s}
                          onClick={() => set("sections", [...(form.sections ?? []), s])}
                          className="rounded-full border border-dashed border-ink-300 px-2.5 py-1 text-[12px] text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-700"
                        >
                          + {SECTION_LABELS[s] ?? label(s)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-[13px] font-medium text-ink-700">Achievements</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Plus className="size-3.5" />}
                        onClick={() =>
                          set("extras", {
                            ...(form.extras ?? {}),
                            achievements: [...((form.extras ?? {}).achievements ?? []), { title: "", detail: "" }],
                          })
                        }
                      >
                        Add
                      </Button>
                    </div>
                    {((form.extras ?? {}).achievements ?? []).length === 0 ? (
                      <p className="rounded-lg border border-dashed border-ink-200 px-3 py-4 text-center text-[12px] text-ink-400">
                        Quantified wins belong here — &quot;cut reporting time by 83%&quot;, &quot;recovered 210 accounts&quot;.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {((form.extras ?? {}).achievements ?? []).map((a, i) => (
                          <li key={i} className="rounded-lg border border-ink-200 p-2.5">
                            <div className="flex gap-2">
                              <Input
                                value={a.title}
                                placeholder="Achievement title"
                                onChange={(e) => updateAchievement(i, "title", e.target.value)}
                              />
                              <IconButton
                                label="Remove achievement"
                                className="shrink-0 hover:bg-red-50 hover:text-red-600"
                                onClick={() =>
                                  set("extras", {
                                    ...(form.extras ?? {}),
                                    achievements: ((form.extras ?? {}).achievements ?? []).filter((_, x) => x !== i),
                                  })
                                }
                              >
                                <Trash2 className="size-4" />
                              </IconButton>
                            </div>
                            <Input
                              value={a.detail}
                              placeholder="What happened, with numbers"
                              className="mt-2"
                              onChange={(e) => updateAchievement(i, "detail", e.target.value)}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {detail.error ? <Alert tone="error">{detail.error}</Alert> : null}
                </div>
              </Card>

              <div className="xl:sticky xl:top-20 xl:h-fit">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-ink-700">Live preview</p>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{label(form.template)}</Badge>
                    <Button size="sm" variant="secondary" onClick={() => setPreview((v) => !v)}>
                      {preview ? "Hide" : "Show"}
                    </Button>
                  </div>
                </div>
                {preview ? (
                  <ResumePreview resume={form} data={data} />
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Delete this résumé?"
        message="The saved version is removed. Your profile data is untouched."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && remove(confirmId)}
      />
    </>
  );

  function move(index: number, dir: number) {
    const sections = [...(form?.sections ?? [])];
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    set("sections", sections);
  }

  function updateAchievement(index: number, key: "title" | "detail", value: string) {
    const items = [...(((form?.extras ?? {}).achievements) ?? [])];
    items[index] = { ...items[index], [key]: value };
    set("extras", { ...(form?.extras ?? {}), achievements: items });
  }
}

const SECTION_LABELS: Record<string, string> = {
  summary: "Professional summary",
  skills: "Skills",
  experience: "Work experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
  languages: "Languages",
  achievements: "Achievements",
};

function ResumePreview({ resume, data }: { resume: ResumeMeta; data: ResumeData }) {
  const accent = resume.accentColor;
  const summary = resume.summary || data.summary;
  const contact = { ...data.contact, ...(resume.contact ?? {}) };
  const entries = Object.entries(contact).filter(([, v]) => v && String(v).trim());
  const isModern = resume.template === "modern";
  const compact = resume.template === "compact";

  const Heading = ({ children }: { children: React.ReactNode }) => (
    <div className="mt-4 mb-2 border-b pb-1" style={{ borderColor: accent }}>
      <h3 className="text-[11px] font-bold tracking-[0.12em] uppercase" style={{ color: accent }}>
        {children}
      </h3>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lift">
      <div className={cn("flex", isModern && "min-h-[900px]")}>
        {isModern ? (
          <aside className="hidden w-[34%] shrink-0 bg-ink-900 p-5 text-white sm:block">
            <div
              className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full text-xl font-bold text-white"
              style={{ background: accent }}
            >
              {data.avatarUrl ? (
                <Image
                  src={data.avatarUrl}
                  alt={`${data.name} profile photo`}
                  width={64}
                  height={64}
                  unoptimized
                  className="size-full rounded-full object-cover"
                />
              ) : (
                data.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("")
              )}
            </div>
            <h2 className="mt-4 text-[17px] leading-tight font-bold">{data.name}</h2>
            {data.headline ? <p className="mt-1 text-[11px] text-white/60">{data.headline}</p> : null}
            <div className="mt-4 border-t border-white/15 pt-3">
              <p className="text-[9.5px] font-bold tracking-[0.12em] uppercase" style={{ color: accent }}>Contact</p>
              <ul className="mt-2 space-y-1.5">
                {entries.map(([k, v]) => (
                  <li key={k} className="text-[10px] leading-snug break-all text-white/75">
                    <span className="text-white/45">{label(k)}:</span> {String(v)}
                  </li>
                ))}
              </ul>
            </div>
            {data.languages.length ? (
              <div className="mt-4 border-t border-white/15 pt-3">
                <p className="text-[9.5px] font-bold tracking-[0.12em] uppercase" style={{ color: accent }}>Languages</p>
                <ul className="mt-2 space-y-1">
                  {data.languages.map((l) => (
                    <li key={l.name} className="text-[10px] text-white/75">{l.name} — {label(l.overall)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        ) : null}

        <div className={cn("min-w-0 flex-1", isModern ? "border-l-4 p-5" : compact ? "p-5" : "p-6")} style={isModern ? { borderColor: accent } : undefined}>
          {!isModern ? (
            <header className="border-b-2 pb-3 text-center" style={{ borderColor: accent }}>
              <h2 className={cn("font-bold text-ink-900", compact ? "text-[20px]" : "text-[24px]")}>{data.name}</h2>
              {data.headline ? (
                <p className="mt-0.5 text-[12px] font-medium" style={{ color: accent }}>{data.headline}</p>
              ) : null}
              <p className="mt-1.5 text-[10px] text-ink-500">
                {entries.map(([k, v]) => (k === "email" || k === "phone" ? String(v) : `${label(k)}: ${v}`)).join("  |  ")}
              </p>
            </header>
          ) : (
            <header className="mb-1">
              <h2 className="text-[20px] font-bold text-ink-900">{data.name}</h2>
              {data.headline ? <p className="text-[12px] font-medium" style={{ color: accent }}>{data.headline}</p> : null}
            </header>
          )}

          {(resume.sections ?? []).map((section) => {
            if (section === "summary" && summary)
              return (
                <section key="summary">
                  <Heading>Professional Summary</Heading>
                  <p className="text-[11px] leading-relaxed text-ink-700">{summary}</p>
                </section>
              );

            if (section === "skills" && data.skills.length)
              return (
                <section key="skills">
                  <Heading>Skills</Heading>
                  <div className="space-y-1">
                    {Array.from(new Set(data.skills.map((s) => s.category))).map((cat) => (
                      <p key={cat} className="text-[10.5px] leading-relaxed text-ink-700">
                        <span className="font-semibold text-ink-900">{cat}:</span>{" "}
                        <span className="text-ink-500">
                          {data.skills.filter((s) => s.category === cat).map((s) => `${s.name} (${label(s.proficiency)})`).join(", ")}
                        </span>
                      </p>
                    ))}
                  </div>
                </section>
              );

            if (section === "experience" && data.experience.length)
              return (
                <section key="experience">
                  <Heading>Work Experience</Heading>
                  <div className="space-y-2.5">
                    {data.experience.map((e, i) => (
                      <div key={i}>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-[11.5px] font-bold text-ink-900">{e.role}</p>
                          <p className="shrink-0 text-[10px] text-ink-500">{[e.start, e.end].filter(Boolean).join(" – ")}</p>
                        </div>
                        <p className="text-[10.5px] font-medium" style={{ color: accent }}>
                          {[e.company, e.location].filter(Boolean).join(" · ")}
                        </p>
                        {e.description ? (
                          <ul className="mt-1 space-y-0.5">
                            {e.description.split("\n").filter(Boolean).map((line, j) => (
                              <li key={j} className="flex gap-1.5 text-[10.5px] leading-snug text-ink-700">
                                <span>•</span>
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              );

            if (section === "projects" && data.projects.length)
              return (
                <section key="projects">
                  <Heading>Projects</Heading>
                  <div className="space-y-2">
                    {data.projects.map((p, i) => (
                      <div key={i}>
                        <p className="text-[11.5px] font-bold text-ink-900">{p.name}</p>
                        {p.description ? <p className="text-[10.5px] leading-snug text-ink-700">{p.description}</p> : null}
                        {p.technologies.length ? (
                          <p className="mt-0.5 text-[10px] text-ink-500">Technologies: {p.technologies.join(", ")}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              );

            if (section === "education" && data.education.length)
              return (
                <section key="education">
                  <Heading>Education</Heading>
                  <div className="space-y-1.5">
                    {data.education.map((e, i) => (
                      <div key={i}>
                        <p className="text-[11.5px] font-bold text-ink-900">{e.degree}</p>
                        <p className="text-[10.5px] text-ink-500">
                          {[e.institution, e.field, [e.start, e.end].filter(Boolean).join(" – "), e.grade].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              );

            if (section === "certifications" && data.certifications.length)
              return (
                <section key="certifications">
                  <Heading>Certifications</Heading>
                  <ul className="space-y-0.5">
                    {data.certifications.map((c, i) => (
                      <li key={i} className="flex gap-1.5 text-[10.5px] text-ink-700">
                        <span>•</span>
                        <span>{[c.name, c.issuer, c.issuedAt].filter(Boolean).join(" — ")}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );

            if (section === "languages" && data.languages.length && !isModern)
              return (
                <section key="languages">
                  <Heading>Languages</Heading>
                  <p className="text-[10.5px] text-ink-700">
                    {data.languages.map((l) => `${l.name} (${label(l.overall)})`).join(" · ")}
                  </p>
                </section>
              );

            if (section === "achievements" && data.achievements.length)
              return (
                <section key="achievements">
                  <Heading>Achievements</Heading>
                  <ul className="space-y-0.5">
                    {data.achievements.map((a, i) => (
                      <li key={i} className="flex gap-1.5 text-[10.5px] text-ink-700">
                        <span>•</span>
                        <span>{a.detail ? `${a.title} — ${a.detail}` : a.title}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
