import PDFDocument from "pdfkit";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  certifications,
  educations,
  experiences,
  profiles,
  projects,
  resumes,
  userLanguages,
  userSkills,
  users,
  type Resume,
  type User,
} from "@/db/schema";
import { label } from "@/lib/labels";

export type ResumeData = {
  name: string;
  avatarUrl: string | null;
  headline: string;
  contact: Record<string, string>;
  summary: string;
  template: string;
  accentColor: string;
  sections: string[];
  skills: { name: string; proficiency: string; category: string; years: number }[];
  languages: { name: string; overall: string; speaking: string; reading: string; writing: string }[];
  experience: { role: string; company: string; location: string; start: string; end: string; description: string }[];
  education: { degree: string; institution: string; field: string; start: string; end: string; grade: string }[];
  projects: { name: string; description: string; technologies: string[]; url: string; github: string; status: string }[];
  certifications: { name: string; issuer: string; issuedAt: string; url: string }[];
  achievements: { title: string; detail: string }[];
};

/** Builds the résumé payload from the user's verified rows plus per-résumé overrides. */
export async function resolveResumeData(user: User, resume: Resume): Promise<ResumeData> {
  const [profile, skills, languages, exps, edus, projs, certs] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) }),
    db.select().from(userSkills).where(eq(userSkills.userId, user.id)),
    db.select().from(userLanguages).where(eq(userLanguages.userId, user.id)),
    db.select().from(experiences).where(eq(experiences.userId, user.id)).orderBy(asc(experiences.orderIndex)),
    db.select().from(educations).where(eq(educations.userId, user.id)).orderBy(asc(educations.orderIndex)),
    db.select().from(projects).where(eq(projects.userId, user.id)).orderBy(asc(projects.orderIndex)),
    db.select().from(certifications).where(eq(certifications.userId, user.id)),
  ]);

  const contact: Record<string, string> = {
    email: resume.contact?.email || user.email,
    phone: resume.contact?.phone || profile?.phone || "",
    location: resume.contact?.location || [profile?.city, profile?.country].filter(Boolean).join(", "),
    linkedin: resume.contact?.linkedin || profile?.linkedinUrl || "",
    github: resume.contact?.github || profile?.githubUrl || "",
    portfolio: resume.contact?.portfolio || profile?.portfolioUrl || "",
    ...(resume.contact ?? {}),
  };
  for (const key of Object.keys(contact)) if (!contact[key]) delete contact[key];

  return {
    avatarUrl: user.avatarUrl ? "/api/avatar/file" : null,
    name: user.fullName,
    headline: resume.contact?.headline || profile?.headline || "",
    contact,
    summary: resume.summary || profile?.bio || "",
    template: resume.template,
    accentColor: /^#[0-9a-f]{6}$/i.test(resume.accentColor) ? resume.accentColor : "#0f766e",
    sections: resume.sections?.length ? resume.sections : ["summary", "skills", "experience", "projects", "education", "certifications"],
    skills: skills.map((s) => ({
      name: s.name,
      proficiency: s.proficiency,
      category: s.category,
      years: s.yearsExperience,
    })),
    languages: languages.map((l) => ({
      name: l.name,
      overall: l.overall,
      speaking: l.speaking,
      reading: l.reading,
      writing: l.writing,
    })),
    experience: exps.map((e) => ({
      role: e.role,
      company: e.company,
      location: e.location ?? "",
      start: e.startDate ?? "",
      end: e.isCurrent ? "Present" : e.endDate ?? "",
      description: e.description ?? "",
    })),
    education: edus.map((e) => ({
      degree: e.degree,
      institution: e.institution,
      field: e.field ?? "",
      start: e.startDate ?? "",
      end: e.endDate ?? "",
      grade: e.grade ?? "",
    })),
    projects: projs.map((p) => ({
      name: p.name,
      description: p.description ?? "",
      technologies: p.technologies ?? [],
      url: p.projectUrl ?? "",
      github: p.githubUrl ?? "",
      status: p.status,
    })),
    certifications: certs.map((c) => ({
      name: c.name,
      issuer: c.issuer ?? "",
      issuedAt: c.issuedAt ?? "",
      url: c.credentialUrl ?? "",
    })),
    achievements: (resume.extras?.achievements ?? []).map((a) => ({ title: a.title, detail: a.detail })),
  };
}

const SECTION_TITLES: Record<string, string> = {
  summary: "Professional Summary",
  skills: "Skills",
  experience: "Work Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
  languages: "Languages",
  achievements: "Achievements",
};

/** Renders a real, paginated PDF from the resolved data. */
export function renderResumePdf(
  data: ResumeData,
  title: string,
  avatarBuffer?: Buffer,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const accent = data.accentColor;
      const ink = "#111827";
      const muted = "#5b6478";
      const isModern = data.template === "modern";
      const isCompact = data.template === "compact";

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: isModern ? 0 : 44, bottom: 44, left: isModern ? 0 : 48, right: isModern ? 0 : 48 },
        info: { Title: title, Author: data.name, Creator: "Career Nexus", Producer: "Career Nexus Résumé Builder" },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const rail = isModern ? 190 : 0;
      const left = isModern ? rail + 40 : doc.page.margins.left;
      const right = pageW - (isModern ? 40 : doc.page.margins.right);
      const width = right - left;

      const ensure = (needed: number) => {
        if (doc.y + needed > pageH - doc.page.margins.bottom) {
          doc.addPage();
          doc.y = isModern ? 48 : doc.page.margins.top;
        }
      };

      const heading = (text: string) => {
        ensure(38);
        doc.moveDown(0.7);
        doc.font("Helvetica-Bold").fontSize(isCompact ? 10.5 : 11).fillColor(accent).text(text.toUpperCase(), left, doc.y, {
          width,
          characterSpacing: 1.1,
        });
        const y = doc.y + 2;
        doc.moveTo(left, y).lineTo(right, y).lineWidth(0.8).strokeColor(isCompact ? "#e5e7eb" : accent).stroke();
        doc.y = y + 8;
      };

      const bullet = (text: string) => {
        ensure(20);
        doc.font("Helvetica").fontSize(isCompact ? 9 : 9.8).fillColor(ink).text(`•  ${text}`, left + 4, doc.y, {
          width: width - 4,
          lineGap: 1.6,
        });
      };

      /* ---------------- header ---------------- */
      if (isModern) {
        doc.rect(0, 0, rail, pageH).fill("#0d1220");
        doc.rect(rail, 0, 6, pageH).fill(accent);
        let ry = 56;
        const avatarX = rail / 2 - 34;
        const avatarY = ry - 8;
        const initials = data.name
          .split(" ")
          .map((p) => p[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("");

        if (avatarBuffer) {
          try {
            doc.save();
            doc.circle(rail / 2, ry + 26, 34).clip();
            doc.image(avatarBuffer, avatarX, avatarY, {
              cover: [68, 68],
              align: "center",
              valign: "center",
            });
            doc.restore();
            doc.circle(rail / 2, ry + 26, 34)
              .lineWidth(2)
              .strokeColor(accent)
              .stroke();
          } catch {
            doc.restore();
            doc.circle(rail / 2, ry + 26, 34).fill(accent);
            doc.font("Helvetica-Bold").fontSize(26).fillColor("#ffffff")
              .text(initials, avatarX, ry + 12, { width: 68, align: "center" });
          }
        } else {
          doc.circle(rail / 2, ry + 26, 34).fill(accent);
          doc.font("Helvetica-Bold").fontSize(26).fillColor("#ffffff")
            .text(initials, avatarX, ry + 12, { width: 68, align: "center" });
        }
        ry += 92;
        doc.font("Helvetica-Bold").fontSize(15).fillColor("#ffffff").text(data.name, 22, ry, { width: rail - 44 });
        ry = doc.y + 4;
        if (data.headline) {
          doc.font("Helvetica").fontSize(9.5).fillColor("#9fb0c9").text(data.headline, 22, ry, { width: rail - 44 });
          ry = doc.y + 14;
        }
        doc.moveTo(22, ry).lineTo(rail - 22, ry).lineWidth(0.8).strokeColor("#2b3550").stroke();
        ry += 14;
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(accent).text("CONTACT", 22, ry, {
          width: rail - 44,
          characterSpacing: 1,
        });
        ry = doc.y + 6;
        doc.font("Helvetica").fontSize(8.5).fillColor("#c9d3e4");
        for (const [key, value] of Object.entries(data.contact)) {
          doc.text(`${label(key)}: ${value}`, 22, ry, { width: rail - 44, lineGap: 1 });
          ry = doc.y + 4;
        }
        if (data.languages.length) {
          ry += 10;
          doc.font("Helvetica-Bold").fontSize(8.5).fillColor(accent).text("LANGUAGES", 22, ry, {
            width: rail - 44,
            characterSpacing: 1,
          });
          ry = doc.y + 6;
          doc.font("Helvetica").fontSize(8.5).fillColor("#c9d3e4");
          for (const l of data.languages) {
            doc.text(`${l.name} — ${label(l.overall)}`, 22, ry, { width: rail - 44 });
            ry = doc.y + 3;
          }
        }
        doc.y = 56;
      } else {
        doc.font("Helvetica-Bold").fontSize(isCompact ? 20 : 24).fillColor(ink).text(data.name, left, doc.y, { width });
        if (data.headline) {
          doc.moveDown(0.15);
          doc.font("Helvetica").fontSize(isCompact ? 10 : 11).fillColor(accent).text(data.headline, left, doc.y, { width });
        }
        doc.moveDown(0.4);
        const contactLine = Object.entries(data.contact)
          .map(([k, v]) => (k === "email" || k === "phone" ? v : `${label(k)}: ${v}`))
          .join("   |   ");
        doc.font("Helvetica").fontSize(isCompact ? 8.5 : 9.2).fillColor(muted).text(contactLine, left, doc.y, { width });
        doc.moveDown(0.3);
        doc.moveTo(left, doc.y + 4).lineTo(right, doc.y + 4).lineWidth(1.2).strokeColor(accent).stroke();
        doc.y += 14;
      }

      /* ---------------- body ---------------- */
      for (const key of data.sections) {
        const name = SECTION_TITLES[key] ?? label(key);
        if (key === "summary") {
          if (!data.summary) continue;
          heading(name);
          ensure(30);
          doc.font("Helvetica").fontSize(isCompact ? 9.4 : 10).fillColor(ink).text(data.summary, left, doc.y, {
            width,
            lineGap: 2,
            align: "justify",
          });
        } else if (key === "skills") {
          if (!data.skills.length) continue;
          heading(name);
          const grouped = new Map<string, string[]>();
          for (const s of data.skills) {
            const list = grouped.get(s.category) ?? [];
            list.push(`${s.name} (${label(s.proficiency)})`);
            grouped.set(s.category, list);
          }
          for (const [category, list] of grouped) {
            ensure(22);
            doc.font("Helvetica-Bold").fontSize(isCompact ? 8.8 : 9.4).fillColor(ink).text(`${category}: `, left, doc.y, {
              continued: true,
            });
            doc.font("Helvetica").fillColor(muted).text(list.join(", "), { width, lineGap: 1.6 });
            doc.moveDown(0.25);
          }
        } else if (key === "experience") {
          if (!data.experience.length) continue;
          heading(name);
          for (const e of data.experience) {
            ensure(46);
            doc.font("Helvetica-Bold").fontSize(isCompact ? 10 : 10.6).fillColor(ink).text(e.role, left, doc.y, {
              width: width * 0.62,
              continued: false,
            });
            doc
              .font("Helvetica")
              .fontSize(isCompact ? 8.6 : 9)
              .fillColor(muted)
              .text([e.start, e.end].filter(Boolean).join(" – "), left + width * 0.62, doc.y - 12, {
                width: width * 0.38,
                align: "right",
              });
            doc.font("Helvetica-Oblique").fontSize(isCompact ? 9 : 9.4).fillColor(accent)
              .text([e.company, e.location].filter(Boolean).join(" · "), left, doc.y, { width });
            if (e.description) {
              for (const line of e.description.split("\n").filter(Boolean)) bullet(line);
            }
            doc.moveDown(0.45);
          }
        } else if (key === "projects") {
          if (!data.projects.length) continue;
          heading(name);
          for (const p of data.projects) {
            ensure(40);
            doc.font("Helvetica-Bold").fontSize(isCompact ? 9.8 : 10.4).fillColor(ink).text(p.name, left, doc.y, { width });
            if (p.description) bullet(p.description);
            if (p.technologies.length) bullet(`Technologies: ${p.technologies.join(", ")}`);
            const links = [p.url, p.github].filter(Boolean);
            if (links.length) bullet(`Link: ${links.join(" · ")}`);
            doc.moveDown(0.35);
          }
        } else if (key === "education") {
          if (!data.education.length) continue;
          heading(name);
          for (const e of data.education) {
            ensure(34);
            doc.font("Helvetica-Bold").fontSize(isCompact ? 9.8 : 10.4).fillColor(ink).text(e.degree, left, doc.y, { width });
            doc
              .font("Helvetica")
              .fontSize(isCompact ? 8.8 : 9.2)
              .fillColor(muted)
              .text(
                [e.institution, e.field, [e.start, e.end].filter(Boolean).join(" – "), e.grade].filter(Boolean).join(" · "),
                left,
                doc.y,
                { width },
              );
            doc.moveDown(0.35);
          }
        } else if (key === "certifications") {
          if (!data.certifications.length) continue;
          heading(name);
          for (const c of data.certifications) {
            bullet([c.name, c.issuer, c.issuedAt].filter(Boolean).join(" — "));
          }
        } else if (key === "languages") {
          if (isModern || !data.languages.length) continue;
          heading(name);
          bullet(data.languages.map((l) => `${l.name} (${label(l.overall)})`).join(" · "));
        } else if (key === "achievements") {
          if (!data.achievements.length) continue;
          heading(name);
          for (const a of data.achievements) bullet(a.detail ? `${a.title} — ${a.detail}` : a.title);
        }
      }

      doc.fillColor(muted).font("Helvetica").fontSize(7.5);
      const footerY = pageH - 34;
      doc.text(`Generated by Career Nexus · ${new Date().toLocaleDateString("en-GB")}`, left, footerY, { width });
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export const RESUME_TEMPLATES = [
  { id: "classic", name: "Classic", description: "Centred header, single column — the safest choice for ATS parsing." },
  { id: "modern", name: "Modern", description: "Dark contact rail with an accent spine. Strong for design and product roles." },
  { id: "compact", name: "Compact", description: "Tighter type and spacing to fit more evidence on one page." },
] as const;

export function defaultResumeInput(user: User) {
  return {
    title: `${user.fullName} — Résumé`,
    template: "classic" as const,
    accentColor: "#0f766e",
    sections: ["summary", "skills", "experience", "projects", "education", "certifications"],
  };
}

export { resumes as resumeTable };
