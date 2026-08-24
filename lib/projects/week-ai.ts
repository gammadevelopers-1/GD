import "server-only";

import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-5.6-terra";
const MAX_OUTPUT_TOKENS = 1600;
const MAX_TASKS = 20;

export type ExistingTask = { id: string; title: string };

export type ProposedTask = {
  title: string;
  detail: string;
  references: string[];
  existingId: string | null;
  existingTitle: string | null;
};

export type ProposalResult =
  { ok: true; tasks: ProposedTask[] } | { ok: false; reason: string };

export function weekAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

let client: OpenAI | null = null;

function openai(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    client = new OpenAI({ apiKey, maxRetries: 1, timeout: 45_000 });
  }
  return client;
}

function describeFailure(error: unknown, fallback: string): string {
  const status = (error as { status?: number } | null)?.status;
  const code = (error as { code?: string } | null)?.code;

  if (
    status === 429 ||
    code === "insufficient_quota" ||
    code === "credit_balance_exhausted"
  ) {
    return "The AI account has no credits left, so nothing was suggested.";
  }
  if (status === 401 || status === 403) {
    return "The AI key was rejected. Check OPENAI_API_KEY.";
  }
  if (status === 404) {
    return "That AI model is unavailable. Check OPENAI_MODEL.";
  }
  return fallback;
}

const TASK_SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      description: "One entry per piece of work stated in the notes.",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description:
              "One short imperative line naming the work. No trailing full stop.",
          },
          detail: {
            type: "string",
            description:
              "Two or three sentences: what this involves and what finishing it looks like, using only what the notes say. Empty string when the notes add nothing.",
          },
          references: {
            type: "array",
            description:
              "Attachments, links or named documents from the notes that this task depends on, quoted by the name the notes use. Empty when none apply.",
            items: { type: "string" },
          },
          existing_id: {
            type: "string",
            description:
              "The id of the existing task this rewrites, copied exactly from the EXISTING TASKS list. Empty string when this is new work.",
          },
        },
        required: ["title", "detail", "references", "existing_id"],
        additionalProperties: false,
      },
    },
  },
  required: ["tasks"],
  additionalProperties: false,
} as const;

const SYSTEM = `You keep one week's checklist honest for a small software studio.

You are given the week's notes and the tasks already on its checklist. You do two jobs at once: name work from the notes that is not on the checklist yet, and tidy the tasks that are already there.

You are reading someone's brain-dump and naming the work already in it, clearly enough that a colleague could pick up any line and start. You are not a planner and you are not a writer of filler.

Rules, in order of importance:
- Invent nothing. Every task, and every sentence of detail, must trace to something written in the notes.
- If the notes do not describe any work, return an empty list. That is a correct answer.
- One task per discrete piece of work. Do not split a single job into steps the notes do not mention, and do not merge two separate jobs into one line.
- Titles are short imperative lines: "Fix the authentication flow", not "We should probably fix auth at some point".
- Detail says what the task involves and what finishing it looks like, in two or three plain sentences, drawn only from the notes. If the notes give nothing beyond the title, return an empty detail rather than restating the title.
- The notes mark attachments as [image attached: name], [pdf attached: name] and so on, and may name links or documents inline. When a task depends on one, put its name in references and say in the detail how it is used — for example "the spec is in brief.pdf on the idea board". Never describe what is inside an attachment; you cannot see it.
- Never assign anyone, never set a date, never add a priority, even if a name or a day appears in the notes. Whoever reviews this decides that.

Tidying existing tasks:
- For every task under EXISTING TASKS, decide whether its wording could be clearer. Fix spelling, grammar, casing and vague phrasing; make it a short imperative line like any other.
- When you rewrite one, put its id in existing_id, exactly as given. Keep the meaning identical — you are correcting how it reads, not what it says.
- Leave a task out entirely if its wording is already fine. Do not return it unchanged.
- Never merge two existing tasks, never split one, and never rewrite one into different work.
- New work from the notes has an empty existing_id.

British English. Plain language. No preamble, no encouragement, no restating the notes back.`;

function normalise(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function similar(a: string, b: string) {
  const left = normalise(a);
  const right = normalise(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftWords = new Set(left.split(" ").filter((word) => word.length > 3));
  const rightWords = new Set(
    right.split(" ").filter((word) => word.length > 3),
  );
  if (!leftWords.size || !rightWords.size) return false;

  let shared = 0;
  for (const word of leftWords) if (rightWords.has(word)) shared += 1;
  return shared / Math.min(leftWords.size, rightWords.size) >= 0.7;
}

export async function proposeWeekTasks(
  notes: string,
  existing: ExistingTask[],
): Promise<ProposalResult> {
  if (!weekAiConfigured()) {
    return { ok: false, reason: "AI is not configured on this environment." };
  }
  if (notes.trim().length < 20) {
    return {
      ok: false,
      reason: "Write a little more on the idea board first.",
    };
  }

  let parsed: { tasks?: unknown };

  const input = existing.length
    ? `NOTES\n${notes}\n\nEXISTING TASKS\n${existing
        .map((task) => `${task.id} :: ${task.title}`)
        .join("\n")}`
    : `NOTES\n${notes}\n\nEXISTING TASKS\n(none)`;

  try {
    const response = await openai().responses.create({
      model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
      instructions: SYSTEM,
      input,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "gamma_week_tasks",
          strict: true,
          schema: TASK_SCHEMA,
        },
      },
    });

    if (response.error) {
      return { ok: false, reason: "The suggestions could not be generated." };
    }
    if (response.incomplete_details?.reason === "max_output_tokens") {
      return {
        ok: false,
        reason: "These notes are too long to read in one pass. Trim them.",
      };
    }

    parsed = JSON.parse(response.output_text);
  } catch (error) {
    return {
      ok: false,
      reason: describeFailure(error, "The suggestions could not be generated."),
    };
  }

  const raw = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  const tasks: ProposedTask[] = [];
  const byId = new Map(existing.map((task) => [task.id, task.title]));

  for (const entry of raw.slice(0, MAX_TASKS)) {
    const record = entry as Record<string, unknown>;
    const title =
      typeof record.title === "string"
        ? record.title.replace(/\s+/g, " ").trim().slice(0, 240)
        : "";
    if (!title) continue;

    const claimedId =
      typeof record.existing_id === "string" ? record.existing_id.trim() : "";
    const existingId = byId.has(claimedId) ? claimedId : null;
    const existingTitle = existingId ? (byId.get(existingId) ?? null) : null;

    if (existingId && existingTitle === title) continue;
    if (tasks.some((task) => task.existingId === existingId && existingId)) {
      continue;
    }
    if (!existingId && tasks.some((task) => similar(task.title, title))) {
      continue;
    }

    const detail =
      typeof record.detail === "string"
        ? record.detail.replace(/\s+/g, " ").trim().slice(0, 600)
        : "";

    const references = Array.isArray(record.references)
      ? record.references
          .map((entry) =>
            typeof entry === "string"
              ? entry.replace(/\s+/g, " ").trim().slice(0, 160)
              : "",
          )
          .filter(Boolean)
          .slice(0, 6)
      : [];

    if (!existingId && existing.some((task) => similar(task.title, title))) {
      continue;
    }

    tasks.push({ title, detail, references, existingId, existingTitle });
  }

  if (!tasks.length) {
    return {
      ok: false,
      reason:
        "Nothing to add or tidy — the notes describe no new work and the tasks read fine.",
    };
  }

  return { ok: true, tasks };
}
