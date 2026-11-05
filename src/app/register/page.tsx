"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, UserPlus } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { Alert, Button, Field, Input, useToast } from "@/components/ui";
import { api, errorMessage, fieldErrors } from "@/lib/client";

function strength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const level = strength(form.password);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    if (form.password !== form.confirm) {
      setErrors({ confirm: "Passwords do not match." });
      return;
    }
    setBusy(true);
    try {
      await api("/api/auth/register", {
        method: "POST",
        json: { fullName: form.fullName, email: form.email, password: form.password },
      });
      // Same cookie round-trip check as sign-in: never claim success when the session was not kept.
      await api("/api/auth/session").catch(() => {
        throw new Error(
          "Your account was created, but this browser did not keep the sign-in session. Open Career Nexus in a new browser tab and sign in there.",
        );
      });
      toast.success("Account created", "Let's build your profile.");
      router.replace("/profile?onboarding=1");
      router.refresh();
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <div className="animate-fade-up">
        <h1 className="font-display text-[27px] leading-tight font-semibold text-ink-900">Create your account</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-500">
          Free forever for personal use. Only your name, email and password are required to start.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <Field label="Full name" error={errors.fullName} required>
            <Input value={form.fullName} onChange={set("fullName")} placeholder="Amara Okafor" autoComplete="name" invalid={Boolean(errors.fullName)} required />
          </Field>
          <Field label="Email address" error={errors.email} required>
            <Input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" invalid={Boolean(errors.email)} required />
          </Field>
          <Field
            label="Password"
            error={errors.password}
            hint="At least 8 characters, mixing letters and numbers."
            required
          >
            <Input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" autoComplete="new-password" invalid={Boolean(errors.password)} required />
          </Field>
          {form.password ? (
            <div className="flex items-center gap-1.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < level ? (level <= 1 ? "bg-red-400" : level === 2 ? "bg-flare-400" : "bg-brand-500") : "bg-ink-200"
                  }`}
                />
              ))}
              <span className="ml-1 text-[11.5px] text-ink-400">
                {["Very weak", "Weak", "Fair", "Good", "Strong"][level]}
              </span>
            </div>
          ) : null}
          <Field label="Confirm password" error={errors.confirm} required>
            <Input type="password" value={form.confirm} onChange={set("confirm")} placeholder="••••••••" autoComplete="new-password" invalid={Boolean(errors.confirm)} required />
          </Field>

          {formError ? <Alert tone="error">{formError}</Alert> : null}

          <Button type="submit" full size="lg" loading={busy} icon={<UserPlus className="size-4" />}>
            Create account
          </Button>
        </form>

        <p className="mt-8 border-t border-ink-200 pt-5 text-center text-[13.5px] text-ink-500">
          Already registered?{" "}
          <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
            Sign in <ArrowRight className="size-3.5" />
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
