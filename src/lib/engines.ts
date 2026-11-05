import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  analyses,
  certifications,
  educations,
  experiences,
  profiles,
  projects,
  roadmapPhases,
  roadmapTasks,
  roadmaps,
  userLanguages,
  userSkills,
  type Analysis,
  type RoadmapTask,
} from "@/db/schema";
import {
  CAREERS,
  EDUCATION_RANK,
  PROFICIENCY_WEIGHT,
  getCareer,
  type CareerRecord,
} from "@/lib/catalog";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.]/g, "");

function skillMap(rows: { name: string; proficiency: string }[]) {
  const m = new Map<string, { name: string; proficiency: string; weight: number }>();
  for (const r of rows) {
    m.set(norm(r.name), {
      name: r.name,
      proficiency: r.proficiency,
      weight: PROFICIENCY_WEIGHT[r.proficiency] ?? 0.4,
    });
  }
  return m;
}

export type Snapshot = Awaited<ReturnType<typeof loadSnapshot>>;

export async function loadSnapshot(userId: string) {
  const [profile, skills, languages, projectRows, certRows, educationRows, experienceRows] =
    await Promise.all([
      db.query.profiles.findFirst({ where: eq(profiles.userId, userId) }),
      db.select().from(userSkills).where(eq(userSkills.userId, userId)),
      db.select().from(userLanguages).where(eq(userLanguages.userId, userId)),
      db.select().from(projects).where(eq(projects.userId, userId)),
      db.select().from(certifications).where(eq(certifications.userId, userId)),
      db.select().from(educations).where(eq(educations.userId, userId)),
      db.select().from(experiences).where(eq(experiences.userId, userId)),
    ]);
  return {
    profile,
    skills,
    languages,
    projects: projectRows,
    certifications: certRows,
    educations: educationRows,
    experiences: experienceRows,
  };
}

export type AnalysisResult = {
  careerId: string;
  careerTitle: string;
  readinessScore: number;
  profileSummary: string;
  strengths: { skill: string; note: string }[];
  gaps: { skill: string; priority: string; note: string }[];
  recommendedSkills: string[];
  recommendedCertifications: string[];
  suggestedProjects: { title: string; detail: string }[];
  opportunities: string[];
  shortTerm: string[];
  longTerm: string[];
};

/**
 * Deterministic, data-driven analysis. Every field is derived from the user's stored profile,
 * skills, languages, projects, certifications and experience — never randomised.
 */
export function analyseAgainst(snapshot: Snapshot, career: CareerRecord): AnalysisResult {
  const known = skillMap(snapshot.skills);
  const projectTech = new Set(
    snapshot.projects.flatMap((p) => [
      ...(p.technologies ?? []),
      ...(p.skillsDemonstrated ?? []),
    ]).map(norm),
  );
  const heldCerts = snapshot.certifications.map((c) => norm(c.name)).join("|");
  const totalExperienceYears = snapshot.skills.reduce(
    (sum, s) => Math.max(sum, s.yearsExperience ?? 0),
    0,
  );

  const strengths: { skill: string; note: string }[] = [];
  const gaps: { skill: string; priority: string; note: string }[] = [];
  let earned = 0;
  let possible = 0;

  career.coreSkills.forEach((skill, i) => {
    const key = norm(skill);
    const match = known.get(key);
    const demonstrated = projectTech.has(key);
    const importance = 1 - i / (career.coreSkills.length + 4); // earlier = more critical
    possible += importance;

    if (match && match.weight >= 0.7) {
      earned += importance;
      strengths.push({
        skill: match.name,
        note: `${capitalize(match.proficiency)} level${
          demonstrated ? " and demonstrated in your project portfolio" : ""
        } — a core requirement for ${career.title}.`,
      });
    } else if (match) {
      earned += importance * match.weight;
      gaps.push({
        skill: match.name,
        priority: importance > 0.75 ? "high" : "medium",
        note: `Currently ${match.proficiency}. ${career.title} roles expect advanced practical depth.`,
      });
    } else if (demonstrated) {
      earned += importance * 0.6;
      gaps.push({
        skill,
        priority: "medium",
        note: "Appears in your projects but is not declared as a profile skill — quantify your level.",
      });
    } else {
      gaps.push({
        skill,
        priority: importance > 0.75 ? "high" : importance > 0.45 ? "medium" : "low",
        note: `Missing from your profile. Core expectation for ${career.title}.`,
      });
    }
  });

  career.bonusSkills.forEach((skill, i) => {
    const key = norm(skill);
    const match = known.get(key);
    const importance = 0.4 - i / (career.bonusSkills.length + 8);
    possible += importance;
    if (match) {
      earned += importance * match.weight;
      if (match.weight >= 0.7) {
        strengths.push({ skill: match.name, note: `Differentiator — sets you apart for ${career.title}.` });
      }
    } else {
      gaps.push({ skill, priority: "low", note: "Nice-to-have differentiator once core skills are solid." });
    }
  });

  const educationLevel = snapshot.profile?.educationLevel ?? "";
  const educationRank = EDUCATION_RANK[educationLevel] ?? null;
  const requiredRank = EDUCATION_RANK[career.minEducation] ?? null;
  if (educationRank !== null && requiredRank !== null) {
    if (educationRank >= requiredRank) {
      strengths.push({
        skill: educationLevel,
        note: `Meets or exceeds the typical education baseline (${career.minEducation}).`,
      });
    } else {
      gaps.push({
        skill: educationLevel,
        priority: "medium",
        note: `Typical entry expects ${career.minEducation}. Compensate with certifications and a strong portfolio.`,
      });
    }
  } else if (!educationLevel) {
    gaps.push({
      skill: "Education level",
      priority: "low",
      note: "Add your highest education level to your profile for a more accurate readiness score.",
    });
  }

  if (snapshot.projects.length >= 2) {
    strengths.push({
      skill: "Portfolio depth",
      note: `${snapshot.projects.length} documented projects give you concrete proof of work.`,
    });
  } else {
    gaps.push({
      skill: "Portfolio",
      priority: "high",
      note: snapshot.projects.length === 0
        ? "No projects recorded yet. Employers for this path screen heavily on evidence of work."
        : "Only one project recorded — aim for at least three relevant pieces of evidence.",
    });
  }

  if (snapshot.certifications.length > 0) {
    strengths.push({
      skill: "Certifications",
      note: `${snapshot.certifications.length} certification(s) on file add third-party validation.`,
    });
  }

  if (totalExperienceYears >= 2) {
    strengths.push({
      skill: "Hands-on experience",
      note: `Up to ${totalExperienceYears} years of declared practical experience across your skills.`,
    });
  }

  if (snapshot.languages.length >= 2) {
    strengths.push({
      skill: "Languages",
      note: `${snapshot.languages.length} languages — valuable for international and client-facing roles.`,
    });
  }

  const missingCerts = career.certifications.filter((c) => !heldCerts.includes(norm(c)));
  const recommendedSkills = gaps
    .slice()
    .sort((a, b) => rank(a.priority) - rank(b.priority))
    .map((g) => g.skill);

  const readiness = possible > 0 ? Math.round((earned / possible) * 100) : 0;
  const score = Math.max(3, Math.min(97, readiness));

  const interests = snapshot.profile?.careerInterests ?? [];
  const industries = snapshot.profile?.preferredIndustries ?? [];
  const opportunities = [
    ...career.opportunities,
    industries.length
      ? `${career.title} roles within ${industries.slice(0, 2).join(" and ")}`
      : `${career.title} roles across ${career.family.toLowerCase()} employers`,
    snapshot.profile?.country
      ? `Local market: search ${career.title} openings in ${snapshot.profile.country}`
      : "Set your country/location to unlock local market guidance",
    interests.length
      ? `Aligns with your stated interest in ${interests.slice(0, 2).join(", ").toLowerCase()}`
      : "Add career interests to sharpen role matching",
  ];

  const highGaps = gaps.filter((g) => g.priority === "high").map((g) => g.skill);
  const shortTerm = [
    highGaps.length
      ? `Close your highest-priority gaps first: ${highGaps.slice(0, 3).join(", ")}.`
      : `Reinforce your existing strengths with deliberate practice in ${career.coreSkills.slice(0, 2).join(", ")}.`,
    snapshot.projects.length < 3
      ? `Ship ${3 - snapshot.projects.length} more relevant project(s) and record them in your portfolio.`
      : "Polish and document your strongest project with measurable outcomes.",
    missingCerts.length
      ? `Start ${missingCerts[0]} — the most recognised credential for this path.`
      : "Maintain your certifications and record renewal dates.",
    snapshot.skills.length === 0
      ? "Add your current skills to your profile so gap analysis is accurate."
      : `Raise one existing skill from ${lowestProficiency(snapshot.skills)} to the next level.`,
  ];

  const longTerm = [
    `Progress from ${career.title} to ${career.opportunities[1] ?? career.opportunities[0] ?? "a senior position"} within 24–36 months.`,
    `Build specialist depth in ${career.bonusSkills.slice(0, 2).join(" and ") || "an adjacent specialisation"} to command a premium.`,
    `Target the ${career.salaryRange} band by assembling evidence: ${career.certifications[0] ?? "a recognised certification"}, 3+ portfolio projects and documented results.`,
    snapshot.experiences.length === 0
      ? "Record your work history so leadership experience is visible to employers."
      : `Extend your leadership scope — mentoring or owning delivery for a team.`,
  ];

  const role = snapshot.profile?.currentRole;
  const years = snapshot.profile?.yearsExperience;
  const profileSummary = [
    role ? `You currently work as ${role}` : "Your current role is not set",
    years ? `with ${years} of experience` : null,
    snapshot.profile?.country ? `based in ${snapshot.profile.country}` : null,
    educationLevel ? `and your highest education level is ${educationLevel}` : null,
    `. You hold ${snapshot.skills.length} declared skill${snapshot.skills.length === 1 ? "" : "s"}`,
    `, ${snapshot.projects.length} project${snapshot.projects.length === 1 ? "" : "s"}`,
    ` and ${snapshot.certifications.length} certification${snapshot.certifications.length === 1 ? "" : "s"}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    careerId: career.id,
    careerTitle: career.title,
    readinessScore: score,
    profileSummary,
    strengths: strengths.slice(0, 10),
    gaps: gaps
      .slice()
      .sort((a, b) => rank(a.priority) - rank(b.priority))
      .slice(0, 16),
    recommendedSkills: recommendedSkills.slice(0, 14),
    recommendedCertifications: missingCerts.slice(0, 4),
    suggestedProjects: career.projectIdeas,
    opportunities: opportunities.slice(0, 6),
    shortTerm,
    longTerm,
  };
}

function rank(p: string) {
  return p === "high" ? 0 : p === "medium" ? 1 : 2;
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function lowestProficiency(skills: { proficiency: string }[]) {
  const order = ["beginner", "intermediate", "advanced", "expert"];
  const sorted = skills.slice().sort((a, b) => order.indexOf(a.proficiency) - order.indexOf(b.proficiency));
  return sorted[0]?.proficiency ?? "beginner";
}

export async function persistAnalysis(userId: string, result: AnalysisResult, engine: string, aiInsight?: string) {
  const [row] = await db
    .insert(analyses)
    .values({ userId, ...result, engine, aiInsight: aiInsight ?? null })
    .returning();
  await db
    .update(profiles)
    .set({ targetCareerId: result.careerId, updatedAt: new Date() })
    .where(eq(profiles.userId, userId));
  return row;
}

export async function latestAnalysis(userId: string): Promise<Analysis | undefined> {
  return db.query.analyses.findFirst({
    where: eq(analyses.userId, userId),
    orderBy: [desc(analyses.createdAt)],
  });
}

export { CAREERS, getCareer };

/* ------------------------------------------------------------------ */
/* Roadmap engine                                                      */
/* ------------------------------------------------------------------ */

const PHASE_BLUEPRINT = [
  { title: "Foundation & Baseline", objective: "Establish where you are and lock the fundamentals required by your target role." },
  { title: "Core Skill Build", objective: "Convert your highest-priority gaps into working, demonstrable ability." },
  { title: "Applied Practice", objective: "Use the new skills on realistic problems under time constraints." },
  { title: "Portfolio & Projects", objective: "Produce tangible evidence of work that recruiters can inspect." },
  { title: "Certification & Validation", objective: "Gain third-party proof of competence and prepare for assessment." },
  { title: "Job-Ready Specialisation", objective: "Sharpen your differentiators and run an active market approach." },
];

export type RoadmapInput = {
  careerId?: string;
  title?: string;
  durationDays: number;
  weeklyHours: number;
  focus: string[];
};

export async function buildRoadmap(userId: string, input: RoadmapInput) {
  const snapshot = await loadSnapshot(userId);
  const career =
    getCareer(input.careerId) ??
    getCareer(snapshot.profile?.targetCareerId ?? "") ??
    CAREERS[0];

  const analysis = analyseAgainst(snapshot, career);
  const focusSet = new Set(input.focus.map(norm));

  const phaseCount = Math.max(3, Math.min(6, Math.round(input.durationDays / 60)));
  const phaseLength = Math.ceil(input.durationDays / phaseCount);
  const weeklyTaskCount = Math.max(2, Math.round(input.weeklyHours / 3));
  const minutesPerTask = Math.max(30, Math.round((input.weeklyHours * 60) / weeklyTaskCount / 15) * 15);

  type Draft = {
    title: string;
    description: string;
    kind: RoadmapTask["kind"];
    priority: string;
    resourceName?: string;
    resourceUrl?: string;
    estimatedMinutes: number;
    isMilestone?: boolean;
    phaseHint: number;
  };
  const pool: Draft[] = [];

  // Skills the user explicitly focused on come first, then gaps by priority.
  const sortedGaps = analysis.gaps.slice().sort((a, b) => {
    const fa = focusSet.has(norm(a.skill)) ? 0 : 1;
    const fb = focusSet.has(norm(b.skill)) ? 0 : 1;
    if (fa !== fb) return fa - fb;
    return rank(a.priority) - rank(b.priority);
  });

  sortedGaps.forEach((gap, i) => {
    const phaseHint = Math.min(phaseCount - 1, Math.floor((i / Math.max(sortedGaps.length, 1)) * phaseCount));
    pool.push({
      title: `Learn ${gap.skill} fundamentals`,
      description: `${gap.note} Work through structured material and take notes you can revisit.`,
      kind: "learn",
      priority: gap.priority,
      resourceName: resourceFor(gap.skill).name,
      resourceUrl: resourceFor(gap.skill).url,
      estimatedMinutes: minutesPerTask,
      phaseHint,
    });
    pool.push({
      title: `Practise ${gap.skill} with exercises`,
      description: `Complete at least 10 deliberate exercises in ${gap.skill}. Speed and accuracy matter more than volume.`,
      kind: "practice",
      priority: gap.priority,
      resourceName: "freeCodeCamp / Khan Academy practice sets",
      resourceUrl: "https://www.freecodecamp.org",
      estimatedMinutes: minutesPerTask,
      phaseHint: Math.min(phaseCount - 1, phaseHint + 1),
    });
  });

  analysis.suggestedProjects.forEach((p, i) => {
    pool.push({
      title: `Build: ${p.title}`,
      description: `${p.detail} Record the result in your portfolio with the technologies and skills used.`,
      kind: "project",
      priority: "high",
      estimatedMinutes: minutesPerTask * 3,
      phaseHint: Math.min(phaseCount - 1, 2 + Math.floor(i / 2)),
    });
  });

  analysis.recommendedCertifications.slice(0, 2).forEach((certName, i) => {
    pool.push({
      title: `Prepare for ${certName}`,
      description: `Map the exam syllabus, schedule study blocks and complete two full practice exams above 80%.`,
      kind: "learn",
      priority: "medium",
      resourceName: certName,
      resourceUrl: "https://www.coursera.org",
      estimatedMinutes: minutesPerTask * 2,
      phaseHint: Math.min(phaseCount - 1, 3 + i),
    });
    pool.push({
      title: `Sit the ${certName} exam`,
      description: "Book the exam in advance so the deadline drives your revision. Upload the certificate when you pass.",
      kind: "assessment",
      priority: "medium",
      estimatedMinutes: 180,
      phaseHint: Math.min(phaseCount - 1, 4 + i),
    });
  });

  pool.push({
    title: "Update your Career Nexus profile and résumé",
    description: "Add every new skill, project and certification. Regenerate your résumé so evidence is current.",
    kind: "practice",
    priority: "medium",
    estimatedMinutes: 90,
    phaseHint: Math.min(phaseCount - 1, phaseCount - 2),
  });
  pool.push({
    title: "Mock interview for " + career.title,
    description: `Prepare answers for the top 12 questions in ${career.family.toLowerCase()} interviews, then record yourself answering five aloud.`,
    kind: "assessment",
    priority: "high",
    estimatedMinutes: 120,
    phaseHint: phaseCount - 1,
  });
  pool.push({
    title: "Active market approach",
    description: `Apply to 5 ${career.title} roles per week, tailor each résumé, and log responses. Ask Nexus AI for résumé feedback per application.`,
    kind: "practice",
    priority: "high",
    estimatedMinutes: 150,
    phaseHint: phaseCount - 1,
  });

  const ordered = pool
    .slice()
    .sort((a, b) => a.phaseHint - b.phaseHint || rank(b.priority) - rank(a.priority))
    .slice(0, Math.min(pool.length, Math.max(12, Math.round((input.durationDays / 7) * weeklyTaskCount * 0.55))));

  const milestones: Draft[] = [];
  for (let p = 0; p < phaseCount; p++) {
    milestones.push({
      title: `Milestone: complete ${PHASE_BLUEPRINT[p].title}`,
      description: `${PHASE_BLUEPRINT[p].objective} Confirm every task in this phase is finished before moving on.`,
      kind: "milestone",
      priority: "high",
      estimatedMinutes: 30,
      isMilestone: true,
      phaseHint: p,
    });
  }

  const all = [...ordered, ...milestones].sort((a, b) => a.phaseHint - b.phaseHint);

  const title = input.title?.trim() || `${career.title} — ${input.durationDays}-day roadmap`;

  const [roadmap] = await db
    .insert(roadmaps)
    .values({
      userId,
      title,
      careerTitle: career.title,
      durationDays: input.durationDays,
      weeklyHours: input.weeklyHours,
      status: "active",
      startDate: new Date(),
      nextAction: all[0]?.title ?? "Add your first task",
    })
    .returning();

  const phases = [];
  for (let p = 0; p < phaseCount; p++) {
    const bp = PHASE_BLUEPRINT[p];
    phases.push({
      roadmapId: roadmap.id,
      title: bp.title,
      objective: bp.objective,
      orderIndex: p,
      startDay: p * phaseLength + 1,
      endDay: Math.min(input.durationDays, (p + 1) * phaseLength),
    });
  }
  const insertedPhases = await db.insert(roadmapPhases).values(phases).returning();

  const tasks = all.map((t, i) => {
    const phase = insertedPhases.find((ph) => ph.orderIndex === t.phaseHint) ?? insertedPhases[insertedPhases.length - 1];
    const spanDays = Math.max(1, phase.endDay - phase.startDay + 1);
    const withinPhase = ordered.filter((x) => x.phaseHint === t.phaseHint);
    const idxInPhase = withinPhase.indexOf(t);
    const dueDay = t.isMilestone
      ? phase.endDay
      : Math.min(phase.endDay, phase.startDay + Math.round((Math.max(idxInPhase, 0) / Math.max(withinPhase.length, 1)) * spanDays));
    return {
      roadmapId: roadmap.id,
      phaseId: phase.id,
      title: t.title,
      description: t.description,
      kind: t.kind,
      priority: t.priority,
      resourceName: t.resourceName ?? null,
      resourceUrl: t.resourceUrl ?? null,
      estimatedMinutes: t.estimatedMinutes,
      dueDay,
      isMilestone: t.isMilestone ?? false,
      orderIndex: i,
      status: "todo",
    };
  });

  await db.insert(roadmapTasks).values(tasks);

  return { roadmap, phases: insertedPhases, taskCount: tasks.length, readinessScore: analysis.readinessScore };
}

function resourceFor(skill: string) {
  const key = norm(skill);
  const table: [string[], { name: string; url: string }][] = [
    [["python", "pandas", "numpy", "machinelearning", "deeplearning", "datascience", "scikit-learn", "pytorch", "tensorflow"]
      .map(norm), { name: "freeCodeCamp — Python & ML", url: "https://www.freecodecamp.org/learn/" }],
    [[ "javascript","typescript","react","next.js","node.js","html","css","tailwindcss","vue.js","angular"].map(norm),
      { name: "MDN Web Docs", url: "https://developer.mozilla.org" }],
    [["sql","postgresql","mysql","mongodb","database"].map(norm),
      { name: "SQLBolt — interactive SQL", url: "https://sqlbolt.com" }],
    [["aws","azure","docker","kubernetes","terraform","cloudcomputing","cicd"].map(norm),
      { name: "AWS Skill Builder / Azure Learn", url: "https://learn.microsoft.com/training" }],
    [["networksecurity","penetrationtesting","siem","cryptography","owasptop10","incidentresponse"].map(norm),
      { name: "TryHackMe", url: "https://tryhackme.com" }],
    [["projectmanagement","agile","scrum","jira","kanban"].map(norm),
      { name: "Atlassian Agile Coach", url: "https://www.atlassian.com/agile" }],
    [["leadership","communication","publicspeaking","negotiation","emotionalintelligence"].map(norm),
      { name: "Coursera — Leadership & Communication", url: "https://www.coursera.org/browse/business/leadership-and-management" }],
    [["uidesign","uxdesign","figma","prototyping","wireframing","userresearch"].map(norm),
      { name: "Nielsen Norman Group articles", url: "https://www.nngroup.com/articles/" }],
    [["financialmodeling","excel","valuation","budgeting","accounting"].map(norm),
      { name: "Corporate Finance Institute (free courses)", url: "https://corporatefinanceinstitute.com/courses/" }],
    [["seo","googleads","contentmarketing","emailmarketing","digitalmarketing"].map(norm),
      { name: "Google Digital Garage", url: "https://learndigital.withgoogle.com/digitalgarage" }],
    [["patientcare","nursing","clinicalassessment","medicalterminology"].map(norm),
      { name: "OpenLearn — Health & Social Care", url: "https://www.open.edu/openlearn/health-sports-psychology" }],
    [["lessonplanning","curriculumdevelopment","instructionaldesign","e-learning"].map(norm),
      { name: "Coursera — Learning How to Learn", url: "https://www.coursera.org/learn/learning-how-to-learn" }],
    [["cad","autocad","solidworks","finiteelementanalysis","mechanicalengineering"].map(norm),
      { name: "MIT OpenCourseWare — Mechanical Engineering", url: "https://ocw.mit.edu/search/?d=Mechanical+Engineering" }],
    [["git","datastructures","algorithms","systemdesign","unittesting"].map(norm),
      { name: "roadmap.sh", url: "https://roadmap.sh" }],
  ];
  for (const [keys, res] of table) {
    if (keys.includes(key)) return res;
  }
  return { name: `Coursera — ${skill}`, url: `https://www.coursera.org/search?query=${encodeURIComponent(skill)}` };
}

/* ------------------------------------------------------------------ */
/* Progress (always computed from real task rows — never estimated)    */
/* ------------------------------------------------------------------ */

export function computeProgress(tasks: { status: string; isMilestone: boolean; estimatedMinutes: number; title: string; dueDay: number; orderIndex: number }[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const milestones = tasks.filter((t) => t.isMilestone);
  const milestonesDone = milestones.filter((t) => t.status === "done").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const remainingMinutes = tasks
    .filter((t) => t.status !== "done")
    .reduce((s, t) => s + t.estimatedMinutes, 0);
  const next = tasks
    .filter((t) => t.status !== "done" && !t.isMilestone)
    .sort((a, b) => a.dueDay - b.dueDay || a.orderIndex - b.orderIndex)[0];
  const nextMilestone = milestones.filter((t) => t.status !== "done").sort((a, b) => a.dueDay - b.dueDay)[0];

  return {
    total,
    done,
    inProgress,
    pending: total - done - inProgress,
    percent,
    milestonesTotal: milestones.length,
    milestonesDone,
    remainingHours: Math.round(remainingMinutes / 6) / 10,
    nextAction: next?.title ?? nextMilestone?.title ?? "All tasks complete",
  };
}

export async function roadmapProgress(roadmapId: string) {
  const tasks = await db
    .select()
    .from(roadmapTasks)
    .where(and(eq(roadmapTasks.roadmapId, roadmapId)));
  return computeProgress(tasks);
}
