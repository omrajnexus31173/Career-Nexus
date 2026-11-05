"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

const HIGHLIGHTS = [
  "35+ career paths across technology, healthcare, trades, finance, education and more",
  "Readiness score computed from your real skills, projects and certifications",
  "Day-by-day roadmaps for 30 to 365 days with progress you actually earn",
  "Résumé builder that exports a real PDF from your stored data",
];

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="grain relative hidden flex-col justify-between overflow-hidden bg-ink-950 p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute -top-32 -left-24 size-[420px] rounded-full opacity-35 blur-3xl"
          style={{ background: "radial-gradient(circle, #0d9488 0%, transparent 65%)" }}
          aria-hidden
        />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700">
            <Sparkles className="size-[18px]" />
          </span>
          <span className="font-display text-[16px] font-semibold tracking-tight">Career Nexus</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-display text-[34px] leading-[1.1] font-semibold">
            Discover your potential.
            <br />
            <span className="text-brand-300">Build your path.</span>
          </h2>
          <ul className="mt-7 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex gap-3 text-[13.5px] leading-relaxed text-white/60">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-400" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] text-white/35">
          Every action writes to your own account. Your data is never shared between users.
        </p>
      </div>

      <div className="flex min-h-screen flex-col justify-center bg-page px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
