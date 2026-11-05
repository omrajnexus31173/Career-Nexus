"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, LogIn } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { Alert, Button, Field, Input, useToast } from "@/components/ui";
import { api, errorMessage, fieldErrors } from "@/lib/client";

const COOKIE_BLOCKED_MESSAGE =
  "Your password was accepted, but this browser did not keep the sign-in session. Embedded previews and some privacy modes block cookies. Open Career Nexus in a new browser tab and sign in there.";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [next, setNext] = useState("/dashboard");
  const [notice, setNotice] = useState<string | null>(null);
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEmbedded(window.self !== window.top);

      const params = new URLSearchParams(window.location.search);
      const target = params.get("next");

      if (target && target.startsWith("/") && !target.startsWith("//")) setNext(target);
      if (params.get("registered")) setNotice("Account created. You are now signed in.");
      if (params.get("reset")) setNotice("Password updated. Sign in with your new password.");

      if (params.get("demo")) {
        setEmail("demo@careernexus.app");
        setPassword("Demo1234!");
        setNotice("Demo credentials filled in. Press Sign in to explore a fully populated account.");
      }
    }, 0);

  return () => window.clearTimeout(timer);
}, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    setErrors({});

    try {
      await api("/api/auth/login", { method: "POST", json: { email, password } });
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
      setBusy(false);
      return;
    }

    // Verify the cookie round-trip before navigating. A password that is accepted but a session the
    // browser never presents is reported honestly instead of bouncing back to the login screen.
    try {
      await api("/api/auth/session");
    } catch {
      setFormError(COOKIE_BLOCKED_MESSAGE);
      setBusy(false);
      return;
    }

    toast.success("Welcome back", "Session created and verified.");
    router.replace(next);
    router.refresh();
  }

  return (
    <AuthShell>
      <div className="animate-fade-up">
        <h1 className="font-display text-[27px] leading-tight font-semibold text-ink-900">Sign in</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-500">
          Pick up where you left off. Your skills, roadmaps and documents are all still here.
        </p>

        {embedded ? (
          <div className="mt-5">
            <Alert tone="warning" title="You are viewing Career Nexus inside another page">
              Some browsers block sign-in cookies inside embedded frames. If sign-in does not stick,{" "}
              <a href="/login" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                open the app in a new tab
              </a>
              .
            </Alert>
          </div>
        ) : null}

        {notice ? (
          <div className="mt-5">
            <Alert tone="success">{notice}</Alert>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <Field label="Email address" error={errors.email} required>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              invalid={Boolean(errors.email)}
              required
            />
          </Field>

          <Field label="Password" error={errors.password} required>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-11"
                invalid={Boolean(errors.password)}
                required
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>

          {formError ? <Alert tone="error">{formError}</Alert> : null}

          <Button type="submit" full size="lg" loading={busy} icon={<LogIn className="size-4" />}>
            Sign in
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-[13px]">
          <Link href="/forgot-password" className="font-medium text-brand-700 hover:text-brand-800 hover:underline">
            Forgot password?
          </Link>
          <button
            type="button"
            onClick={() => {
              setEmail("demo@careernexus.app");
              setPassword("Demo1234!");
            }}
            className="font-medium text-ink-500 hover:text-ink-800 hover:underline"
          >
            Use demo account
          </button>
        </div>

        <p className="mt-8 border-t border-ink-200 pt-5 text-center text-[13.5px] text-ink-500">
          New to Career Nexus?{" "}
          <Link href="/register" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
            Create an account <ArrowRight className="size-3.5" />
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
