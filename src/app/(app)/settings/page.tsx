"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Copy, KeyRound, Lock, Save, Settings2, ShieldCheck } from "lucide-react";
import {
  Alert, Badge, Button, Card, CardHeader, Field, Input, PageHeader, Skeleton, Toggle, useToast,
} from "@/components/ui";
import { useFetch } from "@/lib/use-api";
import { api, errorMessage, formatDate } from "@/lib/client";

type SettingsRes = { settings: Record<string, boolean | string> };
type ProfileRes = { user: { email: string; fullName: string; createdAt: string; lastLoginAt: string | null } };

const PREFS: { key: string; label: string; description: string }[] = [
  { key: "emailNotifications", label: "Email notifications", description: "Account and security messages." },
  { key: "roadmapReminders", label: "Roadmap reminders", description: "In-app nudges when tasks fall behind schedule." },
  { key: "aiSuggestions", label: "AI suggestions", description: "Allow Nexus AI to use your profile as context." },
  { key: "weeklyDigest", label: "Weekly progress digest", description: "A summary of tasks completed each week." },
  { key: "publicProfile", label: "Public profile", description: "Keep this off unless you want a shareable profile URL later." },
];

export default function SettingsPage() {
  const toast = useToast();
  const router = useRouter();
  const res = useFetch<SettingsRes>("/api/settings");
  const profile = useFetch<ProfileRes>("/api/profile");

  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const [code, setCode] = useState<string | null>(null);
  const [codeBusy, setCodeBusy] = useState(false);

  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!res.data?.settings) return;
    const next: Record<string, boolean> = {};
    for (const p of PREFS) next[p.key] = Boolean(res.data.settings[p.key]);
    setPrefs(next);
    setDirty(false);
  }, [res.data]);

  async function savePrefs() {
    setSaving(true);
    try {
      await api("/api/settings", { method: "PATCH", json: prefs });
      setDirty(false);
      toast.success("Preferences saved");
      res.reload();
    } catch (e) {
      toast.error("Could not save preferences", errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setPwError(null);
    if (pw.newPassword !== pw.confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwBusy(true);
    try {
      await api("/api/auth/password", {
        method: "POST",
        json: { currentPassword: pw.currentPassword, newPassword: pw.newPassword },
      });
      toast.success("Password changed", "Other sessions were signed out.");
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (e) {
      setPwError(errorMessage(e));
    } finally {
      setPwBusy(false);
    }
  }

  async function makeRecoveryCode() {
    setCodeBusy(true);
    try {
      const out = await api<{ code: string }>("/api/auth/recovery-code", { method: "POST" });
      setCode(out.code);
      toast.success("Recovery code generated", "Copy it now — it is shown only once.");
    } catch (e) {
      toast.error("Could not generate a code", errorMessage(e));
    } finally {
      setCodeBusy(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const out = await api<{ ok: boolean; error?: string }>("/api/account", {
        method: "DELETE",
        json: { confirmEmail: deleteEmail },
      });
      if (!out.ok) {
        toast.error("Could not delete the account", out.error);
        setDeleting(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      toast.error("Could not delete the account", errorMessage(e));
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" description="Preferences, security and account controls. Changes here are saved to the database immediately." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<Settings2 className="size-[18px]" />} title="Preferences" subtitle="Control what Career Nexus tracks and reminds you about"
            action={<Button size="sm" onClick={savePrefs} loading={saving} disabled={!dirty} icon={<Save className="size-3.5" />}>Save</Button>} />
          <div className="divide-y divide-ink-100 px-5">
            {res.loading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            ) : (
              PREFS.map((p) => (
                <Toggle
                  key={p.key}
                  label={p.label}
                  description={p.description}
                  checked={Boolean(prefs[p.key])}
                  onChange={(v) => {
                    setPrefs((prev) => ({ ...prev, [p.key]: v }));
                    setDirty(true);
                  }}
                />
              ))
            )}
          </div>
          {dirty ? (
            <div className="border-t border-ink-100 px-5 py-3">
              <Alert tone="info">You have unsaved preference changes.</Alert>
            </div>
          ) : null}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader icon={<Lock className="size-[18px]" />} title="Change password" subtitle="All other sessions are revoked when this succeeds" />
            <div className="space-y-3.5 p-5">
              <Field label="Current password" required>
                <Input type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
              </Field>
              <Field label="New password" hint="At least 8 characters." required>
                <Input type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
              </Field>
              <Field label="Confirm new password" required>
                <Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              </Field>
              {pwError ? <Alert tone="error">{pwError}</Alert> : null}
              <Button onClick={changePassword} loading={pwBusy} disabled={!pw.currentPassword || pw.newPassword.length < 8}>
                Update password
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader icon={<ShieldCheck className="size-[18px]" />} title="Recovery code" subtitle="Works even when email delivery is unavailable" />
            <div className="space-y-3 p-5">
              <p className="text-[12.5px] leading-relaxed text-ink-500">
                Generates a single-use code valid for 24 hours. Use it on the password reset page. It is stored only as a
                hash and shown exactly once.
              </p>
              <Button variant="secondary" onClick={makeRecoveryCode} loading={codeBusy} icon={<KeyRound className="size-4" />}>
                Generate recovery code
              </Button>
              {code ? (
                <div className="rounded-xl border border-brand-200 bg-brand-50 p-3.5">
                  <p className="text-[11px] font-semibold tracking-wide text-brand-700 uppercase">Your code</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-white px-3 py-2 font-mono text-[14px] tracking-wider text-ink-900">{code}</code>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Copy className="size-3.5" />}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(code);
                          toast.success("Copied to clipboard");
                        } catch {
                          toast.error("Clipboard blocked", "Select the code and copy manually.");
                        }
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHeader title="Account" />
            <div className="space-y-2 p-5 text-[13px]">
              <div className="flex justify-between"><span className="text-ink-500">Name</span><span className="font-medium text-ink-800">{profile.data?.user.fullName ?? "—"}</span></div>
              <div className="flex justify-between gap-3"><span className="text-ink-500">Email</span><span className="truncate font-medium text-ink-800">{profile.data?.user.email ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Member since</span><span className="font-medium text-ink-800">{profile.data ? formatDate(profile.data.user.createdAt) : "—"}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Last sign-in</span><span className="font-medium text-ink-800">{profile.data ? formatDate(profile.data.user.lastLoginAt) : "—"}</span></div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-ink-500">Session</span>
                <Badge tone="green">Active · 30-day sliding expiry</Badge>
              </div>
            </div>
          </Card>

          <Card className="border-red-200">
            <CardHeader icon={<AlertTriangle className="size-[18px] text-red-600" />} title="Delete account" subtitle="Permanent and irreversible" />
            <div className="space-y-3 p-5">
              <p className="text-[12.5px] leading-relaxed text-ink-600">
                Deletes your profile, skills, languages, projects, documents, analyses, roadmaps, résumés and
                conversations, then signs you out.
              </p>
              <Field label={`Type ${profile.data?.user.email ?? "your email"} to confirm`}>
                <Input value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)} placeholder={profile.data?.user.email} />
              </Field>
              <Button
                variant="danger"
                loading={deleting}
                onClick={deleteAccount}
                disabled={deleteEmail.trim().toLowerCase() !== (profile.data?.user.email ?? "").toLowerCase()}
              >
                Permanently delete my account
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
