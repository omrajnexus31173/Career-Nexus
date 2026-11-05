"use client";

import { useMemo, useState } from "react";
import { Code2, ExternalLink, FolderKanban, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  Alert, Badge, Button, Card, ConfirmDialog, EmptyState, Field, IconButton, Input, Modal,
  PageHeader, Select, Skeleton, TagInput, Textarea, useToast,
} from "@/components/ui";
import { useFetch } from "@/lib/use-api";
import { api, errorMessage, formatDate, label } from "@/lib/client";
import { ALL_SKILLS } from "@/lib/catalog-shared";

type Project = {
  id: string;
  name: string;
  description: string | null;
  technologies: string[] | null;
  skillsDemonstrated: string[] | null;
  projectUrl: string | null;
  githubUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdAt: string;
};

const EMPTY = {
  name: "", description: "", technologies: [] as string[], skillsDemonstrated: [] as string[],
  projectUrl: "", githubUrl: "", startDate: "", endDate: "", status: "in_progress",
};
const FILTERS = ["all", "planned", "in_progress", "completed", "archived"];
const TONE: Record<string, string> = { completed: "green", in_progress: "blue", planned: "amber", archived: "neutral" };

export default function ProjectsPage() {
  const toast = useToast();
  const res = useFetch<{ items: Project[] }>("/api/projects");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Project | null>(null);

  const suggestions = useMemo(() => ALL_SKILLS.map((s) => s.name), []);

  const items = (res.data?.items ?? []).filter((p) => (filter === "all" ? true : p.status === filter)).filter((p) =>
    query.trim() ? `${p.name} ${p.description ?? ""} ${(p.technologies ?? []).join(" ")}`.toLowerCase().includes(query.toLowerCase()) : true,
  );

  function start(p?: Project) {
    setEditing(p ?? null);
    setForm(
      p
        ? {
            name: p.name, description: p.description ?? "", technologies: p.technologies ?? [],
            skillsDemonstrated: p.skillsDemonstrated ?? [], projectUrl: p.projectUrl ?? "", githubUrl: p.githubUrl ?? "",
            startDate: p.startDate ?? "", endDate: p.endDate ?? "", status: p.status,
          }
        : EMPTY,
    );
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    try {
      if (editing) {
        await api(`/api/projects/${editing.id}`, { method: "PATCH", json: form });
        toast.success("Project updated");
      } else {
        await api("/api/projects", { method: "POST", json: form });
        toast.success("Project added", "It now counts toward your portfolio evidence.");
      }
      setOpen(false);
      res.reload();
    } catch (e) {
      toast.error("Could not save project", errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Project) {
    try {
      await api(`/api/projects/${p.id}`, { method: "DELETE" });
      toast.success("Project deleted");
      res.reload();
    } catch (e) {
      toast.error("Could not delete project", errorMessage(e));
    } finally {
      setConfirm(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Your record"
        title="Project portfolio"
        description="Evidence beats claims. Every project here is used by the career analyzer to detect skills you have actually demonstrated."
        actions={<Button icon={<Plus className="size-4" />} onClick={() => start()}>Add project</Button>}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  filter === f ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                }`}
              >
                {label(f)}
                <span className="ml-1.5 opacity-60">
                  {f === "all" ? res.data?.items.length ?? 0 : (res.data?.items ?? []).filter((p) => p.status === f).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {res.error ? <Alert tone="error">{res.error}</Alert> : null}
          {res.loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-44" />
              <Skeleton className="h-44" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="size-5" />}
              title={res.data?.items.length ? "No projects match this filter" : "No projects yet"}
              message={
                res.data?.items.length
                  ? "Try a different status or clear the search."
                  : "Add coursework, personal builds, volunteering or client work. Three documented projects is the usual screening threshold."
              }
              action={res.data?.items.length ? <Button size="sm" variant="secondary" onClick={() => { setFilter("all"); setQuery(""); }}>Clear filters</Button> : <Button size="sm" onClick={() => start()}>Add your first project</Button>}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((p) => (
                <article key={p.id} className="flex flex-col rounded-xl border border-ink-200 p-4 transition-all hover:border-brand-300 hover:shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold text-ink-900">{p.name}</h3>
                      <p className="mt-0.5 text-[12px] text-ink-400">
                        {[p.startDate, p.endDate].filter(Boolean).join(" – ") || `Added ${formatDate(p.createdAt)}`}
                      </p>
                    </div>
                    <Badge tone={TONE[p.status] ?? "neutral"}>{label(p.status)}</Badge>
                  </div>

                  {p.description ? (
                    <p className="mt-2.5 line-clamp-4 flex-1 text-[13px] leading-relaxed text-ink-600">{p.description}</p>
                  ) : null}

                  {(p.technologies?.length || p.skillsDemonstrated?.length) ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {[...(p.technologies ?? []), ...(p.skillsDemonstrated ?? [])].slice(0, 8).map((t, i) => (
                        <Badge key={`${t}-${i}`} tone="neutral">{t}</Badge>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3.5 flex items-center gap-1 border-t border-ink-100 pt-3">
                    {p.projectUrl ? (
                      <a href={p.projectUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-medium text-ink-600 hover:bg-ink-100">
                        <ExternalLink className="size-3.5" /> Live
                      </a>
                    ) : null}
                    {p.githubUrl ? (
                      <a href={p.githubUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-medium text-ink-600 hover:bg-ink-100">
                        <Code2 className="size-3.5" /> Code
                      </a>
                    ) : null}
                    <span className="ml-auto flex gap-1">
                      <IconButton label="Edit project" onClick={() => start(p)} className="size-8"><Pencil className="size-3.5" /></IconButton>
                      <IconButton label="Delete project" onClick={() => setConfirm(p)} className="size-8 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-3.5" /></IconButton>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit project" : "Add project"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={submit} loading={busy} disabled={!form.name.trim()}>{editing ? "Save changes" : "Add project"}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project name" className="sm:col-span-2" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer churn early-warning dashboard" />
          </Field>
          <Field label="Description" className="sm:col-span-2" hint="Lead with the outcome and include numbers where you can.">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Technologies used" className="sm:col-span-2">
            <TagInput value={form.technologies} onChange={(v) => setForm({ ...form, technologies: v })} suggestions={suggestions} placeholder="Power BI, SQL, DAX…" />
          </Field>
          <Field label="Skills demonstrated" className="sm:col-span-2">
            <TagInput value={form.skillsDemonstrated} onChange={(v) => setForm({ ...form, skillsDemonstrated: v })} suggestions={suggestions} placeholder="Data Visualization, Statistics…" />
          </Field>
          <Field label="Project URL"><Input value={form.projectUrl} onChange={(e) => setForm({ ...form, projectUrl: e.target.value })} placeholder="https://…" /></Field>
          <Field label="GitHub URL"><Input value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/…" /></Field>
          <Field label="Start date"><Input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} placeholder="Jan 2024" /></Field>
          <Field label="Completion date"><Input value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} placeholder="Apr 2024" /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {["planned", "in_progress", "completed", "archived"].map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </Select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={`Delete "${confirm?.name ?? ""}"?`}
        message="This permanently removes the project and its evidence from your profile and résumé."
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm)}
      />
    </>
  );
}
