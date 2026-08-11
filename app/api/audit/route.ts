import { NextResponse } from "next/server";
import { generateAudit } from "@/lib/audit/openai";
import {
  AUDIT_SYSTEM_PROMPT,
  buildUserMessage,
  parseAuditResult,
} from "@/lib/audit/prompt";
import {
  cacheKey,
  getCached,
  hashIp,
  rateLimit,
  setCached,
} from "@/lib/audit/rate-limit";
import type { AuditResponse, AuditResult } from "@/lib/audit/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_LEN = 8;
const MAX_LEN = 300;

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function fail(error: string, status: number) {
  return NextResponse.json<AuditResponse>({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Bad request.", 400);
  }

  const description =
    typeof (body as { description?: unknown })?.description === "string"
      ? (body as { description: string }).description.trim()
      : "";

  if (description.length < MIN_LEN || description.length > MAX_LEN) {
    return fail("Tell us a bit more about the business.", 400);
  }

  const ipHash = hashIp(clientIp(req));

  const ck = cacheKey(description);
  const cached = getCached<AuditResult>(ck);
  if (cached) {
    return NextResponse.json<AuditResponse>({
      ok: true,
      data: cached,
      cached: true,
    });
  }

  const limit = rateLimit(ipHash);
  if (!limit.allowed) {
    return NextResponse.json<AuditResponse>(
      {
        ok: false,
        error: "Too many audits from this address. Try again shortly.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const gen = await generateAudit(
      AUDIT_SYSTEM_PROMPT,
      buildUserMessage(description),
      ipHash,
    );

    if (gen.refused) {
      return fail(
        "Could not read that. Try describing the business differently.",
        422,
      );
    }
    if (gen.truncated) {
      return fail(
        "That response was cut short. Try a shorter description.",
        502,
      );
    }

    const data = parseAuditResult(gen.text);

    if (!data) {
      return fail(
        "Could not read that. Try describing the business differently.",
        422,
      );
    }

    setCached(ck, data);

    return NextResponse.json<AuditResponse>({ ok: true, data, cached: false });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[audit] OpenAI request failed", err);
    }

    return fail("Could not reach the model just now.", 503);
  }
}
