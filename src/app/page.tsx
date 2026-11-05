import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Compass,
  FileStack,
  GraduationCap,
  Languages,
  Map,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { CAREERS } from "@/lib/catalog";
import { ALL_SKILLS, SKILL_CATEGORIES } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: <Compass className="size-5" />,
    title: "Intelligent career analyzer",
    body: "Pick any of 35+ professions. It scores your real readiness and names the exact skills you are missing — computed from your profile, not from generic advice.",
  },
  {
    icon: <Map className="size-5" />,
    title: "Personalized roadmaps",
    body: "30, 60, 90, 100, 180 or 365 days, adapted to your weekly hours and current level. Phases, tasks, resources, milestones — with progress you actually earn.",
  },
  {
    icon: <Bot className="size-5" />,
    title: "Nexus AI assistant",
    body: "Ask about interviews, résumés, skill order or career changes. Answers are grounded in your stored profile and roadmap, with honest fallbacks when no AI key is set.",
  },
  {
    icon: <FileStack className="size-5" />,
    title: "Résumé builder & PDF export",
    body: "Three templates, live preview, reorderable sections and a real generated PDF containing your actual data.",
  },
  {
    icon: <Languages className="size-5" />,
    title: "Dynamic skills & languages",
    body: `${ALL_SKILLS.length}+ searchable skills across ${Object.keys(SKILL_CATEGORIES).length} categories, plus unlimited custom entries with proficiency and years of experience.`,
  },
  {
    icon: <ShieldCheck className="size-5" />,
    title: "Private by design",
    body: "Hashed passwords, DB-backed sessions, per-row ownership checks and authenticated file downloads. Your documents are never served from a public folder.",
  },
];

const AUDIENCES = [
  "School & college students",
  "University graduates",
  "Freshers",
  "Job seekers",
  "Working professionals",
  "Entrepreneurs",
  "Freelancers",
  "Career changers",
  "Returning to work",
  "Learning new skills",
];

export default async function LandingPage() {
  await ensureSeed().catch(() => undefined);
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700">
            <Sparkles className="size-[18px] text-white" />
          </span>
          <span className="font-display text-[16px] font-semibold tracking-tight">Career Nexus</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-400"
          >
            Create account
          </Link>
        </nav>
      </header>

      <main>
        <section className="grain relative overflow-hidden border-b border-white/10">
          <div
            className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, #0d9488 0%, transparent 65%)" }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-4xl px-5 pt-16 pb-20 text-center sm:pt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-500/10 px-3.5 py-1.5 text-[11.5px] font-semibold tracking-[0.1em] text-brand-200 uppercase">
              Discover · Build · Define
            </span>
            <h1 className="animate-fade-up mt-6 font-display text-[clamp(2.4rem,6.5vw,4.2rem)] leading-[1.03] font-semibold tracking-tight">
              The career development ecosystem that
              <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent"> actually knows you</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[15.5px] leading-relaxed text-white/65">
              Record who you are, see exactly where you stand against the career you want, then follow a
              day-by-day plan built from your real gaps. Everything persists — skills, documents, projects,
              roadmaps, résumés and conversations live in your own account.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-500 px-6 text-[15px] font-semibold text-ink-950 transition-all hover:bg-brand-400"
              >
                Start free <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login?demo=1"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 px-6 text-[15px] font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
              >
                Explore the demo account
              </Link>
            </div>
            <p className="mt-5 text-[12.5px] text-white/40">
              Demo credentials — email <span className="text-white/70">demo@careernexus.app</span>, password{" "}
              <span className="text-white/70">Demo1234!</span>
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition-colors hover:border-brand-400/40 hover:bg-white/[0.06]"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
                  {f.icon}
                </span>
                <h3 className="mt-3.5 text-[15px] font-semibold text-white">{f.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
              <div>
                <h2 className="font-display text-[28px] leading-tight font-semibold">
                  Built for every starting point
                </h2>
                <p className="mt-3 text-[14.5px] leading-relaxed text-white/60">
                  Career Nexus does not assume you are a university student or a software developer. The
                  catalogue spans healthcare, education, skilled trades, finance, creative work, logistics,
                  public service and entrepreneurship — and custom skills mean nothing is limited to a
                  preset list.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {AUDIENCES.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[12.5px] text-white/70"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-5">
                <p className="mb-3 flex items-center gap-2 text-[12px] font-semibold tracking-[0.14em] text-brand-300 uppercase">
                  <GraduationCap className="size-4" /> Sample career paths
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {CAREERS.slice(0, 16).map((c) => (
                    <div key={c.id} className="rounded-lg bg-white/[0.04] px-3 py-2">
                      <p className="text-[13px] font-medium text-white/90">{c.title}</p>
                      <p className="text-[11.5px] text-white/40">{c.family} · {c.salaryRange}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12px] text-white/40">
                  {CAREERS.length} career paths in the catalogue · {ALL_SKILLS.length}+ skills ·{" "}
                  {Object.keys(SKILL_CATEGORIES).length} skill categories
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-20 text-center">
          <h2 className="font-display text-[30px] leading-tight font-semibold">
            Your next step starts with an honest picture of where you are.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14.5px] text-white/60">
            Create an account, add your skills, run an analysis and generate a roadmap in under ten minutes.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-brand-500 px-7 text-[15px] font-semibold text-ink-950 transition-colors hover:bg-brand-400"
          >
            Create your account <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-[12.5px] text-white/35">
        Career Nexus · Discover Your Potential. Build Your Path. Define Your Future.
      </footer>
    </div>
  );
}
