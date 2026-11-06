import { desc, eq, and, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  certifications,
  documents,
  notifications,
  profiles,
  projects,
  resumes,
  roadmaps,
  roadmapTasks,
  settings,
  userLanguages,
  userSkills,
  users,
  experiences,
  educations,
  type User,
  type Profile,
} from "@/db/schema";

export async function recordActivity(
  userId: string,
  type: string,
  message: string,
  link?: string,
) {
  await db.insert(activities).values({ userId, type, message, link: link ?? null });
}

export async function notify(
  userId: string,
  payload: { type?: string; title: string; body?: string; link?: string },
) {
  await db.insert(notifications).values({
    userId,
    type: payload.type ?? "info",
    title: payload.title,
    body: payload.body ?? null,
    link: payload.link ?? null,
  });
}

export async function recentActivity(userId: string, limit = 8) {
  return db
    .select()
    .from(activities)
    .where(eq(activities.userId, userId))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}

export async function listNotifications(userId: string, limit = 30) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function unreadCount(userId: string) {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return rows[0]?.n ?? 0;
}

export type CompletionState = {
  percent: number;
  completed: string[];
  missing: { label: string; link: string }[];
};

/** Profile completion is computed from the real stored rows, never a hardcoded number. */
export function computeCompletion(
  user: User,
  profile: Profile | undefined,
  counts: {
    skills: number;
    languages: number;
    projects: number;
    certifications: number;
    experiences: number;
    educations: number;
    documents: number;
    resumes: number;
    roadmaps: number;
  },
): CompletionState {
  const checks: { label: string; link: string; done: boolean }[] = [
    { label: "Full name", link: "/profile", done: Boolean(user.fullName?.trim()) },
    { label: "Professional headline", link: "/profile", done: Boolean(profile?.headline?.trim()) },
    { label: "Professional summary", link: "/profile", done: (profile?.bio?.trim().length ?? 0) > 40 },
    { label: "Country and city", link: "/profile", done: Boolean(profile?.country && profile?.city) },
    { label: "Education level", link: "/profile", done: Boolean(profile?.educationLevel) },
    { label: "Current role or status", link: "/profile", done: Boolean(profile?.currentRole || profile?.employmentStatus) },
    { label: "Career goal", link: "/profile", done: Boolean(profile?.careerGoal?.trim()) },
    { label: "Target career selected", link: "/analyzer", done: Boolean(profile?.targetCareerId) },
    { label: "Career interests", link: "/profile", done: (profile?.careerInterests?.length ?? 0) > 0 },
    { label: "Preferred industries", link: "/profile", done: (profile?.preferredIndustries?.length ?? 0) > 0 },
    { label: "Weekly study hours", link: "/profile", done: Boolean(profile?.weeklyHours) },
    { label: "At least 5 skills", link: "/skills", done: counts.skills >= 5 },
    { label: "At least 1 language", link: "/skills", done: counts.languages >= 1 },
    { label: "At least 1 project", link: "/projects", done: counts.projects >= 1 },
    { label: "Education history", link: "/profile", done: counts.educations >= 1 },
    { label: "Work experience", link: "/profile", done: counts.experiences >= 1 },
    { label: "A certification", link: "/documents", done: counts.certifications >= 1 },
    { label: "An uploaded document", link: "/documents", done: counts.documents >= 1 },
    { label: "A LinkedIn or portfolio link", link: "/profile", done: Boolean(profile?.linkedinUrl || profile?.portfolioUrl || profile?.githubUrl) },
    { label: "A saved résumé", link: "/resume", done: counts.resumes >= 1 },
    { label: "An active roadmap", link: "/roadmaps", done: counts.roadmaps >= 1 },
  ];

  const done = checks.filter((c) => c.done);
  const percent = Math.round((done.length / checks.length) * 100);
  const seen = new Set<string>();
  const missing = checks
    .filter((c) => !c.done)
    .filter((c) => (seen.has(c.link + c.label) ? false : (seen.add(c.link + c.label), true)))
    .map((c) => ({ label: c.label, link: c.link }));

  return { percent, completed: done.map((d) => d.label), missing };
}

export async function loadCounts(userId: string) {
  const [counts] = await db
    .select({
      skills: sql<number>`(select count(*)::int from ${userSkills} where ${userSkills.userId} = ${userId})`,
      languages: sql<number>`(select count(*)::int from ${userLanguages} where ${userLanguages.userId} = ${userId})`,
      projects: sql<number>`(select count(*)::int from ${projects} where ${projects.userId} = ${userId})`,
      certifications: sql<number>`(select count(*)::int from ${certifications} where ${certifications.userId} = ${userId})`,
      experiences: sql<number>`(select count(*)::int from ${experiences} where ${experiences.userId} = ${userId})`,
      educations: sql<number>`(select count(*)::int from ${educations} where ${educations.userId} = ${userId})`,
      documents: sql<number>`(select count(*)::int from ${documents} where ${documents.userId} = ${userId})`,
      resumes: sql<number>`(select count(*)::int from ${resumes} where ${resumes.userId} = ${userId})`,
      roadmaps: sql<number>`(select count(*)::int from ${roadmaps} where ${roadmaps.userId} = ${userId})`,
    })
    .from(users)
    .where(eq(users.id, userId));

  return {
    skills: counts?.skills ?? 0,
    languages: counts?.languages ?? 0,
    projects: counts?.projects ?? 0,
    certifications: counts?.certifications ?? 0,
    experiences: counts?.experiences ?? 0,
    educations: counts?.educations ?? 0,
    documents: counts?.documents ?? 0,
    resumes: counts?.resumes ?? 0,
    roadmaps: counts?.roadmaps ?? 0,
  };
}

export async function taskCounts(userId: string) {
  const rows = await db
    .select({
      total: sql<number>`count(*)::int`,
      done: sql<number>`count(*) filter (where ${roadmapTasks.status} = 'done')::int`,
    })
    .from(roadmapTasks)
    .innerJoin(roadmaps, eq(roadmaps.id, roadmapTasks.roadmapId))
    .where(eq(roadmaps.userId, userId));
  return { total: rows[0]?.total ?? 0, done: rows[0]?.done ?? 0 };
}

export async function ensureSettings(userId: string) {
  const existing = await db.query.settings.findFirst({ where: eq(settings.userId, userId) });
  if (existing) return existing;
  const [row] = await db.insert(settings).values({ userId }).returning();
  return row;
}
