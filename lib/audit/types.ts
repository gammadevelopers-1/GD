export interface AuditResult {
  problems: string[];
  fixes: string[];
  headline: string;
  weeks: number;
}

export type AuditResponse =
  | { ok: true; data: AuditResult; cached: boolean }
  | { ok: false; error: string };

export type AuditPhase =
  "idle" | "loading" | "problems" | "fixes" | "done" | "error";
