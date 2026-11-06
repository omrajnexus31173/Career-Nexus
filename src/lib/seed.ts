
import PDFDocument from "pdfkit";
import { and, eq, sql } from "drizzle-orm";
import { db, pool } from "@/db";
import {
  activities,
  certifications,
  conversations,
  documents,
  educations,
  experiences,
  messages,
  notifications,
  profiles,
  projects,
  resumes,
  roadmapPhases,
  roadmapTasks,
  roadmaps,
  settings,
  userLanguages,
  userSkills,
  users,
} from "@/db/schema";
import { CAREERS } from "@/lib/catalog";
import { buildRoadmap, computeProgress, loadSnapshot, analyseAgainst, persistAnalysis } from "@/lib/engines";
import { hashPassword } from "@/lib/auth";
import { defaultResumeInput } from "@/lib/resume";
import { deleteFile, storeBuffer } from "@/lib/storage";

export const DEMO_EMAIL = "demo@careernexus.app";
export const DEMO_PASSWORD = "Demo1234!";

let seeding: Promise<void> | null = null;

async function withSeedLock<T>(work: () => Promise<T>): Promise<T> {
  const client = await pool.connect();
  const lockKey = "742019260611";

  try {
    await client.query("SELECT pg_advisory_lock($1::bigint)", [lockKey]);
    return await work();
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1::bigint)", [lockKey]);
    } finally {
      client.release();
    }
  }
}

/** Idempotent bootstrap: catalogue + one rich demo account. */
export async function ensureSeed() {
  if (!seeding) {
    seeding = withSeedLock(run).catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

async function run() {
  await db.execute(sql`select 1`);
  await seedCareers();
  await seedDemoUser();
}

/** Rebuild only the demo account. All other users remain untouched. */
export async function resetDemoAccount() {
  return withSeedLock(async () => {
    await db.execute(sql`select 1`);
    await seedCareers();

    const existing = await db.query.users.findFirst({
      where: eq(users.email, DEMO_EMAIL),
    });

    if (existing) {
      const files = await db
        .select({ storagePath: documents.storagePath })
        .from(documents)
        .where(eq(documents.userId, existing.id));

      if (process.env.CLOUDINARY_URL) {
        for (const file of [...new Set(files.map((item) => item.storagePath))]) {
          try {
            await deleteFile(file);
          } catch (error) {
            console.error("Demo file cleanup failed:", error);
          }
        }
      }

      await db.delete(users).where(eq(users.id, existing.id));
    }

    await seedDemoUser();

    const freshUser = await db.query.users.findFirst({
      where: eq(users.email, DEMO_EMAIL),
    });

    if (!freshUser) {
      throw new Error("Demo account could not be recreated.");
    }

    return freshUser;
  });
}
async function seedCareers() {
  const { careers } = await import("@/db/schema");
  const existing = await db.select({ n: sql<number>`count(*)::int` }).from(careers);
  if ((existing[0]?.n ?? 0) >= CAREERS.length) return;
  for (const career of CAREERS) {
    await db.insert(careers).values(career).onConflictDoNothing();
  }
}

async function makePdf(lines: { text: string; size: number; bold?: boolean; color?: string; gap?: number }[]) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 60 });
    const parts: Buffer[] = [];
    doc.on("data", (c: Buffer) => parts.push(c));
    doc.on("end", () => resolve(Buffer.concat(parts)));
    doc.on("error", reject);
    for (const l of lines) {
      doc.font(l.bold ? "Helvetica-Bold" : "Helvetica").fontSize(l.size).fillColor(l.color ?? "#111827");
      doc.text(l.text, { align: "center", lineGap: 2 });
      if (l.gap) doc.moveDown(l.gap);
    }
    doc.end();
  });
}

async function writeDemoFile(
  userId: string,
  name: string,
  buffer: Buffer,
  ext: "pdf",
) {
  const stored = await storeBuffer(
    userId,
    buffer,
    name,
    "application/pdf",
  );

  return stored.storagePath;
}
async function seedDemoUser() {
  const existing = await db.query.users.findFirst({ where: eq(users.email, DEMO_EMAIL) });
  if (existing) return;

  const [user] = await db
    .insert(users)
    .values({
      email: DEMO_EMAIL,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      fullName: "Amara Okafor",
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    })
    .returning();
  const userId = user.id;

  await db.insert(profiles).values({
    userId,
    headline: "Data Analyst moving into Data Science",
    bio: "Retail analytics specialist with four years turning messy operational data into decisions. I build dashboards execs actually use, and I am now deepening my Python and machine-learning practice to move into a Data Scientist role.",
    phone: "+234 802 555 0148",
    country: "Nigeria",
    city: "Lagos",
    ageRange: "28–34",
    employmentStatus: "Employed full-time",
    educationLevel: "Bachelor's degree",
    institution: "University of Lagos",
    fieldOfStudy: "Statistics",
    graduationYear: "2021",
    currentRole: "Junior Data Analyst",
    yearsExperience: "4 years",
    careerGoal: "Become a Data Scientist in a consumer or fintech company within 12 months, then lead an analytics team.",
    targetCareerId: "data-scientist",
    careerInterests: ["Analysing data", "Research & discovery", "Technology & automation"],
    preferredIndustries: ["Finance & Banking", "Retail & E-commerce", "Technology"],
    learningStyle: "Hands-on projects",
    weeklyHours: 12,
    linkedinUrl: "https://www.linkedin.com/in/amara-okafor-demo",
    githubUrl: "https://github.com/amara-okafor-demo",
    portfolioUrl: "https://amara-okafor.example.com",
    otherLinks: [{ label: "Kaggle", url: "https://www.kaggle.com/amaraokafor" }],
  });

  await db.insert(settings).values({ userId, emailNotifications: true, roadmapReminders: true, aiSuggestions: true });

  const skills: [string, string, string, number, string | null][] = [
    ["SQL", "Database Management", "expert", 4, "Microsoft DA-100"],
    ["Excel", "Data Science", "expert", 4, null],
    ["Data Cleaning", "Data Science", "advanced", 4, null],
    ["Data Visualization", "Data Science", "advanced", 3, null],
    ["Power BI", "Data Science", "advanced", 3, "PL-300"],
    ["Business Intelligence", "Data Science", "intermediate", 3, null],
    ["Statistics", "Data Science", "intermediate", 3, null],
    ["Python", "Programming Languages", "intermediate", 2, null],
    ["Pandas", "Data Science", "beginner", 1, null],
    ["A/B Testing", "Data Science", "beginner", 1, null],
    ["Git", "Software Engineering", "beginner", 1, null],
    ["Communication", "Communication", "advanced", 4, null],
  ];
  await db.insert(userSkills).values(
    skills.map(([name, category, proficiency, yearsExperience, certification]) => ({
      userId,
      name,
      category,
      proficiency,
      yearsExperience,
      certification,
    })),
  );

  await db.insert(userLanguages).values([
    { userId, name: "English", reading: "native", writing: "native", speaking: "native", overall: "native" },
    { userId, name: "Yoruba", reading: "advanced", writing: "intermediate", speaking: "native", overall: "native" },
    { userId, name: "French", reading: "intermediate", writing: "basic", speaking: "conversational", overall: "conversational" },
  ]);

  await db.insert(experiences).values([
    {
      userId,
      role: "Junior Data Analyst",
      company: "BrightPath Retail Group",
      location: "Lagos, Nigeria",
      startDate: "Mar 2022",
      endDate: "",
      isCurrent: true,
      orderIndex: 0,
      description:
        "Own the weekly trading pack for 34 stores; cut reporting prep from 9 hours to 90 minutes.\nBuilt a stock-cover model that reduced out-of-stock lines by 18% across the top 200 SKUs.\nPartner with merchandising on pricing experiments and report results to the commercial director.",
    },
    {
      userId,
      role: "Business Support Officer",
      company: "Lagos State Health Commission",
      location: "Lagos, Nigeria",
      startDate: "Jan 2021",
      endDate: "Feb 2022",
      isCurrent: false,
      orderIndex: 1,
      description:
        "Consolidated facility reporting from 60 clinics into a single dataset.\nIntroduced a data-quality checklist that cut rejected submissions by 41%.",
    },
  ]);

  await db.insert(educations).values([
    {
      userId,
      degree: "BSc Statistics",
      institution: "University of Lagos",
      field: "Statistics",
      startDate: "2017",
      endDate: "2021",
      grade: "Second Class Upper",
      orderIndex: 0,
      description: "Final year project: time-series forecasting of outpatient attendance.",
    },
    {
      userId,
      degree: "West African Senior School Certificate",
      institution: "Federal Government College, Ijanikin",
      field: "Sciences",
      startDate: "2011",
      endDate: "2017",
      grade: "6 A1, 2 B2",
      orderIndex: 1,
    },
  ]);

  const certRows = await db
    .insert(certifications)
    .values([
      { userId, name: "Google Data Analytics Professional Certificate", issuer: "Google / Coursera", issuedAt: "Aug 2023" },
      { userId, name: "Microsoft Power BI Data Analyst (PL-300)", issuer: "Microsoft", issuedAt: "Feb 2024" },
    ])
    .returning();

  await db.insert(projects).values([
    {
      userId,
      name: "Customer churn early-warning dashboard",
      description:
        "Built a Power BI dashboard over 18 months of loyalty data flagging accounts at risk of lapsing. Reduced reporting turnaround from 3 days to same-day and informed a retention campaign that recovered 210 accounts.",
      technologies: ["Power BI", "SQL", "DAX", "Excel"],
      skillsDemonstrated: ["Data Visualization", "SQL", "Business Intelligence"],
      projectUrl: "https://amara-okafor.example.com/churn-dashboard",
      githubUrl: "https://github.com/amara-okafor-demo/churn-dashboard",
      startDate: "Jan 2024",
      endDate: "Apr 2024",
      status: "completed",
      orderIndex: 0,
    },
    {
      userId,
      name: "Delivery time forecasting model",
      description:
        "Trained a gradient-boosting model on 240k delivery records to predict late deliveries 24 hours ahead. Achieved 0.81 AUC against a 0.62 logistic baseline; the logistics team used it to re-sequence three routes.",
      technologies: ["Python", "Pandas", "Scikit-learn", "Jupyter"],
      skillsDemonstrated: ["Python", "Machine Learning", "Statistics"],
      githubUrl: "https://github.com/amara-okafor-demo/delivery-forecast",
      startDate: "Jun 2024",
      endDate: "Sep 2024",
      status: "completed",
      orderIndex: 1,
    },
    {
      userId,
      name: "Pricing A/B experiment analysis",
      description:
        "Designed and analysed a two-week price test across 12 stores. Detected a 2.3% basket-size lift with a 95% confidence interval and wrote the decision memo adopted by the commercial board.",
      technologies: ["SQL", "Python", "Excel"],
      skillsDemonstrated: ["A/B Testing", "Statistics", "Communication"],
      startDate: "Oct 2024",
      status: "in_progress",
      orderIndex: 2,
    },
  ]);

  const certPdf = await makePdf([
    { text: "CERTIFICATE OF ACHIEVEMENT", size: 22, bold: true, color: "#0f766e", gap: 1.4 },
    { text: "This is to certify that", size: 12, gap: 0.6 },
    { text: "Amara Okafor", size: 26, bold: true, gap: 0.8 },
    { text: "successfully completed the", size: 12, gap: 0.4 },
    { text: "Microsoft Power BI Data Analyst (PL-300)", size: 16, bold: true, gap: 1 },
    { text: "Issued February 2024 · Credential ID PL300-8842-AMARA", size: 10, color: "#5b6478", gap: 2 },
    { text: "Demo document generated by Career Nexus for the seeded account.", size: 9, color: "#9aa8c6" },
  ]);
  const certPath = await writeDemoFile(userId, "pl-300-certificate.pdf", certPdf, "pdf");

  const cvPdf = await makePdf([
    { text: "Amara Okafor", size: 24, bold: true, gap: 0.4 },
    { text: "Data Analyst · Lagos, Nigeria", size: 12, color: "#0f766e", gap: 1 },
    { text: "Previously exported résumé (demo file)", size: 10, color: "#5b6478", gap: 1.5 },
    { text: "Four years of retail and public-sector analytics. SQL, Power BI, Python.", size: 11, gap: 1 },
    { text: "Generated by Career Nexus to demonstrate document storage.", size: 9, color: "#9aa8c6" },
  ]);
  const cvPath = await writeDemoFile(userId, "amara-okafor-resume-2024.pdf", cvPdf, "pdf");

  const docs = await db
    .insert(documents)
    .values([
      {
        userId,
        title: "PL-300 Certificate",
        category: "certificate",
        originalName: "pl-300-certificate.pdf",
        storagePath: certPath,
        mimeType: "application/pdf",
        sizeBytes: certPdf.length,
        note: "Microsoft Power BI Data Analyst certification.",
      },
      {
        userId,
        title: "Résumé 2024 (exported)",
        category: "resume",
        originalName: "amara-okafor-resume-2024.pdf",
        storagePath: cvPath,
        mimeType: "application/pdf",
        sizeBytes: cvPdf.length,
      },
      {
        userId,
        title: "BSc Statistics Transcript",
        category: "academic",
        originalName: "transcript.pdf",
        storagePath: certPath,
        mimeType: "application/pdf",
        sizeBytes: certPdf.length,
        note: "University of Lagos — final transcript.",
      },
    ])
    .returning();

  if (certRows[1]) {
    await db.update(certifications).set({ documentId: docs[0].id }).where(eq(certifications.id, certRows[1].id));
  }

  // Real analysis computed from the seeded profile.
  const snapshot = await loadSnapshot(userId);
  const career = CAREERS.find((c) => c.id === "data-scientist")!;
  const result = analyseAgainst(snapshot, career);
  const analysis = await persistAnalysis(userId, result, "rules");

  // Real roadmap generated by the engine, then partially completed.
  const built = await buildRoadmap(userId, {
    careerId: "data-scientist",
    durationDays: 90,
    weeklyHours: 12,
    focus: ["Python", "Machine Learning"],
  });
  await db.update(roadmaps).set({ analysisId: analysis.id }).where(eq(roadmaps.id, built.roadmap.id));

  const tasks = await db.select().from(roadmapTasks).where(eq(roadmapTasks.roadmapId, built.roadmap.id));
  const toComplete = tasks
    .filter((t) => !t.isMilestone)
    .sort((a, b) => a.dueDay - b.dueDay || a.orderIndex - b.orderIndex)
    .slice(0, Math.max(3, Math.round(tasks.length * 0.34)));
  for (const [i, t] of toComplete.entries()) {
    await db
      .update(roadmapTasks)
      .set({ status: "done", completedAt: new Date(Date.now() - (toComplete.length - i) * 86400000 * 2) })
      .where(eq(roadmapTasks.id, t.id));
  }
  const firstPhase = (
    await db.select().from(roadmapPhases).where(eq(roadmapPhases.roadmapId, built.roadmap.id))
  ).sort((a, b) => a.orderIndex - b.orderIndex)[0];
  if (firstPhase) {
    await db
      .update(roadmapTasks)
      .set({ status: "done", completedAt: new Date(Date.now() - 86400000 * 26) })
      .where(and(eq(roadmapTasks.roadmapId, built.roadmap.id), eq(roadmapTasks.isMilestone, true), eq(roadmapTasks.phaseId, firstPhase.id)));
  }
  const refreshed = await db.select().from(roadmapTasks).where(eq(roadmapTasks.roadmapId, built.roadmap.id));
  const progress = computeProgress(refreshed);
  await db.update(roadmaps).set({ nextAction: progress.nextAction }).where(eq(roadmaps.id, built.roadmap.id));

  await db.insert(resumes).values({
    userId,
    ...defaultResumeInput(user),
    title: "Amara Okafor — Data Scientist",
    template: "modern",
    accentColor: "#0f766e",
    summary:
      "Data analyst with four years of retail and public-sector experience, moving into data science. I ship dashboards and models that change decisions — most recently cutting reporting prep by 83% and predicting late deliveries at 0.81 AUC.",
    sections: ["summary", "skills", "experience", "projects", "education", "certifications"],
    extras: {
      achievements: [
        { title: "Reporting automation", detail: "Cut weekly trading-pack prep from 9 hours to 90 minutes across 34 stores." },
        { title: "Stock-cover model", detail: "Reduced out-of-stock lines by 18% on the top 200 SKUs." },
        { title: "Data quality", detail: "Cut rejected clinic submissions by 41% with a new validation checklist." },
      ],
    },
  });

  const [convo] = await db
    .insert(conversations)
    .values({ userId, title: "How do I close my Python gap fastest?" })
    .returning();
  await db.insert(messages).values([
    {
      conversationId: convo.id,
      userId,
      role: "user",
      content: "How do I close my Python gap fastest given I only have 12 hours a week?",
    },
    {
      conversationId: convo.id,
      userId,
      role: "assistant",
      provider: "none",
      content:
        "You already rate expert in SQL and advanced in Power BI, so your fastest route into Python is to keep the work you already do and change only the tool.\n\n1. Port one existing report to Python (pandas + matplotlib). You know the logic, so you are learning syntax, not analysis.\n2. Spend 4 of your 12 weekly hours on deliberate practice: 20 minutes reading, 3 hours writing code.\n3. Add scikit-learn only after pandas feels automatic — your delivery-forecast project shows you can already reason about AUC and baselines.\n4. Record every ported script in Projects so the evidence compounds.\n\nYour readiness for Data Scientist is currently computed at " +
        result.readinessScore +
        "%, with Python and Machine Learning as the highest-priority gaps.",
    },
  ]);

  await db.insert(notifications).values([
    {
      userId,
      type: "success",
      title: "Career analysis ready: Data Scientist",
      body: `${result.readinessScore}% match with ${result.gaps.filter((g) => g.priority === "high").length} high-priority gaps identified.`,
      link: `/analyzer?id=${analysis.id}`,
    },
    {
      userId,
      type: "info",
      title: "Your roadmap is ready",
      body: `${built.roadmap.title}: ${built.taskCount} tasks planned over 90 days at 12 h/week.`,
      link: `/roadmaps/${built.roadmap.id}`,
    },
    {
      userId,
      type: "success",
      title: "Milestone reached",
      body: "Foundation & Baseline is complete — 33% of the roadmap is done.",
      link: `/roadmaps/${built.roadmap.id}`,
      readAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      userId,
      type: "warning",
      title: "Finish your profile",
      body: "Adding a portfolio URL and one more project would raise your profile completeness.",
      link: "/profile",
      readAt: new Date(Date.now() - 86400000 * 6),
    },
  ]);

  await db.insert(activities).values([
    { userId, type: "account", message: "Created a Career Nexus account", createdAt: new Date(Date.now() - 86400000 * 40) },
    { userId, type: "profile", message: "Completed profile details", link: "/profile", createdAt: new Date(Date.now() - 86400000 * 39) },
    { userId, type: "skill", message: "Added 12 skills to your profile", link: "/skills", createdAt: new Date(Date.now() - 86400000 * 38) },
    { userId, type: "document", message: "Uploaded PL-300 Certificate", link: "/documents", createdAt: new Date(Date.now() - 86400000 * 35) },
    { userId, type: "project", message: "Added project: Delivery time forecasting model", link: "/projects", createdAt: new Date(Date.now() - 86400000 * 30) },
    { userId, type: "analysis", message: `Ran a career analysis for Data Scientist — ${result.readinessScore}% ready`, link: "/analyzer", createdAt: new Date(Date.now() - 86400000 * 28) },
    { userId, type: "roadmap", message: `Generated "${built.roadmap.title}"`, link: `/roadmaps/${built.roadmap.id}`, createdAt: new Date(Date.now() - 86400000 * 28) },
    { userId, type: "task", message: `Completed ${progress.done} roadmap tasks`, link: `/roadmaps/${built.roadmap.id}`, createdAt: new Date(Date.now() - 86400000 * 2) },
    { userId, type: "resume", message: "Created résumé: Amara Okafor — Data Scientist", link: "/resume", createdAt: new Date(Date.now() - 86400000) },
  ]);
}
