"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  Camera,
  Check,
  GraduationCap,
  Loader2,
  Pencil,
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
  Modal,
  PageHeader,
  ProgressBar,
  Ring,
  Select,
  Skeleton,
  Tabs,
  TagInput,
  Textarea,
  useToast,
} from "@/components/ui";
import { useFetch } from "@/lib/use-api";
import { api, errorMessage } from "@/lib/client";
import {
  AGE_RANGES,
  CAREERS,
  EDUCATION_OPTIONS,
  EMPLOYMENT_OPTIONS,
  INDUSTRIES,
  INTERESTS,
  LEARNING_STYLES,
} from "@/lib/catalog-shared";

type ProfileRes = {
  user: { id: string; fullName: string; email: string; avatarUrl: string | null };
  profile: Record<string, unknown> | null;
  completion: { percent: number; completed: string[]; missing: { label: string; link: string }[] };
};

type Experience = {
  id: string;
  role: string;
  company: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
};

type Education = {
  id: string;
  degree: string;
  institution: string;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
  grade: string | null;
  description: string | null;
};

const TABS = [
  { id: "personal", label: "Personal" },
  { id: "career", label: "Career & goals" },
  { id: "links", label: "Links" },
  { id: "experience", label: "Work experience" },
  { id: "education", label: "Education" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const EMPTY_EXPERIENCE = { role: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" };
const EMPTY_EDUCATION = { degree: "", institution: "", field: "", startDate: "", endDate: "", grade: "", description: "" };

export default function ProfilePage() {
  const toast = useToast();
  const profileRes = useFetch<ProfileRes>("/api/profile");
  const experienceRes = useFetch<{ items: Experience[] }>("/api/profile/experience");
  const educationRes = useFetch<{ items: Education[] }>("/api/profile/education");

  const [tab, setTab] = useState<TabId>("personal");
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [fullName, setFullName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const onboarding = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("onboarding")) {
      onboarding.current = true;
    }
  }, []);

  useEffect(() => {
    if (!profileRes.data) return;
    const p = (profileRes.data.profile ?? {}) as Record<string, unknown>;
    setForm({
      ...p,
      careerInterests: p.careerInterests ?? [],
      preferredIndustries: p.preferredIndustries ?? [],
      otherLinks: p.otherLinks ?? [],
      weeklyHours: p.weeklyHours ?? 10,
      targetCareerId: p.targetCareerId ?? "",
    });
    setFullName(profileRes.data.user.fullName);
    setDirty(false);
  }, [profileRes.data]);

  const set = (key: string, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const completion = profileRes.data?.completion;
  const careerOptions = useMemo(() => CAREERS.map((c) => ({ id: c.id, title: c.title, family: c.family })), []);

  async function save() {
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.targetCareerId === "") payload.targetCareerId = null;
      await api("/api/profile", { method: "PATCH", json: payload });
      if (fullName.trim() && fullName !== profileRes.data?.user.fullName) {
        await api("/api/profile/name", { method: "PATCH", json: { fullName: fullName.trim() } });
      }
      setDirty(false);
      toast.success("Profile saved", "Everything is stored in your account.");
      profileRes.reload();
    } catch (e) {
      toast.error("Could not save your profile", errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    setAvatarBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api("/api/avatar", { method: "POST", body: fd });
      toast.success("Profile photo updated");
      profileRes.reload();
    } catch (e) {
      toast.error("Upload failed", errorMessage(e));
    } finally {
      setAvatarBusy(false);
    }
  }

  const initials = (profileRes.data?.user.fullName ?? "")
    .split(" ")
    .map((x) => x[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <PageHeader
        eyebrow="Your record"
        title="Profile & personal information"
        description="Everything here feeds your career analysis, roadmap and résumé. Non-essential fields can be skipped and completed later."
        actions={
          <Button onClick={save} loading={saving} disabled={!dirty} icon={<Save className="size-4" />}>
            {dirty ? "Save changes" : "Saved"}
          </Button>
        }
      />

      {onboarding.current ? (
        <div className="mb-5">
          <Alert tone="success" title="Welcome to Career Nexus">
            Start with the basics below — even five skills and a career goal are enough to generate a useful roadmap.
          </Alert>
        </div>
      ) : null}

      {profileRes.error ? (
        <div className="mb-5">
          <Alert tone="error" title="Could not load your profile">
            {profileRes.error}
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          <Card>
            <div className="flex items-center gap-4 border-b border-ink-100 p-5">
              <div className="relative">
                {profileRes.data?.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/api/avatar/file"
                    alt="Your profile"
                    className="size-16 rounded-2xl border border-ink-200 object-cover"
                  />
                ) : (
                  <span className="grid size-16 place-items-center rounded-2xl bg-ink-900 text-lg font-semibold text-white">
                    {profileRes.loading ? "" : initials}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarBusy}
                  aria-label="Upload profile photo"
                  className="absolute -right-1.5 -bottom-1.5 grid size-7 place-items-center rounded-full border-2 border-white bg-brand-600 text-white shadow transition-colors hover:bg-brand-700 disabled:opacity-60"
                >
                  {avatarBusy ? <Loader2 className="size-3.5 animate-spin-slow" /> : <Camera className="size-3.5" />}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadAvatar(f);
                    e.target.value = "";
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <Field label="Full name">
                  <Input value={fullName} onChange={(e) => { setFullName(e.target.value); setDirty(true); }} />
                </Field>
                <p className="mt-1.5 truncate text-[12.5px] text-ink-500">{profileRes.data?.user.email}</p>
              </div>
            </div>

            <div className="border-b border-ink-100 px-5 py-3.5">
              <Tabs tabs={TABS.map((t) => ({ id: t.id, label: t.label }))} value={tab} onChange={(v) => setTab(v as TabId)} />
            </div>

            <div className="p-5">
              {profileRes.loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-24" />
                </div>
              ) : tab === "personal" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Professional headline" hint="One line shown at the top of your résumé." className="sm:col-span-2">
                    <Input value={String(form.headline ?? "")} onChange={(e) => set("headline", e.target.value)} placeholder="Data Analyst moving into Data Science" />
                  </Field>
                  <Field label="Professional introduction" className="sm:col-span-2" hint="A short paragraph about who you are professionally.">
                    <Textarea value={String(form.bio ?? "")} onChange={(e) => set("bio", e.target.value)} placeholder="Four years of retail analytics…" />
                  </Field>
                  <Field label="Phone">
                    <Input value={String(form.phone ?? "")} onChange={(e) => set("phone", e.target.value)} placeholder="+234 802 555 0148" />
                  </Field>
                  <Field label="Age range" hint="Optional — used only to tailor guidance.">
                    <Select value={String(form.ageRange ?? "")} onChange={(e) => set("ageRange", e.target.value)}>
                      <option value="">Prefer not to say</option>
                      {AGE_RANGES.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Country">
                    <Input value={String(form.country ?? "")} onChange={(e) => set("country", e.target.value)} placeholder="Nigeria" />
                  </Field>
                  <Field label="City">
                    <Input value={String(form.city ?? "")} onChange={(e) => set("city", e.target.value)} placeholder="Lagos" />
                  </Field>
                </div>
              ) : tab === "career" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Employment status">
                    <Select value={String(form.employmentStatus ?? "")} onChange={(e) => set("employmentStatus", e.target.value)}>
                      <option value="">Select…</option>
                      {EMPLOYMENT_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Current profession / role">
                    <Input value={String(form.currentRole ?? "")} onChange={(e) => set("currentRole", e.target.value)} placeholder="Junior Data Analyst" />
                  </Field>
                  <Field label="Highest education level">
                    <Select value={String(form.educationLevel ?? "")} onChange={(e) => set("educationLevel", e.target.value)}>
                      <option value="">Select…</option>
                      {EDUCATION_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Years of experience">
                    <Input value={String(form.yearsExperience ?? "")} onChange={(e) => set("yearsExperience", e.target.value)} placeholder="4 years" />
                  </Field>
                  <Field label="Institution">
                    <Input value={String(form.institution ?? "")} onChange={(e) => set("institution", e.target.value)} placeholder="University of Lagos" />
                  </Field>
                  <Field label="Field of study">
                    <Input value={String(form.fieldOfStudy ?? "")} onChange={(e) => set("fieldOfStudy", e.target.value)} placeholder="Statistics" />
                  </Field>
                  <Field label="Graduation year">
                    <Input value={String(form.graduationYear ?? "")} onChange={(e) => set("graduationYear", e.target.value)} placeholder="2021" />
                  </Field>
                  <Field label="Weekly study hours" hint="Drives how your roadmap is paced.">
                    <Input type="number" min={1} max={80} value={String(form.weeklyHours ?? 10)} onChange={(e) => set("weeklyHours", Number(e.target.value))} />
                  </Field>
                  <Field label="Career goal" className="sm:col-span-2">
                    <Textarea value={String(form.careerGoal ?? "")} onChange={(e) => set("careerGoal", e.target.value)} placeholder="Become a Data Scientist within 12 months…" />
                  </Field>
                  <Field label="Target career" className="sm:col-span-2" hint="Used by the analyzer and roadmap engine.">
                    <Select value={String(form.targetCareerId ?? "")} onChange={(e) => set("targetCareerId", e.target.value)}>
                      <option value="">Not selected yet</option>
                      {careerOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} — {c.family}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Learning preference">
                    <Select value={String(form.learningStyle ?? "")} onChange={(e) => set("learningStyle", e.target.value)}>
                      <option value="">Select…</option>
                      {LEARNING_STYLES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Career interests" className="sm:col-span-2">
                    <TagInput
                      value={(form.careerInterests as string[]) ?? []}
                      onChange={(v) => set("careerInterests", v)}
                      suggestions={INTERESTS}
                      placeholder="Add interests…"
                    />
                  </Field>
                  <Field label="Preferred industries" className="sm:col-span-2">
                    <TagInput
                      value={(form.preferredIndustries as string[]) ?? []}
                      onChange={(v) => set("preferredIndustries", v)}
                      suggestions={INDUSTRIES}
                      placeholder="Add industries…"
                    />
                  </Field>
                </div>
              ) : tab === "links" ? (
                <LinksEditor form={form} set={set} />
              ) : tab === "experience" ? (
                <ExperienceEditor
                  items={experienceRes.data?.items ?? []}
                  loading={experienceRes.loading}
                  reload={experienceRes.reload}
                />
              ) : (
                <EducationEditor
                  items={educationRes.data?.items ?? []}
                  loading={educationRes.loading}
                  reload={educationRes.reload}
                />
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <Ring value={completion?.percent ?? 0} size={84} label="complete" />
              <div>
                <p className="text-[13px] font-semibold text-ink-900">Profile strength</p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-ink-500">
                  {completion?.completed.length ?? 0} of {(completion?.completed.length ?? 0) + (completion?.missing.length ?? 0)} items done
                </p>
              </div>
            </div>
            <ProgressBar value={completion?.percent ?? 0} className="mt-4" />
            <div className="mt-4 space-y-1.5">
              {(completion?.missing ?? []).slice(0, 6).map((m) => (
                <button
                  key={m.label}
                  onClick={() => {
                    setTab(m.link === "/skills" ? "career" : m.link === "/profile" ? "personal" : "personal");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] text-ink-600 transition-colors hover:bg-ink-50"
                >
                  <span className="grid size-4 place-items-center rounded-full border border-ink-300 text-ink-300">
                    <Plus className="size-2.5" />
                  </span>
                  {m.label}
                </button>
              ))}
              {(completion?.missing.length ?? 0) === 0 && !profileRes.loading ? (
                <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12.5px] font-medium text-emerald-700">
                  <Check className="size-3.5" /> Your profile is complete.
                </p>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHeader icon={<Briefcase className="size-[18px]" />} title="Snapshot" />
            <div className="space-y-2.5 p-5 text-[13px]">
              {[
                ["Target career", String(form.targetCareerId ? (CAREERS.find((c) => c.id === form.targetCareerId)?.title ?? "—") : "Not set")],
                ["Location", [form.city, form.country].filter(Boolean).join(", ") || "Not set"],
                ["Experience", String(form.yearsExperience || "Not set")],
                ["Study time", `${form.weeklyHours ?? 0} h/week`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3">
                  <span className="text-ink-500">{k}</span>
                  <span className="max-w-[60%] text-right font-medium text-ink-800">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}

/* --------------------------------- links --------------------------------- */

function LinksEditor({ form, set }: { form: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  const links = (form.otherLinks as { label: string; url: string }[]) ?? [];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="LinkedIn URL">
        <Input value={String(form.linkedinUrl ?? "")} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/…" />
      </Field>
      <Field label="GitHub URL">
        <Input value={String(form.githubUrl ?? "")} onChange={(e) => set("githubUrl", e.target.value)} placeholder="https://github.com/…" />
      </Field>
      <Field label="Portfolio / website" className="sm:col-span-2">
        <Input value={String(form.portfolioUrl ?? "")} onChange={(e) => set("portfolioUrl", e.target.value)} placeholder="https://…" />
      </Field>
      <div className="sm:col-span-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-medium text-ink-700">Other professional links</span>
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus className="size-3.5" />}
            onClick={() => set("otherLinks", [...links, { label: "", url: "" }])}
            disabled={links.length >= 6}
          >
            Add link
          </Button>
        </div>
        {links.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-[12.5px] text-ink-400">
            Kaggle, Behance, Dribbble, ResearchGate, a personal site — anything that shows your work.
          </p>
        ) : (
          <div className="space-y-2">
            {links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={l.label}
                  placeholder="Label"
                  className="max-w-[140px]"
                  onChange={(e) => {
                    const next = [...links];
                    next[i] = { ...next[i], label: e.target.value };
                    set("otherLinks", next);
                  }}
                />
                <Input
                  value={l.url}
                  placeholder="https://…"
                  onChange={(e) => {
                    const next = [...links];
                    next[i] = { ...next[i], url: e.target.value };
                    set("otherLinks", next);
                  }}
                />
                <IconButton
                  label="Remove link"
                  onClick={() => set("otherLinks", links.filter((_, x) => x !== i))}
                  className="hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- experience ------------------------------- */

function ExperienceEditor({
  items,
  loading,
  reload,
}: {
  items: Experience[];
  loading: boolean;
  reload: () => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [form, setForm] = useState(EMPTY_EXPERIENCE);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function start(item?: Experience) {
    setEditing(item ?? null);
    setForm(
      item
        ? {
            role: item.role,
            company: item.company,
            location: item.location ?? "",
            startDate: item.startDate ?? "",
            endDate: item.endDate ?? "",
            isCurrent: item.isCurrent,
            description: item.description ?? "",
          }
        : EMPTY_EXPERIENCE,
    );
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    try {
      if (editing) {
        await api(`/api/profile/experience/${editing.id}`, { method: "PATCH", json: form });
        toast.success("Work experience updated");
      } else {
        await api("/api/profile/experience", { method: "POST", json: form });
        toast.success("Work experience added");
      }
      setOpen(false);
      reload();
    } catch (e) {
      toast.error("Could not save", errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/profile/experience/${id}`, { method: "DELETE" });
      toast.success("Entry removed");
      reload();
    } catch (e) {
      toast.error("Could not delete", errorMessage(e));
    } finally {
      setConfirmId(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] text-ink-500">Roles appear on your résumé and inform leadership recommendations.</p>
        <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => start()}>
          Add role
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-20" />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={<Briefcase className="size-5" />}
          title="No work experience yet"
          message="Add paid roles, internships, volunteering or apprenticeships. Students can start with part-time work."
          action={<Button size="sm" onClick={() => start()}>Add your first role</Button>}
        />
      ) : (
        <ul className="space-y-2.5">
          {items.map((e) => (
            <li key={e.id} className="rounded-xl border border-ink-200 p-4 transition-colors hover:border-ink-300">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink-900">{e.role}</p>
                  <p className="text-[13px] text-ink-600">
                    {e.company}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-400">
                    {[e.startDate, e.isCurrent ? "Present" : e.endDate].filter(Boolean).join(" – ") || "Dates not set"}
                  </p>
                  {e.description ? (
                    <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed whitespace-pre-line text-ink-600">{e.description}</p>
                  ) : null}
                  {e.isCurrent ? (
                    <Badge tone="green" className="mt-2">Current role</Badge>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <IconButton label="Edit" onClick={() => start(e)}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton label="Delete" onClick={() => setConfirmId(e.id)} className="hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit work experience" : "Add work experience"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={submit} loading={busy} disabled={!form.role.trim() || !form.company.trim()}>
              {editing ? "Save changes" : "Add role"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role / job title" required>
            <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Data Analyst" />
          </Field>
          <Field label="Organisation" required>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="BrightPath Retail" />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Lagos, Nigeria" />
          </Field>
          <Field label="Start">
            <Input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} placeholder="Mar 2022" />
          </Field>
          <Field label="End">
            <Input value={form.endDate} disabled={form.isCurrent} onChange={(e) => setForm({ ...form, endDate: e.target.value })} placeholder="Feb 2024" />
          </Field>
          <label className="flex items-center gap-2 pt-6 text-[13px] text-ink-700">
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
              className="size-4 rounded border-ink-300 accent-brand-600"
            />
            I currently work here
          </label>
          <Field label="What you did and achieved" className="sm:col-span-2" hint="One bullet per line works best.">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={"Cut reporting prep from 9 hours to 90 minutes\nBuilt a stock-cover model…"} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Delete this role?"
        message="This permanently removes the entry from your profile and résumé. It cannot be undone."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && remove(confirmId)}
      />
    </div>
  );
}

/* -------------------------------- education ------------------------------- */

function EducationEditor({
  items,
  loading,
  reload,
}: {
  items: Education[];
  loading: boolean;
  reload: () => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Education | null>(null);
  const [form, setForm] = useState(EMPTY_EDUCATION);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function start(item?: Education) {
    setEditing(item ?? null);
    setForm(
      item
        ? {
            degree: item.degree,
            institution: item.institution,
            field: item.field ?? "",
            startDate: item.startDate ?? "",
            endDate: item.endDate ?? "",
            grade: item.grade ?? "",
            description: item.description ?? "",
          }
        : EMPTY_EDUCATION,
    );
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    try {
      if (editing) {
        await api(`/api/profile/education/${editing.id}`, { method: "PATCH", json: form });
        toast.success("Education updated");
      } else {
        await api("/api/profile/education", { method: "POST", json: form });
        toast.success("Education added");
      }
      setOpen(false);
      reload();
    } catch (e) {
      toast.error("Could not save", errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/profile/education/${id}`, { method: "DELETE" });
      toast.success("Entry removed");
      reload();
    } catch (e) {
      toast.error("Could not delete", errorMessage(e));
    } finally {
      setConfirmId(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] text-ink-500">Include school, college, university, bootcamps and vocational training.</p>
        <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => start()}>
          Add education
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-20" />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={<GraduationCap className="size-5" />}
          title="No education recorded"
          message="Any level counts — secondary school, trade certificates, diplomas, degrees or self-directed programmes."
          action={<Button size="sm" onClick={() => start()}>Add education</Button>}
        />
      ) : (
        <ul className="space-y-2.5">
          {items.map((e) => (
            <li key={e.id} className="rounded-xl border border-ink-200 p-4 transition-colors hover:border-ink-300">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink-900">{e.degree}</p>
                  <p className="text-[13px] text-ink-600">{e.institution}{e.field ? ` · ${e.field}` : ""}</p>
                  <p className="mt-0.5 text-[12px] text-ink-400">
                    {[e.startDate, e.endDate].filter(Boolean).join(" – ") || "Dates not set"}
                    {e.grade ? ` · ${e.grade}` : ""}
                  </p>
                  {e.description ? <p className="mt-2 text-[12.5px] leading-relaxed text-ink-600">{e.description}</p> : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <IconButton label="Edit" onClick={() => start(e)}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton label="Delete" onClick={() => setConfirmId(e.id)} className="hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit education" : "Add education"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={submit} loading={busy} disabled={!form.degree.trim() || !form.institution.trim()}>
              {editing ? "Save changes" : "Add education"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Qualification" required>
            <Input value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} placeholder="BSc Statistics" />
          </Field>
          <Field label="Institution" required>
            <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="University of Lagos" />
          </Field>
          <Field label="Field of study">
            <Input value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} />
          </Field>
          <Field label="Grade / result">
            <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="Second Class Upper" />
          </Field>
          <Field label="Start year">
            <Input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} placeholder="2017" />
          </Field>
          <Field label="End year">
            <Input value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} placeholder="2021" />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Delete this entry?"
        message="This permanently removes the education entry from your profile and résumé."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && remove(confirmId)}
      />
    </div>
  );
}
