import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { AuditResult } from "./types";

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "gamma-default-salt";
  return createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

export interface LogInput {
  description: string;
  result: AuditResult | null;
  ipHash: string;
  latencyMs: number;
  cached: boolean;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

export async function logAuditRun(input: LogInput): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
    await supabase.from("audit_runs").insert({
      description: input.description,
      problems: input.result?.problems ?? null,
      fixes: input.result?.fixes ?? null,
      headline: input.result?.headline ?? null,
      weeks: input.result?.weeks ?? null,
      ip_hash: input.ipHash,
      latency_ms: input.latencyMs,
      cached: input.cached,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      error: input.error ?? null,
    });
  } catch {
    // A logging hiccup should never interrupt the visitor.
  }
}
