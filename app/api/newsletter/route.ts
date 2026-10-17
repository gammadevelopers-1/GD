import { NextResponse } from "next/server";

import { hashIp, rateLimit } from "@/lib/audit/rate-limit";
import { site } from "@/lib/content/site";
import { sendEmailQuietly } from "@/lib/notifications/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * There is no mailing-list provider wired up yet, so a signup is forwarded to
 * the same inbox the enquiry form uses and added to the list by hand.
 *
 * That is deliberately modest, and it is the point: until this does something
 * real, the form must not tell anyone they are subscribed. It previously said
 * "You're in" and sent nothing at all.
 */
const INBOX = process.env.CONTACT_INBOX?.trim() || site.email;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Bad request." },
      { status: 400 },
    );
  }

  // Positioned off-screen and hidden from assistive tech. A person never sees
  // it; most bots fill every input they find.
  const trap = (body as { website?: unknown })?.website;
  if (typeof trap === "string" && trap.trim()) {
    return NextResponse.json({ ok: true });
  }

  const email = String((body as { email?: unknown })?.email ?? "")
    .trim()
    .slice(0, 254);

  if (!EMAIL.test(email)) {
    return NextResponse.json(
      { ok: false, error: "That does not look like an email address." },
      { status: 400 },
    );
  }

  const limit = rateLimit(`newsletter:${hashIp(clientIp(req))}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Try again in a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const sent = await sendEmailQuietly({
    to: INBOX,
    subject: "Newsletter signup",
    body: `${email} asked to be added to the newsletter.`,
    replyTo: email,
  });

  if (!sent.sent) {
    // Say so rather than showing a tick. Someone who thinks they subscribed
    // and did not is worse off than someone who knows it failed.
    return NextResponse.json(
      {
        ok: false,
        error: `Could not sign you up just now. Email ${INBOX} and we will add you.`,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
