import { NextResponse } from "next/server";

import { hashIp, rateLimit } from "@/lib/audit/rate-limit";
import { configuredOrigin } from "@/lib/site/origin";
import { leadEmail, leadPayload, parseLead } from "@/lib/contact/fields";
import { site } from "@/lib/content/site";
import { sendEmailQuietly } from "@/lib/notifications/send";
import { adminConfigured, adminRpc } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Where enquiries land. Overridable so staging does not mail the real inbox. */
const INBOX = process.env.CONTACT_INBOX?.trim() || site.email;

function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function fail(error: string, status: number, field?: string) {
  return NextResponse.json({ ok: false, error, field }, { status });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Bad request.", 400);
  }

  // A field positioned off-screen and hidden from assistive tech. A person
  // never sees it; most bots fill every input they find.
  if (typeof (body as { website?: unknown })?.website === "string") {
    if ((body as { website: string }).website.trim()) {
      // Answer as though it worked. Telling a bot it was caught only teaches
      // whoever wrote it what to change.
      return NextResponse.json({ ok: true });
    }
  }

  const parsed = parseLead(body);
  if (!parsed.ok) return fail(parsed.error, 400, parsed.field);

  const ipHash = hashIp(clientIp(req));
  const limit = rateLimit(`contact:${ipHash}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "That is a lot of enquiries. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  if (!adminConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[contact] SUPABASE_SECRET_KEY is not set");
    }
    return fail(
      `Could not file that just now. Email us at ${INBOX} and we will pick it up.`,
      503,
    );
  }

  // Stored first. If Resend is down we have lost a notification, not a lead.
  const stored = await adminRpc("app_submit_contact_lead", {
    payload: leadPayload(parsed.value, {
      sourcePath:
        typeof (body as { sourcePath?: unknown })?.sourcePath === "string"
          ? (body as { sourcePath: string }).sourcePath.slice(0, 300)
          : "",
      referrer: (req.headers.get("referer") ?? "").slice(0, 300),
      ipHash,
      userAgent: (req.headers.get("user-agent") ?? "").slice(0, 300),
    }),
  });

  if (!stored.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[contact] insert failed", stored.message);
    }
    return fail(
      `Could not file that just now. Email us at ${INBOX} and we will pick it up.`,
      502,
    );
  }

  const id = typeof stored.data === "string" ? stored.data : "";
  const origin = configuredOrigin();
  const mail = leadEmail(parsed.value, origin ? `${origin}/leads` : "");

  const sent = await sendEmailQuietly({
    to: INBOX,
    subject: mail.subject,
    body: mail.body,
    replyTo: parsed.value.email,
  });

  if (sent.sent && id) {
    await adminRpc("app_contact_lead_notified", { lead_id: id });
  } else if (!sent.sent && process.env.NODE_ENV !== "production") {
    console.warn("[contact] lead stored but not mailed", sent.reason);
  }

  return NextResponse.json({ ok: true });
}
