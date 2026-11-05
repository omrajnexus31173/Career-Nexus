"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { Alert, Button, Field, Input, useToast } from "@/components/ui";
import { api, errorMessage } from "@/lib/client";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ delivered: boolean; reason?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = await api<{ delivered: boolean; reason?: string; unknownAccount?: boolean }>(
        "/api/auth/forgot-password",
        { method: "POST", json: { email } },
      );
      setResult({ delivered: data.delivered, reason: data.reason });
      if (data.delivered) toast.success("Reset link sent", `Check ${email} for instructions.`);
      else toast.info("Reset link generated", "Email delivery is not configured on this server.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <div className="animate-fade-up">
        <h1 className="font-display text-[27px] leading-tight font-semibold text-ink-900">Reset your password</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-500">
          Enter the email on your account. We will send a link that expires in one hour.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <Field label="Email address" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </Field>
          {error ? <Alert tone="error">{error}</Alert> : null}
          {result ? (
            result.delivered ? (
              <Alert tone="success" title="Email sent">
                Open the link in the message to choose a new password.
              </Alert>
            ) : (
              <Alert tone="warning" title="Reset link created, but email was not delivered">
                {result.reason ?? "No email provider is configured."} Set <code>RESEND_API_KEY</code> (and optionally{" "}
                <code>EMAIL_FROM</code>) on the server to enable delivery. If you are already signed in on another
                device, you can mint a single-use recovery code from <strong>Settings → Security</strong> and use it on
                the reset page.
              </Alert>
            )
          ) : null}
          <Button type="submit" full size="lg" loading={busy} icon={<Mail className="size-4" />}>
            Send reset link
          </Button>
        </form>

        <p className="mt-8 border-t border-ink-200 pt-5 text-center text-[13.5px] text-ink-500">
          <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
            <ArrowLeft className="size-3.5" /> Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
