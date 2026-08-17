import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  type Digest,
  buildOwnerSummaryEmail,
  buildReminderEmail,
} from "@/lib/notifications/digest";
import { notificationsConfigured, sendEmailQuietly } from "@/lib/notifications/send";

// Chunk 10's scheduled sender. Called by a cron with a shared secret — there
// is no user session behind it, and the digest function is the only thing the
// service key is allowed to call.
//
//   curl -X POST https://…/api/notifications?kind=milestones \
//     -H "x-notification-secret: $NOTIFICATIONS_CRON_SECRET"
//
// Suggested schedule: milestones each weekday morning, summary on Mondays.

export const dynamic = "force-dynamic";

function secretMatches(provided: string | null) {
  const expected = process.env.NOTIFICATIONS_CRON_SECRET?.trim();
  if (!expected || !provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function loadDigest(horizonDays: number): Promise<Digest | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) return null;

  const response = await fetch(`${url}/rest/v1/rpc/app_notification_digest`, {
    method: "POST",
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ horizon_days: horizonDays }),
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as Digest;
}

export async function POST(request: Request) {
  if (!secretMatches(request.headers.get("x-notification-secret"))) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") ?? "all";
  const horizonDays = Number(searchParams.get("horizon") ?? 3);

  if (!["milestones", "summary", "all"].includes(kind)) {
    return NextResponse.json(
      { error: "kind must be milestones, summary or all." },
      { status: 400 },
    );
  }

  if (!notificationsConfigured()) {
    return NextResponse.json(
      { error: "Email is not configured. Set RESEND_API_KEY and NOTIFICATIONS_FROM." },
      { status: 503 },
    );
  }

  const digest = await loadDigest(Number.isFinite(horizonDays) ? horizonDays : 3);
  if (!digest) {
    return NextResponse.json(
      { error: "Could not read the digest." },
      { status: 503 },
    );
  }

  let reminders = 0;
  let summaries = 0;
  let failures = 0;

  if (kind === "milestones" || kind === "all") {
    for (const reminder of digest.reminders) {
      if (!reminder.email || !reminder.items.length) continue;
      const { subject, body } = buildReminderEmail(reminder);
      const result = await sendEmailQuietly({
        to: reminder.email,
        subject,
        body,
      });
      if (result.sent) reminders += 1;
      else failures += 1;
    }
  }

  if (kind === "summary" || kind === "all") {
    const owners = digest.owners
      .map((owner) => owner.email)
      .filter((email): email is string => Boolean(email));

    if (owners.length) {
      const { subject, body } = buildOwnerSummaryEmail(digest);
      const result = await sendEmailQuietly({ to: owners, subject, body });
      if (result.sent) summaries += 1;
      else failures += 1;
    }
  }

  // Counts only. Never the addresses, never what was in the mail.
  return NextResponse.json({
    generated_on: digest.generated_on,
    projects: digest.projects.length,
    reminders_sent: reminders,
    summaries_sent: summaries,
    failures,
  });
}
