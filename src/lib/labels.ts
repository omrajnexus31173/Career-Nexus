/** Shared, runtime-agnostic formatting helpers (safe to import from server and client code). */

export const CAPITALIZE: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
  basic: "Basic",
  conversational: "Conversational",
  native: "Native",
  todo: "To do",
  in_progress: "In progress",
  done: "Complete",
  planned: "Planned",
  completed: "Completed",
  archived: "Archived",
  active: "Active",
  paused: "Paused",
  learn: "Learn",
  practice: "Practice",
  project: "Project",
  assessment: "Assessment",
  milestone: "Milestone",
  low: "Low",
  medium: "Medium",
  high: "High",
  certificate: "Certificate",
  resume: "Résumé",
  portfolio: "Portfolio",
  academic: "Academic",
  other: "Other",
  email: "Email",
  phone: "Phone",
  location: "Location",
  linkedin: "LinkedIn",
  github: "GitHub",
  portfolioUrl: "Portfolio",
};

export function label(value?: string | null) {
  if (!value) return "—";
  if (CAPITALIZE[value]) return CAPITALIZE[value];
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

export function relativeTime(value?: string | Date | null) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
