import { z } from "zod";

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const url = (label: string) =>
  z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\/.+\..+/i.test(v), {
      message: `${label} must be a valid http(s) URL.`,
    })
    .optional()
    .or(z.literal(""));

export const proficiency = z.enum(["beginner", "intermediate", "advanced", "expert"]);
export const languageLevel = z.enum(["basic", "conversational", "intermediate", "advanced", "native"]);

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().toLowerCase().max(180).refine((v) => EMAIL.test(v), "Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128)
    .refine((v) => /[a-z]/.test(v) && /[A-Z0-9]/.test(v), "Use at least 8 characters with a mix of letters and numbers."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(180),
  password: z.string().min(1, "Enter your password.").max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().max(180),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});


export const profileSchema = z.object({
  headline: z.string().trim().max(160).nullish(),
  bio: z.string().trim().max(4000).nullish(),
  phone: z.string().trim().max(40).nullish(),
  country: z.string().trim().max(80).nullish(),
  city: z.string().trim().max(80).nullish(),
  ageRange: z.string().trim().max(30).nullish(),
  employmentStatus: z.string().trim().max(120).nullish(),
  educationLevel: z.string().trim().max(80).nullish(),
  institution: z.string().trim().max(140).nullish(),
  fieldOfStudy: z.string().trim().max(140).nullish(),
  graduationYear: z.string().trim().max(10).nullish(),
  currentRole: z.string().trim().max(120).nullish(),
  yearsExperience: z.string().trim().max(40).nullish(),
  careerGoal: z.string().trim().max(400).nullish(),
  targetCareerId: z.string().trim().max(80).nullish(),
  careerInterests: z.array(z.string().trim().max(150)).max(30).nullish(),
  preferredIndustries: z.array(z.string().trim().max(150)).max(30).nullish(),
  learningStyle: z.string().trim().max(100).nullish(),
  weeklyHours: z.coerce.number().int().min(1).max(80).nullish(),
  linkedinUrl: url("LinkedIn URL").nullish(),
  githubUrl: url("GitHub URL").nullish(),
  portfolioUrl: url("Portfolio URL").nullish(),
  otherLinks: z.array(
    z.object({
      label: z.string().trim().max(40),
      url: z.string().trim().max(500),
    })
  ).max(6).nullish(),
});


export const settingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  roadmapReminders: z.boolean().optional(),
  aiSuggestions: z.boolean().optional(),
  publicProfile: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
});

export const skillSchema = z.object({
  name: z.string().trim().min(1, "Skill name is required.").max(80),
  category: z.string().trim().min(1, "Pick a category.").max(80),
  proficiency: proficiency.default("beginner"),
  yearsExperience: z.coerce.number().int().min(0).max(60).default(0),
  certification: z.string().trim().max(160).optional(),
  isCustom: z.boolean().default(false),
});

export const languageSchema = z.object({
  name: z.string().trim().min(1, "Language name is required.").max(80),
  reading: languageLevel.default("intermediate"),
  writing: languageLevel.default("intermediate"),
  speaking: languageLevel.default("intermediate"),
  overall: languageLevel.default("intermediate"),
  isCustom: z.boolean().default(false),
});

export const experienceSchema = z.object({
  role: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(140),
  location: z.string().trim().max(120).optional(),
  startDate: z.string().trim().max(20).optional(),
  endDate: z.string().trim().max(20).optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().trim().max(2000).optional(),
  orderIndex: z.coerce.number().int().min(0).max(100).default(0),
});

export const educationSchema = z.object({
  degree: z.string().trim().min(1).max(140),
  institution: z.string().trim().min(1).max(160),
  field: z.string().trim().max(140).optional(),
  startDate: z.string().trim().max(20).optional(),
  endDate: z.string().trim().max(20).optional(),
  grade: z.string().trim().max(60).optional(),
  description: z.string().trim().max(2000).optional(),
  orderIndex: z.coerce.number().int().min(0).max(100).default(0),
});

export const certificationSchema = z.object({
  name: z.string().trim().min(1).max(160),
  issuer: z.string().trim().max(140).optional(),
  issuedAt: z.string().trim().max(20).optional(),
  expiresAt: z.string().trim().max(20).optional(),
  credentialUrl: z.string().trim().max(500).optional(),
});

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(160),
  description: z.string().trim().max(4000).optional(),
  technologies: z.array(z.string().trim().max(60)).max(30).default([]),
  skillsDemonstrated: z.array(z.string().trim().max(60)).max(30).default([]),
  projectUrl: z.string().trim().max(500).optional(),
  githubUrl: z.string().trim().max(500).optional(),
  startDate: z.string().trim().max(20).optional(),
  endDate: z.string().trim().max(20).optional(),
  status: z.enum(["planned", "in_progress", "completed", "archived"]).default("in_progress"),
});

export const analysisSchema = z.object({
  careerId: z.string().trim().min(1).max(80),
  useAi: z.boolean().default(false),
});

export const roadmapSchema = z.object({
  careerId: z.string().trim().min(1).max(80).optional(),
  title: z.string().trim().max(160).optional(),
  durationDays: z.union([z.literal(30), z.literal(60), z.literal(90), z.literal(100), z.literal(180), z.literal(365)]),
  weeklyHours: z.coerce.number().int().min(1).max(60).default(10),
  focus: z.array(z.string().trim().max(60)).max(20).default([]),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  kind: z.enum(["learn", "practice", "project", "assessment", "milestone"]).default("learn"),
  resourceName: z.string().trim().max(160).optional(),
  resourceUrl: z.string().trim().max(500).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDay: z.coerce.number().int().min(1).max(365).default(1),
  estimatedMinutes: z.coerce.number().int().min(5).max(1440).default(60),
  phaseId: z.string().uuid().optional().nullable(),
});

export const taskPatchSchema = taskSchema.partial().extend({
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});

export const roadmapPatchSchema = z.object({
  status: z.enum(["active", "paused", "completed", "archived"]).optional(),
  title: z.string().trim().max(160).optional(),
});

export const resumeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  template: z.enum(["classic", "modern", "compact"]).default("classic"),
  accentColor: z.string().trim().max(9).default("#0f766e"),
  summary: z.string().trim().max(2000).optional(),
  contact: z.record(z.string(), z.string().max(200)).default({}),
  sections: z.array(z.enum(["summary", "skills", "experience", "projects", "education", "certifications", "languages", "achievements"])).default(["summary", "skills", "experience", "projects", "education", "certifications"]),
  extras: z
    .record(z.string(), z.array(z.object({ title: z.string().max(200), detail: z.string().max(600) })))
    .default({}),
});

export const chatSchema = z.object({
  conversationId: z.string().uuid().optional().nullable(),
  message: z.string().trim().min(1, "Write a message first.").max(4000),
});

export const notificationPatchSchema = z.object({
  read: z.boolean().default(true),
});
