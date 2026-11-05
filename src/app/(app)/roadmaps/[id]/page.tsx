"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleDot,
  Clock,
  ExternalLink,
  Flag,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
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
  Textarea,
  useToast,
  cn,
} from "@/components/ui";
import { useFetch } from "@/lib/use-api";
import { api, errorMessage, formatDate, label } from "@/lib/client";

type Task = {
  id: string;
  roadmapId: string;
  phaseId: string | null;
  title: string;
  description: string | null;
  kind: string;
  resourceName: string | null;
  resourceUrl: string | null;
  priority: string;
  dueDay: number;
  estimatedMinutes: number;
  orderIndex: number;
  status: string;
  isCustom: boolean;
  isMilestone: boolean;
  completedAt: string | null;
};
type Phase = { id: string; title: string; objective: string | null; orderIndex: number; startDay: number; endDay: number };
type Progress = {
  total: number; done: number; pending: number; inProgress: number; percent: number;
  milestonesDone: number; milestonesTotal: number; remainingHours: number; nextAction: string;
};
type Roadmap = {
  id: string; title: string; careerTitle: string; durationDays: number; weeklyHours: number;
  status: string; startDate: string; nextAction: string | null;
};

const EMPTY_TASK = {
  title: "", description: "", kind: "learn", priority: "medium", dueDay: 1,
  estimatedMinutes: 60, resourceName: "", resourceUrl: "", status: "todo", phaseId: "",
};
const KIND_TONE: Record<string, string> = {
  learn: "blue", practice: "brand", project: "violet", assessment: "amber", milestone: "green",
};

export default function RoadmapDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const toast = useToast();
  const res = useFetch<{ roadmap: Roadmap; phases: Phase[]; tasks: Task[]; progress: Progress }>(
    id ? `/api/roadmaps/${id}` : null,
    [id],
  );

  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState(EMPTY_TASK);
  const [busy, setBusy] = useState(false);
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tasks = useMemo(() => res.data?.tasks ?? [], [res.data?.tasks]);
  const phases = useMemo(() => res.data?.phases ?? [], [res.data?.phases]);

  // Local mirror of the server progress so task toggles feel instant (optimistic updates).
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null);
  useEffect(() => {
    setLocalTasks(null);
  }, [res.data]);
  const viewTasks = localTasks ?? tasks;

  const progress = useMemo(() => {
    const source = viewTasks.length ? viewTasks : tasks;
    const total = source.length;
    const done = source.filter((t) => t.status === "done").length;
    const inProgress = source.filter((t) => t.status === "in_progress").length;
    const milestones = source.filter((t) => t.isMilestone);
    const remaining = source.filter((t) => t.status !== "done").reduce((s, t) => s + t.estimatedMinutes, 0);
    const next = source
      .filter((t) => t.status !== "done" && !t.isMilestone)
      .sort((a, b) => a.dueDay - b.dueDay || a.orderIndex - b.orderIndex)[0];
    return {
      total,
      done,
      inProgress,
      pending: total - done - inProgress,
      percent: total ? Math.round((done / total) * 100) : 0,
      milestonesDone: milestones.filter((m) => m.status === "done").length,
      milestonesTotal: milestones.length,
      remainingHours: Math.round(remaining / 6) / 10,
      nextAction: next?.title ?? "All tasks complete",
    };
  }, [viewTasks, tasks]);

  const filtered = viewTasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "milestones") return t.isMilestone;
    return t.status === filter;
  });

  function startAdd(phase?: Phase) {
    setEditing(null);
    setForm({
      ...EMPTY_TASK,
      dueDay: phase ? phase.startDay : (res.data?.roadmap.durationDays ?? 30) > 7 ? 7 : 1,
      phaseId: phase?.id ?? "",
    });
    setOpen(true);
  }

  function startEdit(t: Task) {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description ?? "",
      kind: t.kind,
      priority: t.priority,
      dueDay: t.dueDay,
      estimatedMinutes: t.estimatedMinutes,
      resourceName: t.resourceName ?? "",
      resourceUrl: t.resourceUrl ?? "",
      status: t.status,
      phaseId: t.phaseId ?? "",
    });
    setOpen(true);
  }

  async function saveTask() {
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        kind: form.kind,
        priority: form.priority,
        dueDay: Number(form.dueDay),
        estimatedMinutes: Number(form.estimatedMinutes),
        resourceName: form.resourceName.trim(),
        resourceUrl: form.resourceUrl.trim(),
        phaseId: form.phaseId || null,
        ...(editing ? { status: form.status } : {}),
      };
      if (editing) {
        await api(`/api/roadmaps/${id}/tasks/${editing.id}`, { method: "PATCH", json: payload });
        toast.success("Task updated");
      } else {
        await api(`/api/roadmaps/${id}/tasks`, { method: "POST", json: payload });
        toast.success("Task added");
      }
      setOpen(false);
      res.reload();
    } catch (e) {
      toast.error("Could not save task", errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(t: Task) {
    const nextStatus = t.status === "done" ? "todo" : "done";
    const optimistic = viewTasks.map((x) =>
      x.id === t.id
        ? { ...x, status: nextStatus, completedAt: nextStatus === "done" ? new Date().toISOString() : null }
        : x,
    );
    setLocalTasks(optimistic);
    try {
      const out = await api<{ progress: Progress }>(`/api/roadmaps/${id}/tasks/${t.id}`, {
        method: "PATCH",
        json: { status: nextStatus },
      });
      setLocalTasks(null);
      res.setData((prev) => (prev ? { ...prev, tasks: prev.tasks.map((x) => (x.id === t.id ? { ...x, status: nextStatus, completedAt: nextStatus === "done" ? new Date().toISOString() : null } : x)), progress: out.progress } : prev));
      if (nextStatus === "done") {
        toast.success(t.isMilestone ? "Milestone completed" : "Task completed", `${out.progress.percent}% of the roadmap is done.`);
      }
      res.reload();
    } catch (e) {
      setLocalTasks(null);
      toast.error("Could not update the task", errorMessage(e));
    }
  }

  async function setInProgress(t: Task) {
    setLocalTasks(viewTasks.map((x) => (x.id === t.id ? { ...x, status: "in_progress" } : x)));
    try {
      await api(`/api/roadmaps/${id}/tasks/${t.id}`, { method: "PATCH", json: { status: "in_progress" } });
      setLocalTasks(null);
      res.reload();
    } catch (e) {
      setLocalTasks(null);
      toast.error("Could not update the task", errorMessage(e));
    }
  }

  async function removeTask(t: Task) {
    try {
      await api(`/api/roadmaps/${id}/tasks/${t.id}`, { method: "DELETE" });
      toast.success("Task removed");
      res.reload();
    } catch (e) {
      toast.error("Could not delete the task", errorMessage(e));
    } finally {
      setConfirmTask(null);
    }
  }

  async function toggleStatus() {
    const r = res.data?.roadmap;
    if (!r) return;
    const status = r.status === "paused" ? "active" : "paused";
    try {
      await api(`/api/roadmaps/${r.id}`, { method: "PATCH", json: { status } });
      toast.success(status === "paused" ? "Roadmap paused" : "Roadmap resumed");
      res.reload();
    } catch (e) {
      toast.error("Could not update the roadmap", errorMessage(e));
    }
  }

  async function removeRoadmap() {
    try {
      await api(`/api/roadmaps/${id}`, { method: "DELETE" });
      toast.success("Roadmap deleted");
      router.push("/roadmaps");
      router.refresh();
    } catch (e) {
      toast.error("Could not delete the roadmap", errorMessage(e));
      setConfirmDelete(false);
    }
  }

  if (res.loading && !res.data) {
    return (
      <>
        <Skeleton className="mb-4 h-9 w-64" />
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-52" />
        </div>
      </>
    );
  }

  if (res.error || !res.data) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={<CircleDot className="size-5" />}
          title="Roadmap not found"
          message={res.error ?? "This roadmap may have been deleted."}
          action={<Link href="/roadmaps"><Button size="sm">Back to roadmaps</Button></Link>}
        />
      </Card>
    );
  }

  const r = res.data.roadmap;
  const paused = r.status === "paused";

  return (
    <>
      <Link href="/roadmaps" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-3.5" /> All roadmaps
      </Link>

      <PageHeader
        eyebrow={r.careerTitle}
        title={r.title}
        description={`${r.durationDays} days · ${r.weeklyHours} hours per week · started ${formatDate(r.startDate)}`}
        actions={
          <>
            <Badge tone={r.status === "active" ? "green" : r.status === "completed" ? "brand" : paused ? "amber" : "neutral"}>
              {label(r.status)}
            </Badge>
            {r.status !== "completed" ? (
              <Button
                variant="secondary"
                onClick={toggleStatus}
                icon={paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              >
                {paused ? "Resume" : "Pause"}
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => router.push("/roadmaps")} icon={<RotateCcw className="size-4" />}>
              New roadmap
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)} icon={<Trash2 className="size-4" />}>
              Delete
            </Button>
          </>
        }
      />

      {paused ? (
        <div className="mb-5">
          <Alert tone="warning" title="This roadmap is paused">
            Tasks stay where they are. Resume whenever you are ready — nothing is lost.
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <Card>
            <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-4">
              <Tabs
                tabs={[
                  { id: "all", label: "All", count: progress.total },
                  { id: "todo", label: "To do", count: viewTasks.filter((t) => t.status === "todo").length },
                  { id: "in_progress", label: "In progress", count: progress.inProgress },
                  { id: "done", label: "Done", count: progress.done },
                  { id: "milestones", label: "Milestones", count: progress.milestonesTotal },
                ]}
                value={filter}
                onChange={setFilter}
              />
              <Button className="ml-auto" size="sm" icon={<Plus className="size-3.5" />} onClick={() => startAdd()}>
                Add task
              </Button>
            </div>

            <div className="p-5">
              {filtered.length === 0 ? (
                <EmptyState
                  compact
                  icon={<Check className="size-5" />}
                  title={filter === "all" ? "No tasks" : `No ${label(filter).toLowerCase()} tasks`}
                  message="Add a custom task or change the filter."
                  action={<Button size="sm" onClick={() => startAdd()}>Add a task</Button>}
                />
              ) : (
                <div className="space-y-5">
                  {phases.map((phase) => {
                    const phaseTasks = filtered.filter((t) => t.phaseId === phase.id);
                    if (phaseTasks.length === 0) return null;
                    const phaseDone = phaseTasks.filter((t) => t.status === "done").length;
                    return (
                      <section key={phase.id}>
                        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
                          <div>
                            <h3 className="font-display text-[16px] font-semibold text-ink-900">
                              Phase {phase.orderIndex + 1}: {phase.title}
                            </h3>
                            {phase.objective ? <p className="mt-0.5 text-[12.5px] text-ink-500">{phase.objective}</p> : null}
                          </div>
                          <span className="flex items-center gap-2 text-[12px] text-ink-500">
                            <CalendarDays className="size-3.5" /> Days {phase.startDay}–{phase.endDay}
                            <span className="rounded-full bg-ink-100 px-2 py-0.5 font-medium text-ink-700">
                              {phaseDone}/{phaseTasks.length}
                            </span>
                          </span>
                        </div>

                        <ul className="space-y-2">
                          {phaseTasks.map((t) => (
                            <TaskRow
                              key={t.id}
                              task={t}
                              disabled={paused}
                              onToggle={() => toggleTask(t)}
                              onStart={() => setInProgress(t)}
                              onEdit={() => startEdit(t)}
                              onDelete={() => setConfirmTask(t)}
                            />
                          ))}
                        </ul>

                        <button
                          onClick={() => startAdd(phase)}
                          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-200 py-2 text-[12.5px] font-medium text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-700"
                        >
                          <Plus className="size-3.5" /> Add task to this phase
                        </button>
                      </section>
                    );
                  })}

                  {filtered.some((t) => !t.phaseId) ? (
                    <section>
                      <h3 className="mb-2.5 font-display text-[16px] font-semibold text-ink-900">Unscheduled</h3>
                      <ul className="space-y-2">
                        {filtered.filter((t) => !t.phaseId).map((t) => (
                          <TaskRow
                            key={t.id}
                            task={t}
                            disabled={paused}
                            onToggle={() => toggleTask(t)}
                            onStart={() => setInProgress(t)}
                            onEdit={() => startEdit(t)}
                            onDelete={() => setConfirmTask(t)}
                          />
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <Ring value={progress.percent} size={88} label="done" />
              <div>
                <p className="text-[13px] font-semibold text-ink-900">Real progress</p>
                <p className="mt-0.5 text-[12.5px] text-ink-500">{progress.done} of {progress.total} tasks complete</p>
              </div>
            </div>
            <ProgressBar value={progress.percent} className="mt-4" />
            <dl className="mt-4 space-y-2 text-[12.5px]">
              {[
                ["Completed", progress.done],
                ["In progress", progress.inProgress],
                ["Remaining", progress.total - progress.done],
                ["Milestones", `${progress.milestonesDone}/${progress.milestonesTotal}`],
                ["Hours left", progress.remainingHours],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="font-semibold text-ink-800">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="border-brand-200 bg-brand-50/60 p-5">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-700 uppercase">Next recommended action</p>
            <p className="mt-1.5 text-[14px] leading-snug font-semibold text-ink-900">{progress.nextAction}</p>
            <p className="mt-2 text-[12px] text-ink-600">
              Estimated {progress.remainingHours} hours of work remain at {r.weeklyHours} h/week
              {r.weeklyHours > 0 ? ` (about ${Math.max(1, Math.ceil(progress.remainingHours / r.weeklyHours))} weeks).` : "."}
            </p>
          </Card>

          <Card className="grain bg-ink-900 p-5 text-white">
            <p className="text-[12px] leading-relaxed text-white/65">
              Stuck on a task? Ask Nexus AI to break it down using your profile and this roadmap.
            </p>
            <Link
              href="/assistant"
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-4 text-[13px] font-semibold text-ink-950 hover:bg-brand-400"
            >
              Ask Nexus AI <ExternalLink className="size-3.5" />
            </Link>
          </Card>
        </aside>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit task" : "Add custom task"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={saveTask} loading={busy} disabled={!form.title.trim()}>
              {editing ? "Save changes" : "Add task"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Task title" className="sm:col-span-2" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Complete the pandas data-cleaning module" />
          </Field>
          <Field label="Description / instructions" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Type">
            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {["learn", "practice", "project", "assessment", "milestone"].map((k) => (
                <option key={k} value={k}>{label(k)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {["low", "medium", "high"].map((p) => (
                <option key={p} value={p}>{label(p)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Phase">
            <Select value={form.phaseId} onChange={(e) => setForm({ ...form, phaseId: e.target.value })}>
              <option value="">Unscheduled</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>Phase {p.orderIndex + 1}: {p.title}</option>
              ))}
            </Select>
          </Field>
          <Field label={`Due day (max ${r.durationDays})`}>
            <Input type="number" min={1} max={r.durationDays} value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: Number(e.target.value) })} />
          </Field>
          <Field label="Estimated minutes">
            <Input type="number" min={5} max={1440} step={15} value={form.estimatedMinutes} onChange={(e) => setForm({ ...form, estimatedMinutes: Number(e.target.value) })} />
          </Field>
          {editing ? (
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {["todo", "in_progress", "done"].map((s) => (
                  <option key={s} value={s}>{label(s)}</option>
                ))}
              </Select>
            </Field>
          ) : null}
          <Field label="Resource name">
            <Input value={form.resourceName} onChange={(e) => setForm({ ...form, resourceName: e.target.value })} placeholder="freeCodeCamp pandas course" />
          </Field>
          <Field label="Resource URL">
            <Input value={form.resourceUrl} onChange={(e) => setForm({ ...form, resourceUrl: e.target.value })} placeholder="https://…" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmTask)}
        title={`Delete "${confirmTask?.title ?? ""}"?`}
        message="This permanently removes the task and recalculates your roadmap progress."
        onCancel={() => setConfirmTask(null)}
        onConfirm={() => confirmTask && removeTask(confirmTask)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this roadmap?"
        message="Every phase, task and completion record in this roadmap will be permanently deleted. Your profile and analysis are unaffected."
        onCancel={() => setConfirmDelete(false)}
        onConfirm={removeRoadmap}
      />
    </>
  );
}

function TaskRow({
  task,
  disabled,
  onToggle,
  onStart,
  onEdit,
  onDelete,
}: {
  task: Task;
  disabled: boolean;
  onToggle: () => void;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = task.status === "done";
  return (
    <li
      className={cn(
        "group flex items-start gap-3 rounded-xl border p-3.5 transition-all",
        done ? "border-emerald-200 bg-emerald-50/40" : task.isMilestone ? "border-brand-200 bg-brand-50/40" : "border-ink-200 bg-white hover:border-ink-300",
        disabled && !done && "opacity-70",
      )}
    >
      <button
        onClick={onToggle}
        disabled={disabled && !done}
        aria-label={done ? `Reopen ${task.title}` : `Mark ${task.title} complete`}
        aria-pressed={done}
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition-all",
          done ? "border-emerald-600 bg-emerald-600 text-white" : "border-ink-300 bg-white hover:border-brand-500",
          disabled && !done && "cursor-not-allowed",
        )}
      >
        {done ? <Check className="size-3.5" /> : null}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className={cn("text-[13.5px] font-medium", done ? "text-ink-500 line-through" : "text-ink-900")}>{task.title}</p>
          <Badge tone={KIND_TONE[task.kind] ?? "neutral"}>{label(task.kind)}</Badge>
          {task.isCustom ? <Badge tone="violet">custom</Badge> : null}
          {task.priority === "high" && !done ? <Badge tone="red">high priority</Badge> : null}
        </div>
        {task.description ? <p className="mt-1 text-[12.5px] leading-relaxed text-ink-600">{task.description}</p> : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-400">
          <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" /> Day {task.dueDay}</span>
          <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {task.estimatedMinutes} min</span>
          {task.completedAt ? <span className="inline-flex items-center gap-1 text-emerald-600"><Flag className="size-3" /> Done {formatDate(task.completedAt)}</span> : null}
          {task.resourceUrl ? (
            <a href={task.resourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
              <ExternalLink className="size-3" /> {task.resourceName || "Resource"}
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 gap-0.5">
        {!done && task.status !== "in_progress" ? (
          <IconButton label="Mark in progress" onClick={onStart} className="size-8" disabled={disabled}>
            <Play className="size-3.5" />
          </IconButton>
        ) : null}
        <IconButton label="Edit task" onClick={onEdit} className="size-8"><Pencil className="size-3.5" /></IconButton>
        <IconButton label="Delete task" onClick={onDelete} className="size-8 hover:bg-red-50 hover:text-red-600">
          <Trash2 className="size-3.5" />
        </IconButton>
      </div>
    </li>
  );
}
