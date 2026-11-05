"use client";

import { useRef, useState } from "react";
import {
  Award,
  Download,
  Eye,
  FileStack,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
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
  Select,
  Skeleton,
  Textarea,
  useToast,
  cn,
} from "@/components/ui";
import { useFetch } from "@/lib/use-api";
import { api, errorMessage, formatBytes, formatDate, label } from "@/lib/client";

type Doc = {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  note: string | null;
  createdAt: string;
};
type Cert = {
  id: string;
  name: string;
  issuer: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  credentialUrl: string | null;
};

const CATEGORIES = ["all", "certificate", "resume", "project", "portfolio", "academic", "other"];
const MAX_BYTES = 8 * 1024 * 1024;
const TONE: Record<string, string> = {
  certificate: "green",
  resume: "blue",
  project: "violet",
  portfolio: "amber",
  academic: "neutral",
  other: "neutral",
};

export default function DocumentsPage() {
  const toast = useToast();
  const docs = useFetch<{ items: Doc[] }>("/api/documents");
  const certs = useFetch<{ items: Cert[] }>("/api/profile/certification");
  const fileRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [meta, setMeta] = useState({ title: "", category: "certificate", note: "", issuer: "", issuedAt: "" });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [confirmDoc, setConfirmDoc] = useState<Doc | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [certOpen, setCertOpen] = useState(false);
  const [certEditing, setCertEditing] = useState<Cert | null>(null);
  const [certForm, setCertForm] = useState({ name: "", issuer: "", issuedAt: "", expiresAt: "", credentialUrl: "" });
  const [certBusy, setCertBusy] = useState(false);
  const [confirmCert, setConfirmCert] = useState<Cert | null>(null);

  const items = (docs.data?.items ?? [])
    .filter((d) => (category === "all" ? true : d.category === category))
    .filter((d) => (query.trim() ? `${d.title} ${d.originalName} ${d.note ?? ""}`.toLowerCase().includes(query.toLowerCase()) : true));

  function chooseFile(file: File | undefined | null) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("File too large", `Maximum size is ${MAX_BYTES / 1024 / 1024} MB.`);
      return;
    }
    const okTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!okTypes.includes(file.type)) {
      toast.error("Unsupported file type", "Allowed: PDF, PNG, JPG, WEBP or DOCX.");
      return;
    }
    setPendingFile(file);
    setMeta((m) => ({ ...m, title: m.title || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") }));
    setUploadOpen(true);
  }

  async function upload() {
    if (!pendingFile) return;
    setUploading(true);
    setProgress(8);
    try {
      const fd = new FormData();
      fd.append("file", pendingFile);
      fd.append("title", meta.title.trim());
      fd.append("category", meta.category);
      fd.append("note", meta.note.trim());
      if (meta.category === "certificate") {
        fd.append("issuer", meta.issuer.trim());
        fd.append("issuedAt", meta.issuedAt.trim());
      }
      setProgress(45);
      await api("/api/documents", { method: "POST", body: fd });
      setProgress(100);
      toast.success("Document uploaded", `${pendingFile.name} is stored securely and only accessible to you.`);
      setUploadOpen(false);
      setPendingFile(null);
      setMeta({ title: "", category: "certificate", note: "", issuer: "", issuedAt: "" });
      docs.reload();
      certs.reload();
    } catch (e) {
      toast.error("Upload failed", errorMessage(e));
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 900);
    }
  }

  async function saveMeta() {
    if (!editing) return;
    try {
      await api(`/api/documents/${editing.id}`, {
        method: "PATCH",
        json: { title: editing.title, category: editing.category, note: editing.note },
      });
      toast.success("Details updated");
      setEditing(null);
      docs.reload();
    } catch (e) {
      toast.error("Could not update", errorMessage(e));
    }
  }

  async function removeDoc(d: Doc) {
    setDeleteBusy(true);
    try {
      await api(`/api/documents/${d.id}`, { method: "DELETE" });
      toast.success("Document deleted", "The stored file was removed from the server.");
      docs.reload();
      certs.reload();
    } catch (e) {
      toast.error("Could not delete", errorMessage(e));
    } finally {
      setDeleteBusy(false);
      setConfirmDoc(null);
    }
  }

  function openCert(c?: Cert) {
    setCertEditing(c ?? null);
    setCertForm(
      c
        ? { name: c.name, issuer: c.issuer ?? "", issuedAt: c.issuedAt ?? "", expiresAt: c.expiresAt ?? "", credentialUrl: c.credentialUrl ?? "" }
        : { name: "", issuer: "", issuedAt: "", expiresAt: "", credentialUrl: "" },
    );
    setCertOpen(true);
  }

  async function saveCert() {
    setCertBusy(true);
    try {
      if (certEditing) {
        await api(`/api/profile/certification/${certEditing.id}`, { method: "PATCH", json: certForm });
        toast.success("Certification updated");
      } else {
        await api("/api/profile/certification", { method: "POST", json: certForm });
        toast.success("Certification added");
      }
      setCertOpen(false);
      certs.reload();
    } catch (e) {
      toast.error("Could not save certification", errorMessage(e));
    } finally {
      setCertBusy(false);
    }
  }

  async function removeCert(c: Cert) {
    try {
      await api(`/api/profile/certification/${c.id}`, { method: "DELETE" });
      toast.success("Certification removed");
      certs.reload();
    } catch (e) {
      toast.error("Could not remove", errorMessage(e));
    } finally {
      setConfirmCert(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Your record"
        title="Documents & certificates"
        description="Upload certificates, résumés, project files and academic records. Files are stored outside the public web root and streamed only after an ownership check."
        actions={
          <>
            <Button variant="secondary" icon={<Award className="size-4" />} onClick={() => openCert()}>
              Add certification
            </Button>
            <Button icon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()}>
              Upload document
            </Button>
          </>
        }
      />

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,application/pdf,image/png,image/jpeg,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => {
          chooseFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 p-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents…" className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    category === c ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200",
                  )}
                >
                  {label(c)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                chooseFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "mb-5 rounded-xl border-2 border-dashed px-5 py-7 text-center transition-colors",
                dragging ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-ink-50/40",
              )}
            >
              <Upload className="mx-auto size-5 text-brand-600" />
              <p className="mt-2 text-[13.5px] font-medium text-ink-800">Drop a file here, or browse</p>
              <p className="mt-1 text-[12px] text-ink-500">PDF, PNG, JPG, WEBP or DOCX · up to 8 MB</p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => fileRef.current?.click()}>
                Choose file
              </Button>
            </div>

            {docs.error ? <Alert tone="error">{docs.error}</Alert> : null}

            {docs.loading ? (
              <div className="space-y-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={<FileStack className="size-5" />}
                title={docs.data?.items.length ? "No documents match this filter" : "No documents uploaded yet"}
                message={
                  docs.data?.items.length
                    ? "Try another category or clear the search."
                    : "Certificates, transcripts and exported résumés give employers third-party proof of your claims."
                }
              />
            ) : (
              <ul className="space-y-2">
                {items.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3.5 transition-colors hover:border-ink-300">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-600">
                      <FileText className="size-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink-900">{d.title}</p>
                      <p className="truncate text-[12px] text-ink-500">
                        {d.originalName} · {formatBytes(d.sizeBytes)} · {formatDate(d.createdAt)}
                      </p>
                      {d.note ? <p className="mt-0.5 truncate text-[12px] text-ink-400">{d.note}</p> : null}
                    </div>
                    <Badge tone={TONE[d.category] ?? "neutral"}>{label(d.category)}</Badge>
                    <span className="flex shrink-0 gap-1">
                      <IconButton label="Preview" onClick={() => window.open(`/api/documents/${d.id}/file`, "_blank", "noopener")}>
                        <Eye className="size-4" />
                      </IconButton>
                      <IconButton label="Download" onClick={() => window.open(`/api/documents/${d.id}/file?download=1`, "_blank", "noopener")}>
                        <Download className="size-4" />
                      </IconButton>
                      <IconButton label="Edit details" onClick={() => setEditing({ ...d })}>
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton label="Delete" onClick={() => setConfirmDoc(d)} className="hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="size-4" />
                      </IconButton>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader
            icon={<Award className="size-[18px]" />}
            title="Certifications"
            subtitle={`${certs.data?.items.length ?? 0} recorded`}
            action={
              <Button size="sm" variant="secondary" icon={<Plus className="size-3.5" />} onClick={() => openCert()}>
                Add
              </Button>
            }
          />
          <div className="p-5">
            {certs.loading ? (
              <div className="space-y-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : (certs.data?.items.length ?? 0) === 0 ? (
              <EmptyState
                compact
                icon={<Award className="size-5" />}
                title="No certifications"
                message="Even in-progress certifications count — they show direction."
                action={<Button size="sm" onClick={() => openCert()}>Add certification</Button>}
              />
            ) : (
              <ul className="space-y-2">
                {certs.data!.items.map((c) => (
                  <li key={c.id} className="rounded-xl border border-ink-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ink-900">{c.name}</p>
                        <p className="truncate text-[12px] text-ink-500">
                          {[c.issuer, c.issuedAt].filter(Boolean).join(" · ") || "No issuer recorded"}
                        </p>
                        {c.credentialUrl ? (
                          <a href={c.credentialUrl} target="_blank" rel="noreferrer noopener" className="mt-1 inline-block text-[12px] font-medium text-brand-700 hover:underline">
                            View credential
                          </a>
                        ) : null}
                      </div>
                      <span className="flex shrink-0 gap-0.5">
                        <IconButton label="Edit" onClick={() => openCert(c)} className="size-8"><Pencil className="size-3.5" /></IconButton>
                        <IconButton label="Delete" onClick={() => setConfirmCert(c)} className="size-8 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-3.5" /></IconButton>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Upload dialog */}
      <Modal
        open={uploadOpen}
        onClose={() => !uploading && setUploadOpen(false)}
        title="Upload document"
        description={pendingFile ? `${pendingFile.name} · ${formatBytes(pendingFile.size)}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setUploadOpen(false)} disabled={uploading}>Cancel</Button>
            <Button onClick={upload} loading={uploading} disabled={!meta.title.trim() || !pendingFile}>Upload</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Document title" className="sm:col-span-2" required>
            <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
          </Field>
          <Field label="Category">
            <Select value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value })}>
              {CATEGORIES.filter((c) => c !== "all").map((c) => (
                <option key={c} value={c}>{label(c)}</option>
              ))}
            </Select>
          </Field>
          {meta.category === "certificate" ? (
            <>
              <Field label="Issuer"><Input value={meta.issuer} onChange={(e) => setMeta({ ...meta, issuer: e.target.value })} placeholder="Microsoft" /></Field>
              <Field label="Issued"><Input value={meta.issuedAt} onChange={(e) => setMeta({ ...meta, issuedAt: e.target.value })} placeholder="Feb 2024" /></Field>
            </>
          ) : null}
          <Field label="Note" className="sm:col-span-2">
            <Textarea value={meta.note} onChange={(e) => setMeta({ ...meta, note: e.target.value })} placeholder="What is this evidence of?" />
          </Field>
          {uploading || progress > 0 ? (
            <div className="sm:col-span-2">
              <ProgressBar value={progress} />
              <p className="mt-1.5 text-[12px] text-ink-500">
                {progress < 100 ? "Uploading and validating the file…" : "Upload complete."}
              </p>
            </div>
          ) : null}
          <p className="text-[12px] leading-relaxed text-ink-400 sm:col-span-2">
            The server re-checks the file&apos;s real content against its declared type and rejects anything that does not
            match. Uploading a certificate also creates a matching certification entry automatically.
          </p>
        </div>
      </Modal>

      {/* Edit metadata */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit document details"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveMeta} disabled={!editing?.title.trim()}>Save</Button>
          </>
        }
      >
        {editing ? (
          <div className="grid gap-4">
            <Field label="Title"><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Category">
              <Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {CATEGORIES.filter((c) => c !== "all").map((c) => (
                  <option key={c} value={c}>{label(c)}</option>
                ))}
              </Select>
            </Field>
            <Field label="Note">
              <Textarea value={editing.note ?? ""} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
            </Field>
          </div>
        ) : null}
      </Modal>

      {/* Certification dialog */}
      <Modal
        open={certOpen}
        onClose={() => setCertOpen(false)}
        title={certEditing ? "Edit certification" : "Add certification"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCertOpen(false)} disabled={certBusy}>Cancel</Button>
            <Button onClick={saveCert} loading={certBusy} disabled={!certForm.name.trim()}>{certEditing ? "Save changes" : "Add"}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Certification name" className="sm:col-span-2" required>
            <Input value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} placeholder="AWS Certified Solutions Architect" />
          </Field>
          <Field label="Issuer"><Input value={certForm.issuer} onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })} /></Field>
          <Field label="Issued"><Input value={certForm.issuedAt} onChange={(e) => setCertForm({ ...certForm, issuedAt: e.target.value })} placeholder="Feb 2024" /></Field>
          <Field label="Expires"><Input value={certForm.expiresAt} onChange={(e) => setCertForm({ ...certForm, expiresAt: e.target.value })} placeholder="Feb 2027" /></Field>
          <Field label="Credential URL"><Input value={certForm.credentialUrl} onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })} placeholder="https://…" /></Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDoc)}
        title={`Delete "${confirmDoc?.title ?? ""}"?`}
        message="The stored file is permanently removed from the server along with its database record."
        loading={deleteBusy}
        onCancel={() => setConfirmDoc(null)}
        onConfirm={() => confirmDoc && removeDoc(confirmDoc)}
      />

      <ConfirmDialog
        open={Boolean(confirmCert)}
        title={`Remove ${confirmCert?.name ?? ""}?`}
        message="This removes the certification from your profile and résumé."
        confirmLabel="Remove"
        onCancel={() => setConfirmCert(null)}
        onConfirm={() => confirmCert && removeCert(confirmCert)}
      />
    </>
  );
}
