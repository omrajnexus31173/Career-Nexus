

export type EmailResult = { delivered: boolean; reason?: string };

/**
 * Transactional email via Resend when RESEND_API_KEY is configured.
 * When it is not, we report the failure honestly instead of pretending the mail was sent.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Career Nexus <no-reply@careernexus.app>";
  if (!key) {
    return { delivered: false, reason: "No email provider configured (RESEND_API_KEY missing)." };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.text, html: input.html }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("[email-failed]", res.status, detail.slice(0, 300));
      return { delivered: false, reason: `Email provider responded ${res.status}.` };
    }
    return { delivered: true };
  } catch (e) {
    console.error("[email-error]", e instanceof Error ? e.message : e);
    return { delivered: false, reason: "Email provider unreachable." };
  }
}
