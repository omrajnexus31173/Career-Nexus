import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  index,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Identity & security                                                 */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    avatarUrl: text("avatar_url"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_uidx").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Only a SHA-256 hash of the opaque cookie token is stored.
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("sessions_token_hash_uidx").on(t.tokenHash),
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ],
);

export const passwordResets = pgTable(
  "password_resets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("password_resets_token_hash_uidx").on(t.tokenHash)],
);

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline"),
  bio: text("bio"),
  phone: text("phone"),
  country: text("country"),
  city: text("city"),
  ageRange: text("age_range"),
  employmentStatus: text("employment_status"),
  educationLevel: text("education_level"),
  institution: text("institution"),
  fieldOfStudy: text("field_of_study"),
  graduationYear: text("graduation_year"),
  currentRole: text("current_role"),
  yearsExperience: text("years_experience"),
  careerGoal: text("career_goal"),
  targetCareerId: text("target_career_id"),
  careerInterests: jsonb("career_interests").$type<string[]>().default([]),
  preferredIndustries: jsonb("preferred_industries").$type<string[]>().default([]),
  learningStyle: text("learning_style"),
  weeklyHours: integer("weekly_hours").default(10),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  portfolioUrl: text("portfolio_url"),
  otherLinks: jsonb("other_links").$type<{ label: string; url: string }[]>().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSkills = pgTable(
  "user_skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    proficiency: text("proficiency").notNull().default("beginner"),
    yearsExperience: integer("years_experience").notNull().default(0),
    certification: text("certification"),
    isCustom: boolean("is_custom").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("user_skills_user_name_uidx").on(t.userId, t.name),
    index("user_skills_user_id_idx").on(t.userId),
  ],
);

export const userLanguages = pgTable(
  "user_languages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    reading: text("reading").notNull().default("intermediate"),
    writing: text("writing").notNull().default("intermediate"),
    speaking: text("speaking").notNull().default("intermediate"),
    overall: text("overall").notNull().default("intermediate"),
    isCustom: boolean("is_custom").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("user_languages_user_name_uidx").on(t.userId, t.name),
    index("user_languages_user_id_idx").on(t.userId),
  ],
);

export const experiences = pgTable(
  "experiences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    company: text("company").notNull(),
    location: text("location"),
    startDate: text("start_date"),
    endDate: text("end_date"),
    isCurrent: boolean("is_current").notNull().default(false),
    description: text("description"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("experiences_user_id_idx").on(t.userId)],
);

export const educations = pgTable(
  "educations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    degree: text("degree").notNull(),
    institution: text("institution").notNull(),
    field: text("field"),
    startDate: text("start_date"),
    endDate: text("end_date"),
    grade: text("grade"),
    description: text("description"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("educations_user_id_idx").on(t.userId)],
);

export const certifications = pgTable(
  "certifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    issuer: text("issuer"),
    issuedAt: text("issued_at"),
    expiresAt: text("expires_at"),
    credentialUrl: text("credential_url"),
    documentId: uuid("document_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("certifications_user_id_idx").on(t.userId)],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    technologies: jsonb("technologies").$type<string[]>().default([]),
    skillsDemonstrated: jsonb("skills_demonstrated").$type<string[]>().default([]),
    projectUrl: text("project_url"),
    githubUrl: text("github_url"),
    startDate: text("start_date"),
    endDate: text("end_date"),
    status: text("status").notNull().default("in_progress"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_user_id_idx").on(t.userId)],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    originalName: text("original_name").notNull(),
    storagePath: text("storage_path").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    category: text("category").notNull().default("other"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("documents_user_id_idx").on(t.userId)],
);

/* ------------------------------------------------------------------ */
/* Career intelligence                                                 */
/* ------------------------------------------------------------------ */

export const careers = pgTable("careers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  family: text("family").notNull(),
  summary: text("summary").notNull(),
  minEducation: text("min_education"),
  coreSkills: jsonb("core_skills").$type<string[]>().default([]),
  bonusSkills: jsonb("bonus_skills").$type<string[]>().default([]),
  certifications: jsonb("certifications").$type<string[]>().default([]),
  projectIdeas: jsonb("project_ideas").$type<{ title: string; detail: string }[]>().default([]),
  opportunities: jsonb("opportunities").$type<string[]>().default([]),
  salaryRange: text("salary_range"),
  outlook: text("outlook"),
});

export const skillCatalog = pgTable(
  "skill_catalog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    isCustom: boolean("is_custom").notNull().default(false),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("skill_catalog_name_uidx").on(t.name)],
);

export const analyses = pgTable(
  "analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    careerId: text("career_id").notNull(),
    careerTitle: text("career_title").notNull(),
    readinessScore: integer("readiness_score").notNull().default(0),
    profileSummary: text("profile_summary").notNull(),
    strengths: jsonb("strengths").$type<{ skill: string; note: string }[]>().default([]),
    gaps: jsonb("gaps").$type<{ skill: string; priority: string; note: string }[]>().default([]),
    recommendedSkills: jsonb("recommended_skills").$type<string[]>().default([]),
    recommendedCertifications: jsonb("recommended_certifications").$type<string[]>().default([]),
    suggestedProjects: jsonb("suggested_projects").$type<{ title: string; detail: string }[]>().default(
      [],
    ),
    opportunities: jsonb("opportunities").$type<string[]>().default([]),
    shortTerm: jsonb("short_term").$type<string[]>().default([]),
    longTerm: jsonb("long_term").$type<string[]>().default([]),
    engine: text("engine").notNull().default("rules"),
    aiInsight: text("ai_insight"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("analyses_user_id_idx").on(t.userId)],
);

export const roadmaps = pgTable(
  "roadmaps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    analysisId: uuid("analysis_id"),
    title: text("title").notNull(),
    careerTitle: text("career_title").notNull(),
    durationDays: integer("duration_days").notNull(),
    weeklyHours: integer("weekly_hours").notNull().default(10),
    status: text("status").notNull().default("active"),
    startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
    nextAction: text("next_action"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("roadmaps_user_id_idx").on(t.userId)],
);

export const roadmapPhases = pgTable(
  "roadmap_phases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roadmapId: uuid("roadmap_id")
      .notNull()
      .references(() => roadmaps.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    objective: text("objective"),
    orderIndex: integer("order_index").notNull().default(0),
    startDay: integer("start_day").notNull().default(1),
    endDay: integer("end_day").notNull().default(1),
  },
  (t) => [index("roadmap_phases_roadmap_id_idx").on(t.roadmapId)],
);

export const roadmapTasks = pgTable(
  "roadmap_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roadmapId: uuid("roadmap_id")
      .notNull()
      .references(() => roadmaps.id, { onDelete: "cascade" }),
    phaseId: uuid("phase_id").references(() => roadmapPhases.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    kind: text("kind").notNull().default("learn"),
    resourceName: text("resource_name"),
    resourceUrl: text("resource_url"),
    priority: text("priority").notNull().default("medium"),
    dueDay: integer("due_day").notNull().default(1),
    estimatedMinutes: integer("estimated_minutes").notNull().default(60),
    orderIndex: integer("order_index").notNull().default(0),
    status: text("status").notNull().default("todo"),
    isCustom: boolean("is_custom").notNull().default(false),
    isMilestone: boolean("is_milestone").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("roadmap_tasks_roadmap_id_idx").on(t.roadmapId),
    index("roadmap_tasks_status_idx").on(t.status),
  ],
);

/* ------------------------------------------------------------------ */
/* Engagement                                                          */
/* ------------------------------------------------------------------ */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("info"),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_id_idx").on(t.userId)],
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    message: text("message").notNull(),
    link: text("link"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activities_user_id_idx").on(t.userId)],
);

export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    template: text("template").notNull().default("classic"),
    accentColor: text("accent_color").notNull().default("#0f766e"),
    summary: text("summary"),
    contact: jsonb("contact").$type<Record<string, string>>().default({}),
    sections: jsonb("sections").$type<string[]>().default([]),
    extras: jsonb("extras").$type<Record<string, { title: string; detail: string }[]>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("resumes_user_id_idx").on(t.userId)],
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("conversations_user_id_idx").on(t.userId)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    provider: text("provider"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_conversation_id_idx").on(t.conversationId)],
);

export const settings = pgTable("settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  roadmapReminders: boolean("roadmap_reminders").notNull().default(true),
  aiSuggestions: boolean("ai_suggestions").notNull().default(true),
  publicProfile: boolean("public_profile").notNull().default(false),
  weeklyDigest: boolean("weekly_digest").notNull().default(false),
  theme: text("theme").notNull().default("light"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type UserSkill = typeof userSkills.$inferSelect;
export type UserLanguage = typeof userLanguages.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type Career = typeof careers.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type Roadmap = typeof roadmaps.$inferSelect;
export type RoadmapPhase = typeof roadmapPhases.$inferSelect;
export type RoadmapTask = typeof roadmapTasks.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Resume = typeof resumes.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Experience = typeof experiences.$inferSelect;
export type Education = typeof educations.$inferSelect;
export type Certification = typeof certifications.$inferSelect;
export type UserSettings = typeof settings.$inferSelect;
