import type { AuditResult } from "@/types/audit";

export const AUDIT_MODEL = "claude-sonnet-4-6";
export const AUDIT_MAX_TOKENS = 700;

export function buildAuditPrompt(description: string): string {
  return `A small business describes itself: "${description}"

Identify the 4 most likely places this specific business loses time or money to manual work, and the matching fixed state for each.

Then write one sentence naming the single highest-impact thing to fix first, and roughly how long it would take to build.

Respond with ONLY this JSON, no preamble, no markdown fences:
{"problems":["","","",""],"fixes":["","","",""],"headline":"","weeks":0}

Rules:
- Be specific to THIS business type. Never generic filler.
- problems and fixes: fragments, max 5 words, lowercase, no full stops.
- problems[i] must correspond to fixes[i].
- headline: one sentence, max 22 words, naming what to fix first and why it matters most.
- weeks: integer between 2 and 10.
- If the description is not a real business, set headline to "" and return empty arrays.`;
}

export function parseAuditResult(raw: string): AuditResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const o = parsed as Record<string, unknown>;

  const clean = (v: unknown): string[] =>
    Array.isArray(v)
      ? v
          .filter((x): x is string => typeof x === "string")
          .map((x) => x.trim().slice(0, 60))
          .filter(Boolean)
          .slice(0, 4)
      : [];

  const problems = clean(o.problems);
  const fixes = clean(o.fixes);
  const headline =
    typeof o.headline === "string" ? o.headline.trim().slice(0, 220) : "";
  const weeks = Number(o.weeks);

  if (problems.length < 3 || fixes.length < 3 || !headline) return null;

  const n = Math.min(problems.length, fixes.length);

  return {
    problems: problems.slice(0, n),
    fixes: fixes.slice(0, n),
    headline,
    weeks: Number.isFinite(weeks)
      ? Math.min(12, Math.max(2, Math.round(weeks)))
      : 6,
  };
}
