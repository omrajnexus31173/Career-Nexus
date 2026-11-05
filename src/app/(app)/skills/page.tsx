"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Languages, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
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
  Select,
  Skeleton,
  Tabs,
  useToast,
  cn,
} from "@/components/ui";
import { useFetch } from "@/lib/use-api";
import { api, errorMessage, label } from "@/lib/client";
import { LANGUAGES, SKILL_CATEGORIES } from "@/lib/catalog-shared";

type Skill = {
  id: string;
  name: string;
  category: string;
  proficiency: string;
  yearsExperience: number;
  certification: string | null;
  isCustom: boolean;
};
type Language = {
  id: string;
  name: string;
  reading: string;
  writing: string;
  speaking: string;
  overall: string;
};
type CatalogItem = { name: string; category: string; custom?: boolean; added: boolean };

const PROFICIENCIES = ["beginner", "intermediate", "advanced", "expert"];
const LEVELS = ["basic", "conversational", "intermediate", "advanced", "native"];

const EMPTY_SKILL = { name: "", category: "", proficiency: "beginner", yearsExperience: 0, certification: "" };

export default function SkillsPage() {
  const toast = useToast();
  const [tab, setTab] = useState<"skills" | "languages">("skills");
  const skillsRes = useFetch<{ items: Skill[] }>("/api/skills");
  const languagesRes = useFetch<{ items: Language[]; suggestions: string[] }>("/api/languages");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [draft, setDraft] = useState(EMPTY_SKILL);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmSkill, setConfirmSkill] = useState<Skill | null>(null);

  const [langDraft, setLangDraft] = useState({ name: "", reading: "intermediate", writing: "intermediate", speaking: "intermediate", overall: "intermediate" });
  const [langEditing, setLangEditing] = useState<Language | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [langBusy, setLangBusy] = useState(false);
  const [confirmLang, setConfirmLang] = useState<Language | null>(null);

  // Debounce catalogue search so typing does not hammer the API.
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 220);
    return () => clearTimeout(t);
  }, [query]);

  const catalogUrl = `/api/skills/catalog?q=${encodeURIComponent(debounced)}&category=${encodeURIComponent(category)}`;
  const catalog = useFetch<{ items: CatalogItem[]; categories: string[]; total: number }>(catalogUrl, [debounced, category]);
  const grouped = useMemo(() => {
    const map = new Map<string, Skill[]>();
    for (const s of skillsRes.data?.items ?? []) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [skillsRes.data]);

  const exactMatch = catalog.data?.items.some(
    (i) => i.name.toLowerCase() === debounced.trim().toLowerCase(),
  );

  function openAdd(name?: string, cat?: string) {
    setEditing(null);
    setDraft({ ...EMPTY_SKILL, name: name ?? debounced.trim(), category: cat ?? (category || Object.keys(SKILL_CATEGORIES)[0]) });
    setOpen(true);
  }

  function openEdit(skill: Skill) {
    setEditing(skill);
    setDraft({
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
      yearsExperience: skill.yearsExperience,
      certification: skill.certification ?? "",
    });
    setOpen(true);
  }

  async function saveSkill() {
    setBusy(true);
    try {
      const known = Object.keys(SKILL_CATEGORIES).some(
        (c) => SKILL_CATEGORIES[c].some((n) => n.toLowerCase() === draft.name.trim().toLowerCase()),
      );
      const payload = { ...draft, name: draft.name.trim(), isCustom: !known };
      if (editing) {
        await api(`/api/skills/${editing.id}`, { method: "PATCH", json: payload });
        toast.success("Skill updated");
      } else {
        await api("/api/skills", { method: "POST", json: payload });
        toast.success(`${payload.name} added`, payload.isCustom ? "Saved as a custom skill." : undefined);
      }
      setOpen(false);
      skillsRes.reload();
      catalog.reload();
    } catch (e) {
      toast.error("Could not save skill", errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function removeSkill(skill: Skill) {
    try {
      await api(`/api/skills/${skill.id}`, { method: "DELETE" });
      toast.success(`${skill.name} removed`);
      skillsRes.reload();
      catalog.reload();
    } catch (e) {
      toast.error("Could not remove skill", errorMessage(e));
    } finally {
      setConfirmSkill(null);
    }
  }

  async function quickAdd(item: CatalogItem) {
    const known = Object.keys(SKILL_CATEGORIES).some((c) =>
      SKILL_CATEGORIES[c].some((n) => n.toLowerCase() === item.name.toLowerCase()),
    );
    try {
      await api("/api/skills", {
        method: "POST",
        json: { name: item.name, category: item.category, proficiency: "beginner", yearsExperience: 0, isCustom: !known && !item.custom },
      });
      toast.success(`${item.name} added`, "Set your proficiency to make your analysis accurate.");
      skillsRes.reload();
      catalog.reload();
    } catch (e) {
      toast.error("Could not add skill", errorMessage(e));
    }
  }

  function openLang(item?: Language) {
    setLangEditing(item ?? null);
    setLangDraft(
      item
        ? { name: item.name, reading: item.reading, writing: item.writing, speaking: item.speaking, overall: item.overall }
        : { name: "", reading: "intermediate", writing: "intermediate", speaking: "intermediate", overall: "intermediate" },
    );
    setLangOpen(true);
  }

  async function saveLang() {
    setLangBusy(true);
    try {
      const payload = {
        ...langDraft,
        name: langDraft.name.trim(),
        isCustom: !LANGUAGES.some((l) => l.toLowerCase() === langDraft.name.trim().toLowerCase()),
      };
      if (langEditing) {
        await api(`/api/languages/${langEditing.id}`, { method: "PATCH", json: payload });
        toast.success("Language updated");
      } else {
        await api("/api/languages", { method: "POST", json: payload });
        toast.success(`${payload.name} added`);
      }
      setLangOpen(false);
      languagesRes.reload();
    } catch (e) {
      toast.error("Could not save language", errorMessage(e));
    } finally {
      setLangBusy(false);
    }
  }

  async function removeLang(item: Language) {
    try {
      await api(`/api/languages/${item.id}`, { method: "DELETE" });
      toast.success(`${item.name} removed`);
      languagesRes.reload();
    } catch (e) {
      toast.error("Could not remove language", errorMessage(e));
    } finally {
      setConfirmLang(null);
    }
  }

  const categories = Object.keys(SKILL_CATEGORIES);

  return (
    <>
      <PageHeader
        eyebrow="Your record"
        title="Skills & languages"
        description={`Search ${catalog.data?.total ?? "700"}+ skills across ${categories.length} categories, or create your own. Proficiency and years of experience directly affect your career analysis.`}
      />

      <Tabs
        tabs={[
          { id: "skills", label: "Skills", count: skillsRes.data?.items.length },
          { id: "languages", label: "Languages", count: languagesRes.data?.items.length },
        ]}
        value={tab}
        onChange={(v) => setTab(v as "skills" | "languages")}
      />

      {tab === "skills" ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader
              icon={<Sparkles className="size-[18px]" />}
              title="Skill catalogue"
              subtitle="Search any profession — nothing is limited to a preset list."
            />
            <div className="p-5">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search skills — Python, patient care, welding, SEO, leadership…"
                  className="pl-9"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCategory("")}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                    !category ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white text-ink-600 hover:border-ink-300",
                  )}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(category === c ? "" : c)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                      category === c
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-ink-200 bg-white text-ink-600 hover:border-ink-300",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                {catalog.loading ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-11" />
                    ))}
                  </div>
                ) : catalog.error ? (
                  <Alert tone="error">{catalog.error}</Alert>
                ) : (catalog.data?.items.length ?? 0) === 0 ? (
                  <EmptyState
                    compact
                    icon={<Search className="size-5" />}
                    title={`No catalogue skill matches "${debounced}"`}
                    message="You can still create it as a custom skill — it will be saved to your personal catalogue."
                    action={
                      <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => openAdd()}>
                        Create &quot;{debounced.trim()}&quot;
                      </Button>
                    }
                  />
                ) : (
                  <>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {catalog.data!.items.slice(0, 48).map((item) => (
                        <div
                          key={`${item.category}-${item.name}`}
                          className="flex items-center justify-between gap-2 rounded-xl border border-ink-200 px-3 py-2 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-ink-800">
                              {item.name}
                              {item.custom ? <Badge tone="violet" className="ml-1.5">custom</Badge> : null}
                            </p>
                            <p className="truncate text-[11.5px] text-ink-400">{item.category}</p>
                          </div>
                          {item.added ? (
                            <Badge tone="green">
                              <Check className="size-3" /> Added
                            </Badge>
                          ) : (
                            <Button size="sm" variant="secondary" onClick={() => quickAdd(item)}>
                              Add
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {debounced.trim() && !exactMatch ? (
                      <button
                        onClick={() => openAdd()}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 px-4 py-2.5 text-[13px] font-medium text-brand-800 transition-colors hover:bg-brand-50"
                      >
                        <Plus className="size-4" /> Create custom skill “{debounced.trim()}”
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </Card>

          <Card className="h-fit lg:sticky lg:top-20">
            <CardHeader
              icon={<Check className="size-[18px]" />}
              title="Your skills"
              subtitle={`${skillsRes.data?.items.length ?? 0} recorded`}
            />
            <div className="max-h-[70vh] overflow-y-auto p-5">
              {skillsRes.loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                </div>
              ) : (skillsRes.data?.items.length ?? 0) === 0 ? (
                <EmptyState
                  compact
                  icon={<Sparkles className="size-5" />}
                  title="No skills yet"
                  message="Add at least five skills so your career analysis has something real to work with."
                  action={<Button size="sm" onClick={() => openAdd()}>Add a skill</Button>}
                />
              ) : (
                <div className="space-y-4">
                  {grouped.map(([cat, list]) => (
                    <div key={cat}>
                      <p className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] text-ink-400 uppercase">{cat}</p>
                      <ul className="space-y-1.5">
                        {list.map((s) => (
                          <li key={s.id} className="group flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-ink-900">{s.name}</p>
                              <p className="truncate text-[11.5px] text-ink-500">
                                {label(s.proficiency)}
                                {s.yearsExperience ? ` · ${s.yearsExperience} yr` : ""}
                                {s.certification ? ` · ${s.certification}` : ""}
                              </p>
                            </div>
                            {s.isCustom ? <Badge tone="violet">custom</Badge> : null}
                            <IconButton label="Edit skill" onClick={() => openEdit(s)} className="size-8">
                              <Pencil className="size-3.5" />
                            </IconButton>
                            <IconButton
                              label="Remove skill"
                              onClick={() => setConfirmSkill(s)}
                              className="size-8 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="size-3.5" />
                            </IconButton>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader
              icon={<Languages className="size-[18px]" />}
              title="Your languages"
              subtitle="Reading, writing and speaking are scored separately."
              action={<Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => openLang()}>Add language</Button>}
            />
            <div className="p-5">
              {languagesRes.loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : (languagesRes.data?.items.length ?? 0) === 0 ? (
                <EmptyState
                  compact
                  icon={<Languages className="size-5" />}
                  title="No languages recorded"
                  message="Multilingual ability matters for international, client-facing and healthcare roles."
                  action={<Button size="sm" onClick={() => openLang()}>Add your first language</Button>}
                />
              ) : (
                <ul className="space-y-2.5">
                  {languagesRes.data!.items.map((l) => (
                    <li key={l.id} className="rounded-xl border border-ink-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-semibold text-ink-900">{l.name}</p>
                          <p className="mt-0.5 text-[12px] text-ink-500">Overall: {label(l.overall)}</p>
                        </div>
                        <div className="flex gap-1">
                          <IconButton label="Edit language" onClick={() => openLang(l)}>
                            <Pencil className="size-4" />
                          </IconButton>
                          <IconButton label="Remove language" onClick={() => setConfirmLang(l)} className="hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="size-4" />
                          </IconButton>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {(["reading", "writing", "speaking"] as const).map((k) => (
                          <div key={k} className="rounded-lg bg-ink-50 px-2.5 py-1.5">
                            <p className="text-[10.5px] tracking-wide text-ink-400 uppercase">{k}</p>
                            <p className="text-[12.5px] font-medium text-ink-800">{label(l[k])}</p>
                          </div>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card className="h-fit">
            <CardHeader title="Suggestions" subtitle="Tap to add instantly" />
            <div className="flex flex-wrap gap-1.5 p-5">
              {LANGUAGES.slice(0, 40)
                .filter((l) => !(languagesRes.data?.items ?? []).some((x) => x.name === l))
                .map((l) => (
                  <button
                    key={l}
                    onClick={() => openLangWithName(l)}
                    className="rounded-full border border-ink-200 bg-white px-3 py-1 text-[12.5px] text-ink-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
                  >
                    + {l}
                  </button>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* Skill dialog */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Add skill"}
        description="Proficiency and years of experience feed your readiness score."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={saveSkill} loading={busy} disabled={!draft.name.trim() || !draft.category}>
              {editing ? "Save changes" : "Add to profile"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Skill name" className="sm:col-span-2" required>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Power BI" />
          </Field>
          <Field label="Category" className="sm:col-span-2" required>
            <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              {draft.category && !categories.includes(draft.category) ? (
                <option value={draft.category}>{draft.category}</option>
              ) : null}
            </Select>
          </Field>
          <Field label="Proficiency">
            <Select value={draft.proficiency} onChange={(e) => setDraft({ ...draft, proficiency: e.target.value })}>
              {PROFICIENCIES.map((p) => (
                <option key={p} value={p}>{label(p)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Years of experience">
            <Input
              type="number"
              min={0}
              max={60}
              value={draft.yearsExperience}
              onChange={(e) => setDraft({ ...draft, yearsExperience: Number(e.target.value) })}
            />
          </Field>
          <Field label="Certification or evidence" className="sm:col-span-2" hint="Optional — e.g. AWS Solutions Architect, PL-300, portfolio link.">
            <Input value={draft.certification} onChange={(e) => setDraft({ ...draft, certification: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmSkill)}
        title={`Remove ${confirmSkill?.name ?? "skill"}?`}
        message="This deletes the skill from your profile and will change your next career analysis."
        confirmLabel="Remove"
        onCancel={() => setConfirmSkill(null)}
        onConfirm={() => confirmSkill && removeSkill(confirmSkill)}
      />

      {/* Language dialog */}
      <Modal
        open={langOpen}
        onClose={() => setLangOpen(false)}
        title={langEditing ? `Edit ${langEditing.name}` : "Add language"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setLangOpen(false)} disabled={langBusy}>Cancel</Button>
            <Button onClick={saveLang} loading={langBusy} disabled={!langDraft.name.trim()}>
              {langEditing ? "Save changes" : "Add language"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Language" className="sm:col-span-2" required>
            <Input
              value={langDraft.name}
              onChange={(e) => setLangDraft({ ...langDraft, name: e.target.value })}
              placeholder="e.g. Portuguese"
              list="language-suggestions"
            />
            <datalist id="language-suggestions">
              {LANGUAGES.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </Field>
          {(["reading", "writing", "speaking", "overall"] as const).map((k) => (
            <Field key={k} label={label(k)}>
              <Select value={langDraft[k]} onChange={(e) => setLangDraft({ ...langDraft, [k]: e.target.value })}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{label(l)}</option>
                ))}
              </Select>
            </Field>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmLang)}
        title={`Remove ${confirmLang?.name ?? "language"}?`}
        message="This deletes the language from your profile."
        confirmLabel="Remove"
        onCancel={() => setConfirmLang(null)}
        onConfirm={() => confirmLang && removeLang(confirmLang)}
      />
    </>
  );

  function openLangWithName(name: string) {
    setLangEditing(null);
    setLangDraft({ name, reading: "intermediate", writing: "intermediate", speaking: "intermediate", overall: "intermediate" });
    setLangOpen(true);
  }
}
