import "server-only";

const ENDPOINT = "https://api.resend.com/emails";

export type EmailResult =
  | { sent: true }
  | { sent: false; reason: "not-configured" | "failed"; detail?: string };

export function notificationsConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.NOTIFICATIONS_FROM?.trim(),
  );
}

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string | string[];
  subject: string;
  body: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.NOTIFICATIONS_FROM?.trim();
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);

  if (!apiKey || !from) return { sent: false, reason: "not-configured" };
  if (!recipients.length) return { sent: false, reason: "failed", detail: "no recipients" };

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject,
        text: body,
      }),
    });

    if (!response.ok) {
      // The response body can echo the request, so keep it to the status.
      return { sent: false, reason: "failed", detail: `status ${response.status}` };
    }
    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      reason: "failed",
      detail: error instanceof Error ? error.message : "unknown",
    };
  }
}

// Notifications must never be the reason a real action fails. A credential
// grant that worked is still a grant that worked if the email bounced.
export async function sendEmailQuietly(input: {
  to: string | string[];
  subject: string;
  body: string;
}) {
  try {
    return await sendEmail(input);
  } catch {
    return { sent: false, reason: "failed" } as const;
  }
}
