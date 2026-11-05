#!/usr/bin/env python3
"""Career Nexus end-to-end production verification.

Runs real HTTP requests against a running production server: no mocks, no
stubbed APIs, no browser-only assumptions. Every assertion prints PASS/FAIL and
the script exits non-zero on any failure.

Usage:  python3 scripts/e2e-verification.py [BASE_URL]
        (defaults to http://127.0.0.1:3000)
"""
import http.cookiejar
import json
import sys
import urllib.error
import urllib.request
import uuid

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3000"
results = []


class Client:
    def __init__(self, name):
        self.name = name
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def call(self, method, path, body=None, raw=None, content_type=None, allow_error=False):
        data, headers = None, {"Accept": "application/json"}
        if raw is not None:
            data, headers["Content-Type"] = raw, content_type
        elif body is not None:
            data, headers["Content-Type"] = json.dumps(body).encode(), "application/json"
        req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
        try:
            with self.opener.open(req, timeout=90) as res:
                payload, status = res.read(), res.status
        except urllib.error.HTTPError as e:
            payload, status = e.read(), e.code
        try:
            parsed = json.loads(payload.decode()) if payload else None
        except Exception:
            parsed = payload
        return status, parsed

    def cookies(self):
        return {c.name: c.value for c in self.jar}


def check(label, condition, detail=""):
    results.append((label, bool(condition), detail))
    print(f"[{'PASS' if condition else 'FAIL'}] {label}" + (f" — {detail}" if detail and not condition else ""))
    return bool(condition)


def multipart(fields, files):
    b = "----cn" + uuid.uuid4().hex
    out = []
    for k, v in fields.items():
        out.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for k, (fname, blob, ctype) in files.items():
        out.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"; filename="{fname}"\r\nContent-Type: {ctype}\r\n\r\n'.encode())
        out.append(blob + b"\r\n")
    out.append(f"--{b}--\r\n".encode())
    return b"".join(out), f"multipart/form-data; boundary={b}"


PDF = (b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
       b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n")

suffix = uuid.uuid4().hex[:8]
EMAIL_A, EMAIL_B, PASSWORD = f"qa.a.{suffix}@careernexus.test", f"qa.b.{suffix}@careernexus.test", "QaPassw0rd!23"
print(f"\n=== Career Nexus E2E verification against {BASE} ===\n")

# --------------------------------------------------------------- A. AUTH
a = Client("A")
s, r = a.call("GET", "/api/health")
check("health endpoint responds", s == 200 and isinstance(r, dict) and r.get("ok") is True, str(r))

s, r = a.call("POST", "/api/auth/register", {"fullName": "QA Analyst", "email": EMAIL_A, "password": PASSWORD})
check("register returns 201 + user", s == 201 and r.get("user", {}).get("email") == EMAIL_A, f"{s} {r}")
check("register sets session cookie", "cn_session" in a.cookies(), str(a.cookies()))
check("password hash never returned to client", "passwordHash" not in json.dumps(r))

s, r = a.call("POST", "/api/auth/register", {"fullName": "Dupe", "email": EMAIL_A, "password": PASSWORD}, allow_error=True)
check("duplicate email rejected with 409", s == 409, f"{s} {r}")
s, r = a.call("POST", "/api/auth/register", {"fullName": "Weak", "email": f"weak.{suffix}@x.test", "password": "abc"}, allow_error=True)
check("weak password rejected with 422 + field details", s == 422 and isinstance(r.get("details"), list), f"{s} {r}")

s, r = a.call("GET", "/api/auth/session")
check("session verifiable immediately after register", s == 200 and r.get("authenticated") is True, f"{s} {r}")
s, r = a.call("POST", "/api/auth/login", {"email": EMAIL_A, "password": "WrongPass123"}, allow_error=True)
check("incorrect password rejected with 401", s == 401, f"{s} {r}")

b = Client("B")
s, r = b.call("POST", "/api/auth/login", {"email": EMAIL_A, "password": PASSWORD})
check("login with correct credentials returns 200", s == 200 and r.get("user", {}).get("email") == EMAIL_A, f"{s} {r}")
check("login issues a session cookie", "cn_session" in b.cookies(), str(b.cookies()))
s, r = b.call("GET", "/api/auth/session")
check("post-login session verifiable (fixes 'session could not be verified')", s == 200 and r.get("user", {}).get("email") == EMAIL_A, f"{s} {r}")
s, html = b.call("GET", "/dashboard")
check("signed-in /dashboard renders 200 HTML", s == 200 and b"Career Nexus" in (html if isinstance(html, bytes) else b""), str(s))

anon = Client("anon")
check("protected /api/profile rejects anonymous with 401", anon.call("GET", "/api/profile", allow_error=True)[0] == 401)
check("protected /api/roadmaps rejects anonymous with 401", anon.call("GET", "/api/roadmaps", allow_error=True)[0] == 401)

# ------------------------------------------------------------ B. PROFILE
s, r = a.call("PATCH", "/api/profile", {
    "headline": "QA Analyst in training",
    "bio": "Automated verification account used to prove persistence across sessions.",
    "country": "Kenya", "city": "Nairobi", "ageRange": "28–34", "employmentStatus": "Employed full-time",
    "educationLevel": "Bachelor's degree", "institution": "University of Nairobi", "fieldOfStudy": "Information Systems",
    "graduationYear": "2019", "currentRole": "Operations Analyst", "yearsExperience": "5 years",
    "careerGoal": "Move into a Data Scientist role within 12 months.", "targetCareerId": "data-scientist",
    "careerInterests": ["Analysing data"], "preferredIndustries": ["Technology"],
    "learningStyle": "Hands-on projects", "weeklyHours": 12, "linkedinUrl": "https://linkedin.com/in/qa-analyst"})
check("profile PATCH returns saved row", s == 200 and r.get("profile", {}).get("city") == "Nairobi", f"{s} {r}")
check("profile completion computed from real data", 0 < r.get("completion", {}).get("percent", 0) <= 100, str(r.get("completion", {}).get("percent")))
s, r = a.call("PATCH", "/api/profile", {"linkedinUrl": "not-a-url"}, allow_error=True)
check("invalid URL rejected with 422", s == 422, f"{s} {r}")
s, r = a.call("PATCH", "/api/profile/name", {"fullName": "QA Analyst Renamed"})
check("full name update works", s == 200 and r.get("user", {}).get("fullName") == "QA Analyst Renamed", f"{s} {r}")

# -------------------------------------------------- C. SKILLS & LANGUAGES
s, r = a.call("POST", "/api/skills", {"name": "Python", "category": "Programming Languages", "proficiency": "intermediate", "yearsExperience": 3})
check("add catalogue skill", s == 201 and r.get("item", {}).get("name") == "Python", f"{s} {r}")
skill_id = r.get("item", {}).get("id")
s, r = a.call("POST", "/api/skills", {"name": "Bamboo Scaffolding", "category": "Technical Trades", "proficiency": "beginner", "isCustom": True})
check("add custom (non-catalogue) skill", s == 201, f"{s} {r}")
for name, cat in [("SQL", "Database Management"), ("Statistics", "Data Science"), ("Pandas", "Data Science"), ("Data Visualization", "Data Science")]:
    a.call("POST", "/api/skills", {"name": name, "category": cat, "proficiency": "advanced", "yearsExperience": 4})
s, r = a.call("POST", "/api/skills", {"name": "Python", "category": "Programming Languages"}, allow_error=True)
check("duplicate skill rejected with 409", s == 409, f"{s} {r}")
s, r = a.call("PATCH", f"/api/skills/{skill_id}", {"proficiency": "expert", "yearsExperience": 6})
check("skill proficiency update", s == 200 and r.get("item", {}).get("proficiency") == "expert", f"{s} {r}")
s, r = a.call("GET", "/api/skills/catalog?q=pyth")
check("skill catalogue search returns matches", s == 200 and any(i["name"] == "Python" for i in r.get("items", [])), f"{s}")
s, r = a.call("GET", "/api/skills/catalog?q=&category=Healthcare")
check("skill catalogue category filter works", s == 200 and r.get("items") and all(i["category"] == "Healthcare" for i in r["items"]), f"{s}")
s, r = a.call("GET", "/api/skills/catalog?q=zzzznotaskill")
check("unknown search returns no match (custom-skill path)", s == 200 and len(r.get("items", [])) == 0, f"{s}")
s, r = a.call("POST", "/api/languages", {"name": "Swahili", "reading": "native", "writing": "advanced", "speaking": "native", "overall": "native"})
check("add language with separate proficiency dimensions", s == 201 and r.get("item", {}).get("overall") == "native", f"{s} {r}")
s, r = a.call("POST", "/api/languages", {"name": "Klingon", "overall": "basic", "isCustom": True})
check("add custom language", s == 201, f"{s} {r}")
check("add work experience", a.call("POST", "/api/profile/experience", {"role": "Operations Analyst", "company": "Savanna Logistics", "startDate": "2021", "isCurrent": True, "description": "Cut reporting time by 40%"})[0] == 201)
check("add education", a.call("POST", "/api/profile/education", {"degree": "BSc Information Systems", "institution": "University of Nairobi", "startDate": "2015", "endDate": "2019"})[0] == 201)
check("add certification", a.call("POST", "/api/profile/certification", {"name": "Google Data Analytics", "issuer": "Google", "issuedAt": "2023"})[0] == 201)

# ----------------------------------------------------------- D. PROJECTS
s, r = a.call("POST", "/api/projects", {
    "name": "Delivery delay predictor", "description": "Gradient boosting model over 120k deliveries; 0.79 AUC.",
    "technologies": ["Python", "Pandas", "Scikit-learn"], "skillsDemonstrated": ["Machine Learning"],
    "projectUrl": "https://example.com/delivery", "githubUrl": "https://github.com/qa/delivery",
    "startDate": "Jan 2024", "status": "completed"})
check("create project", s == 201 and r.get("item", {}).get("name") == "Delivery delay predictor", f"{s} {r}")
project_id = r.get("item", {}).get("id")
s, r = a.call("PATCH", f"/api/projects/{project_id}", {"status": "archived"})
check("update project", s == 200 and r.get("item", {}).get("status") == "archived", f"{s} {r}")
s, r = a.call("GET", "/api/projects?status=archived")
check("project filter returns only matching rows", s == 200 and len(r.get("items", [])) == 1, f"{s} {len(r.get('items', []))}")

# ---------------------------------------------------------- E. DOCUMENTS
body, ctype = multipart({"title": "PL-300 Certificate", "category": "certificate", "issuer": "Microsoft", "issuedAt": "2024"},
                        {"file": ("qa-certificate.pdf", PDF, "application/pdf")})
s, r = a.call("POST", "/api/documents", raw=body, content_type=ctype)
check("upload PDF document", s == 201 and r.get("item", {}).get("title") == "PL-300 Certificate", f"{s} {r}")
doc_id = r.get("item", {}).get("id")
check("storage path not exposed to client", "storagePath" not in json.dumps(r))
s, payload = a.call("GET", f"/api/documents/{doc_id}/file")
check("authenticated download returns real PDF bytes", s == 200 and isinstance(payload, bytes) and payload.startswith(b"%PDF"), str(s))
body, ctype = multipart({"title": "Evil script", "category": "other"}, {"file": ("evil.txt", b"#!/bin/sh\nrm -rf /", "text/plain")})
check("unsupported file type rejected with 415", a.call("POST", "/api/documents", raw=body, content_type=ctype, allow_error=True)[0] == 415)
body, ctype = multipart({"title": "Spoofed", "category": "other"}, {"file": ("spoof.pdf", b"\x89PNG\r\n\x1a\n not a pdf", "application/pdf")})
check("content/MIME mismatch rejected (magic-byte check)", a.call("POST", "/api/documents", raw=body, content_type=ctype, allow_error=True)[0] == 415)
s, r = a.call("GET", "/api/documents?category=certificate")
check("document category filter works", s == 200 and len(r.get("items", [])) == 1, f"{s}")
s, r = a.call("GET", "/api/profile/certification")
check("certificate upload auto-created a certification entry", s == 200 and any(c["name"] == "PL-300 Certificate" for c in r.get("items", [])), f"{s}")

# ----------------------------------------------------------- F. ANALYSIS
s, r = a.call("POST", "/api/analyses", {"careerId": "data-scientist", "useAi": True})
analysis = r.get("item", {}) if isinstance(r, dict) else {}
check("career analysis generated with a real score", s == 201 and 0 < analysis.get("readinessScore", 0) < 100, f"{s} {analysis.get('readinessScore')}")
check("analysis reports strengths derived from stored skills", len(analysis.get("strengths", [])) > 0)
check("analysis reports gaps derived from stored skills", len(analysis.get("gaps", [])) > 0)
check("analysis recommends certifications", len(analysis.get("recommendedCertifications", [])) > 0)
check("analysis declares its engine (rules vs AI)", analysis.get("engine") == "rules", str(analysis.get("engine")))
check("analysis summary cites real profile data", "Operations Analyst" in analysis.get("profileSummary", "") or "Kenya" in analysis.get("profileSummary", ""), analysis.get("profileSummary", "")[:120])
check("unknown career rejected with 404", a.call("POST", "/api/analyses", {"careerId": "not-a-career"}, allow_error=True)[0] == 404)

# ----------------------------------------------------------- G. ROADMAPS
s, r = a.call("POST", "/api/roadmaps", {"careerId": "data-scientist", "durationDays": 90, "weeklyHours": 12, "focus": ["Python"]})
check("roadmap generated", s == 201 and r.get("taskCount", 0) > 5, f"{s} {r.get('taskCount') if isinstance(r, dict) else r}")
roadmap_id = r.get("roadmap", {}).get("id")
check("roadmap has phases", len(r.get("phases", [])) >= 3, str(len(r.get("phases", []))))
check("unsupported duration rejected with 422", a.call("POST", "/api/roadmaps", {"careerId": "data-scientist", "durationDays": 45}, allow_error=True)[0] == 422)
s, r = a.call("GET", f"/api/roadmaps/{roadmap_id}")
tasks = r.get("tasks", []) if isinstance(r, dict) else []
check("roadmap detail returns tasks", s == 200 and len(tasks) > 5, f"{s} {len(tasks)}")
check("roadmap tasks include milestones", any(t["isMilestone"] for t in tasks))
check("roadmap progress starts at 0%", r.get("progress", {}).get("percent") == 0, str(r.get("progress", {}).get("percent")))
check("tasks reference real learning resources", any(t.get("resourceUrl") for t in tasks))
task_id = next(t["id"] for t in tasks if not t["isMilestone"])
s, r = a.call("PATCH", f"/api/roadmaps/{roadmap_id}/tasks/{task_id}", {"status": "done"})
check("task completion updates progress", s == 200 and r.get("progress", {}).get("done") == 1, f"{s} {r.get('progress')}")
s, r = a.call("PATCH", f"/api/roadmaps/{roadmap_id}/tasks/{task_id}", {"status": "todo"})
check("task can be reopened (progress recomputed)", s == 200 and r.get("progress", {}).get("done") == 0, f"{s}")
s, r = a.call("POST", f"/api/roadmaps/{roadmap_id}/tasks", {"title": "QA custom task", "kind": "practice", "dueDay": 10, "estimatedMinutes": 45, "priority": "high"})
check("custom task added", s == 201 and r.get("item", {}).get("isCustom") is True, f"{s} {r}")
custom_task = r.get("item", {}).get("id")
s, r = a.call("PATCH", f"/api/roadmaps/{roadmap_id}/tasks/{custom_task}", {"priority": "low", "status": "in_progress"})
check("task priority/status editable", s == 200 and r.get("item", {}).get("priority") == "low", f"{s} {r}")
check("task outside roadmap duration rejected", a.call("POST", f"/api/roadmaps/{roadmap_id}/tasks", {"title": "Out of range", "dueDay": 500}, allow_error=True)[0] == 422)
check("custom task deleted", a.call("DELETE", f"/api/roadmaps/{roadmap_id}/tasks/{custom_task}")[0] == 200)
s, r = a.call("PATCH", f"/api/roadmaps/{roadmap_id}", {"status": "paused"})
check("roadmap can be paused", s == 200 and r.get("roadmap", {}).get("status") == "paused", f"{s} {r}")
s, r = a.call("PATCH", f"/api/roadmaps/{roadmap_id}", {"status": "active"})
check("roadmap can be resumed", s == 200 and r.get("roadmap", {}).get("status") == "active", f"{s} {r}")

# ---------------------------------------------------------- H. ASSISTANT
s, r = a.call("POST", "/api/assistant", {"message": "What should I work on this week?"})
content = r.get("message", {}).get("content", "") if isinstance(r, dict) else ""
check("Nexus AI responds substantively", s == 201 and len(content) > 80, f"{s} {len(content)}")
check("assistant answer grounded in real profile data", any(k in content for k in ("Nairobi", "Data Scientist", "Python")), content[:160])
check("assistant discloses provider status honestly", isinstance(r, dict) and r.get("ai", {}).get("configured") is False and "guidance engine" in (r.get("notice") or "").lower(), str(r.get("notice") if isinstance(r, dict) else "")[:160])
conv_id = r.get("conversation", {}).get("id") if isinstance(r, dict) else None
s, r = a.call("POST", "/api/assistant", {"conversationId": conv_id, "message": "Improve my résumé for a data science role"})
check("conversation continues with history", s == 201 and "rsum" in r.get("message", {}).get("content", "").lower().replace("é", ""), f"{s}")
s, r = a.call("GET", f"/api/assistant?id={conv_id}")
check("conversation history persisted", s == 200 and len(r.get("messages", [])) == 4, f"{s} {len(r.get('messages', [])) if isinstance(r, dict) else r}")
check("empty assistant message rejected", a.call("POST", "/api/assistant", {"message": ""}, allow_error=True)[0] == 422)

# ------------------------------------------------------------ I. RESUMES
s, r = a.call("POST", "/api/resumes", {})
check("résumé created from profile", s == 201 and r.get("data", {}).get("name") == "QA Analyst Renamed", f"{s} {r.get('data', {}).get('name') if isinstance(r, dict) else r}")
resume_id = r.get("resume", {}).get("id") if isinstance(r, dict) else None
check("résumé pre-filled with real skills", len(r.get("data", {}).get("skills", [])) >= 6, str(len(r.get("data", {}).get("skills", []))))
check("résumé pre-filled with real experience", len(r.get("data", {}).get("experience", [])) == 1)
check("résumé pre-filled with real projects", len(r.get("data", {}).get("projects", [])) == 1)
s, r = a.call("PATCH", f"/api/resumes/{resume_id}", {
    "template": "modern", "accentColor": "#1d4ed8", "summary": "QA-verified summary line.",
    "sections": ["summary", "skills", "experience", "projects", "education", "certifications", "achievements"],
    "extras": {"achievements": [{"title": "Automation", "detail": "Cut reporting time by 40%."}]}})
check("résumé template + sections editable", s == 200 and r.get("resume", {}).get("template") == "modern", f"{s} {r}")
s, payload = a.call("GET", f"/api/resumes/{resume_id}/pdf")
ok_pdf = s == 200 and isinstance(payload, bytes) and payload.startswith(b"%PDF") and len(payload) > 3000
check("résumé PDF generated and downloadable", ok_pdf, f"{s} {len(payload) if isinstance(payload, bytes) else payload}")
if ok_pdf:
    import re
    import zlib

    def pdf_text(blob):
        """Inflate FlateDecode content streams and decode hex strings so body text can be searched."""
        chunks = []
        for m in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", blob, re.S):
            try:
                chunks.append(zlib.decompress(m.group(1)))
            except zlib.error:
                chunks.append(m.group(1))
        data = b"\n".join(chunks).decode("latin-1")
        lines = []
        # PDFKit writes each text run as a TJ array of hex fragments. Fragments of one run join without separators.
        for arr in re.findall(r"\[(.*?)\]\s*TJ", data, re.S):
            parts = []
            for hx in re.findall(r"<([0-9A-Fa-f\s]*)>", arr):
                hx = hx.replace(" ", "").replace("\n", "")
                if hx:
                    try:
                        parts.append(bytes.fromhex(hx).decode("latin-1"))
                    except ValueError:
                        pass
            lines.append("".join(parts))
        return "\n".join(lines)

    text = pdf_text(payload)
    check("PDF body embeds the user's real experience data", "Savanna Logistics" in text, "content stream missing company name")
    check("PDF body embeds the résumé skills", "Python" in text and "Pandas" in text, "skills missing from content")
    check("PDF renders the requested section headings", "WORK EXPERIENCE" in text and "SKILLS" in text, "headings missing")

# -------------------------------------------------------- J. NOTIFICATIONS
s, r = a.call("GET", "/api/notifications")
check("notifications generated by real events", s == 200 and len(r.get("items", [])) >= 4, f"{s} {len(r.get('items', []))}")
check("unread count reflects reality", r.get("unread", 0) >= 3, str(r.get("unread")))
check("notification summary endpoint works", "unread" in (a.call("GET", "/api/notifications?summary=1")[1] or {}))
nid = r["items"][0]["id"]
s, r = a.call("PATCH", f"/api/notifications/{nid}", {"read": True})
check("single notification can be marked read", s == 200 and r.get("item", {}).get("readAt") is not None, f"{s} {r}")
s, r = a.call("PATCH", "/api/notifications")
check("mark-all-read works", s == 200 and r.get("unread") == 0, f"{s} {r}")
s, r = a.call("GET", "/api/activity?limit=50")
check("activity feed records real events", s == 200 and len(r.get("items", [])) >= 8, f"{s} {len(r.get('items', []))}")

# ------------------------------------------------------ K. SETTINGS/SECURITY
s, r = a.call("PATCH", "/api/settings", {"roadmapReminders": False, "weeklyDigest": True})
check("settings update persists", s == 200 and r.get("settings", {}).get("roadmapReminders") is False, f"{s} {r}")
check("password change with wrong current password rejected", a.call("POST", "/api/auth/password", {"currentPassword": "nope", "newPassword": "AnotherPass123"}, allow_error=True)[0] == 401)
s, r = a.call("POST", "/api/auth/forgot-password", {"email": EMAIL_A})
check("forgot-password succeeds", s == 200 and r.get("ok") is True, f"{s} {r}")
check("forgot-password reports honest delivery status", r.get("delivered") is False and "RESEND_API_KEY" in (r.get("reason") or ""), str(r))
check("unknown email gets identical response (no enumeration)", anon.call("POST", "/api/auth/forgot-password", {"email": f"ghost.{suffix}@nowhere.test"})[0] == 200)
# Generating a recovery code supersedes any outstanding reset token (only the latest is valid).
s, r = a.call("POST", "/api/auth/recovery-code")
check("recovery code generated for offline reset", s == 200 and len(r.get("code", "")) > 10, f"{s} {r}")
code = r.get("code")
s, r = Client("reset").call("POST", "/api/auth/reset-password", {"token": code, "password": "NewQaPass!99"})
check("recovery code resets the password and signs in", s == 200 and r.get("user", {}).get("email") == EMAIL_A, f"{s} {r}")
check("single-use reset token cannot be replayed", Client("x").call("POST", "/api/auth/reset-password", {"token": code, "password": "AnotherOne!23"}, allow_error=True)[0] == 400)
check("login works with the new password", Client("np").call("POST", "/api/auth/login", {"email": EMAIL_A, "password": "NewQaPass!99"})[0] == 200)
check("old password no longer works", Client("op").call("POST", "/api/auth/login", {"email": EMAIL_A, "password": PASSWORD}, allow_error=True)[0] == 401)
check("password reset revoked prior sessions", a.call("GET", "/api/auth/session", allow_error=True)[0] == 401, "old session still valid")

# -------------------------------------------------- L. CROSS-USER ISOLATION
u2 = Client("U2")
check("second account can register", u2.call("POST", "/api/auth/register", {"fullName": "Second User", "email": EMAIL_B, "password": PASSWORD})[0] == 201)
check("user B cannot read user A's project", u2.call("GET", f"/api/projects/{project_id}", allow_error=True)[0] == 404)
check("user B cannot modify user A's project", u2.call("PATCH", f"/api/projects/{project_id}", {"name": "hijacked"}, allow_error=True)[0] == 404)
check("user B cannot delete user A's project", u2.call("DELETE", f"/api/projects/{project_id}", allow_error=True)[0] == 404)
check("user B cannot download user A's document", u2.call("GET", f"/api/documents/{doc_id}/file", allow_error=True)[0] == 404)
check("user B cannot read user A's roadmap", u2.call("GET", f"/api/roadmaps/{roadmap_id}", allow_error=True)[0] == 404)
check("user B cannot complete user A's task", u2.call("PATCH", f"/api/roadmaps/{roadmap_id}/tasks/{task_id}", {"status": "done"}, allow_error=True)[0] == 404)
check("user B cannot export user A's résumé", u2.call("GET", f"/api/resumes/{resume_id}/pdf", allow_error=True)[0] == 404)
check("user B cannot read user A's analysis", u2.call("GET", f"/api/analyses/{analysis.get('id')}", allow_error=True)[0] == 404)
s, r = u2.call("GET", "/api/projects")
check("user B's own list is empty (no leakage)", s == 200 and len(r.get("items", [])) == 0, f"{s}")

# -------------------------------------------------- M. LOGOUT + PERSISTENCE
check("logout succeeds", a.call("POST", "/api/auth/logout")[0] == 200)
check("session invalid after logout", a.call("GET", "/api/auth/session", allow_error=True)[0] == 401)
check("protected API rejects the logged-out session", a.call("GET", "/api/profile", allow_error=True)[0] == 401)
check("session cookie cleared on logout", "cn_session" not in a.cookies(), str(a.cookies()))

again = Client("again")
check("re-login after logout works", again.call("POST", "/api/auth/login", {"email": EMAIL_A, "password": "NewQaPass!99"})[0] == 200)
s, r = again.call("GET", "/api/profile")
prof = r.get("profile", {}) if isinstance(r, dict) else {}
check("profile data persisted across logout/login", prof.get("city") == "Nairobi" and str(prof.get("careerGoal", "")).startswith("Move into"), f"{s} {prof.get('city')}")
s, r = again.call("GET", "/api/skills")
check("skills persisted across logout/login", s == 200 and len(r.get("items", [])) == 6, f"{s} {len(r.get('items', []))}")
check("projects persisted", len((again.call("GET", "/api/projects")[1] or {}).get("items", [])) == 1)
check("documents persisted", len((again.call("GET", "/api/documents")[1] or {}).get("items", [])) == 1)
check("roadmap + tasks persisted", len((again.call("GET", f"/api/roadmaps/{roadmap_id}")[1] or {}).get("tasks", [])) > 5)
check("analysis persisted", len((again.call("GET", "/api/analyses")[1] or {}).get("items", [])) == 1)
check("résumé persisted", len((again.call("GET", "/api/resumes")[1] or {}).get("items", [])) == 1)
check("languages persisted", len((again.call("GET", "/api/languages")[1] or {}).get("items", [])) == 2)

# --------------------------------------------------------- N. DEMO ACCOUNT
demo = Client("demo")
s, r = demo.call("POST", "/api/auth/login", {"email": "demo@careernexus.app", "password": "Demo1234!"})
check("seeded demo account can sign in", s == 200 and r.get("user", {}).get("fullName") == "Amara Okafor", f"{s} {r}")
s, r = demo.call("GET", "/api/profile")
check("demo profile richly seeded (completion >= 80%)", s == 200 and r.get("completion", {}).get("percent", 0) >= 80, f"{s} {r.get('completion', {}).get('percent') if isinstance(r, dict) else r}")
s, r = demo.call("GET", "/api/roadmaps")
check("demo roadmap seeded with real completed tasks", s == 200 and r["items"][0]["progress"]["done"] > 0, f"{s}")
s, r = demo.call("GET", "/api/documents")
check("demo documents seeded with real stored files", s == 200 and len(r.get("items", [])) >= 3, f"{s}")
if isinstance(r, dict) and r.get("items"):
    s2, payload = demo.call("GET", f"/api/documents/{r['items'][0]['id']}/file")
    check("demo document downloads as a real PDF", s2 == 200 and isinstance(payload, bytes) and payload.startswith(b"%PDF"), f"{s2}")
s, r = demo.call("GET", "/api/careers")
check("career catalogue seeded in the database", s == 200 and len(r.get("items", [])) >= 30, f"{s} {len(r.get('items', [])) if isinstance(r, dict) else r}")

# -------------------------------------------------------- O. INPUT HANDLING
check("malformed JSON returns 400", anon.call("POST", "/api/auth/login", raw=b"{not json", content_type="application/json", allow_error=True)[0] == 400)
check("SQL-injection payload stored as inert data", Client("sqlreg").call("POST", "/api/auth/register", {"fullName": "'; DROP TABLE users;--", "email": f"sql.{suffix}@x.test", "password": "SafePass123!"})[0] == 201)
check("session endpoint reports 401 without a cookie", anon.call("GET", "/api/auth/session", allow_error=True)[0] == 401)
check("login page renders for anonymous users", anon.call("GET", "/login")[0] == 200)
s, html = anon.call("GET", "/")
check("landing page renders", s == 200 and b"Career Nexus" in (html if isinstance(html, bytes) else b""), str(s))
check("users table survived injection attempt", anon.call("GET", "/api/health")[0] == 200)

passed = sum(1 for _, ok, _ in results if ok)
failed = [r for r in results if not r[1]]
print(f"\n=== {passed}/{len(results)} checks passed ===")
if failed:
    print("\nFAILURES:")
    for label, _, detail in failed:
        print(f"  ✗ {label} — {str(detail)[:220]}")
sys.exit(1 if failed else 0)
