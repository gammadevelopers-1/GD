import { NextResponse } from "next/server";
import {
  AUDIT_MAX_TOKENS,
  AUDIT_MODEL,
  buildAuditPrompt,
  parseAuditResult,
} from "@/lib/audit/prompt";
import {
  cacheKey,
  getCached,
  rateLimit,
  setCached,
} from "@/lib/audit/rate-limit";
import type { AuditResponse, AuditResult } from "@/types/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_LEN = 8;
const MAX_LEN = 300;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

function fail(error: string, status: number) {
  return NextResponse.json<AuditResponse>({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fail("Audit is not configured.", 500);

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

  const ck = cacheKey(description);
  const cached = getCached<AuditResult>(ck);
  if (cached) {
    return NextResponse.json<AuditResponse>({
      ok: true,
      data: cached,
      cached: true,
    });
  }

  const limit = rateLimit(clientIp(req));
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
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: AUDIT_MODEL,
        max_tokens: AUDIT_MAX_TOKENS,
        messages: [{ role: "user", content: buildAuditPrompt(description) }],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) return fail("The model is busy. Try again in a moment.", 502);

    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const raw =
      json.content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("") ?? "";

    const data = parseAuditResult(raw);
    if (!data) {
      return fail(
        "Could not read that. Try describing the business differently.",
        422,
      );
    }

    setCached(ck, data);
    return NextResponse.json<AuditResponse>({ ok: true, data, cached: false });
  } catch {
    return fail("Could not reach the model just now.", 503);
  }
}
