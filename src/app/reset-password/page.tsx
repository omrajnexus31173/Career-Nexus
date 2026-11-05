"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { Alert, Button, Field, Input, useToast } from "@/components/ui";
import { api, errorMessage } from "@/lib/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const t = new URLSearchParams(window.location.search).get("token");
      if (t) setToken(t);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token.trim()) {
      setError("Paste the reset token from your email, or a recovery code from Settings.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/auth/reset-password", { method: "POST", json: { token: token.trim(), password } });
      toast.success("Password updated", "All other sessions were signed out.");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <div className="animate-fade-up">
        <h1 className="font-display text-[27px] leading-tight font-semibold text-ink-900">Choose a new password</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-500">
          Every existing session for your account is revoked as soon as the password changes.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <Field label="Reset token or recovery code" required>
            <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token…" required />
          </Field>
          <Field label="New password" required>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
          </Field>
          <Field label="Confirm new password" required>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </Field>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Button type="submit" full size="lg" loading={busy} icon={<KeyRound className="size-4" />}>
            Update password & sign in
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
