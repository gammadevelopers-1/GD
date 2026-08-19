import "server-only";

import OpenAI from "openai";
import type { IdeaDoc, IdeaNode } from "@/lib/projects/idea-doc";

const DEFAULT_MODEL = "gpt-5.6-terra";
const MAX_OUTPUT_TOKENS = 2400;
const MAX_SECTIONS = 12;
const MAX_ITEMS = 20;

export function workAiConfigured() {
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
    return "The AI account has no credits left, so nothing was organised.";
  }
  if (status === 401 || status === 403) {
    return "The AI key was rejected. Check OPENAI_API_KEY.";
  }
  if (status === 404) {
    return "That AI model is unavailable. Check OPENAI_MODEL.";
  }
  if (
    code === "ETIMEDOUT" ||
    (error as { name?: string })?.name === "APIConnectionTimeoutError"
  ) {
    return "The AI took too long to respond. Try again.";
  }
  return fallback;
}

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description:
        "A short title for the plan, drawn from the notes. Use 'Work plan' when the notes name nothing specific.",
    },
    sections: {
      type: "array",
      description:
        "Themes found in the notes, in a sensible reading order. One section per theme.",
      items: {
        type: "object",
        properties: {
          heading: {
            type: "string",
            description: "Short theme name taken from the notes.",
          },
          items: {
            type: "array",
            description:
              "Action items stated in the notes, rewritten as clear single lines. Empty if the theme holds no actions.",
            items: { type: "string" },
          },
          notes: {
            type: "array",
            description:
              "Context, open questions and decisions stated in the notes that are not actions. Empty if there are none.",
            items: { type: "string" },
          },
        },
        required: ["heading", "items", "notes"],
        additionalProperties: false,
      },
    },
    facts: {
      type: "array",
      description:
        "Only people, dates, deadlines and decisions written explicitly in the notes. Empty if none were written.",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
            enum: ["Owner", "Deadline", "Decision", "Dependency", "Priority"],
          },
          value: {
            type: "string",
            description: "Quoted or closely paraphrased from the notes.",
          },
        },
        required: ["label", "value"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "sections", "facts"],
  additionalProperties: false,
} as const;

const SYSTEM = `You reorganise one person's rough project notes into a clear work plan for a small software studio.

Your only job is to group and clarify what is already written. You are an editor, not an author.

Rules, in order of importance:
- Invent nothing. No tasks, deadlines, owners, priorities, requirements, decisions or dependencies that are not written in the notes.
- If the notes do not say who owns something or when it is due, leave it out. An empty facts list is a correct answer.
- Never guess at what a fragment means. Keep an unclear line close to its original wording and put it under the closest theme.
- Every line you output must trace back to something in the notes.
- Group related lines under a heading that names the theme. Split a theme only when the notes clearly cover separate areas.
- Turn each action into one plain imperative line. Do not pad, do not add a rationale.
- A line describing context, a question or a decision is a note, not an action.
- Attachments appear as [image attached: name]. Mention one only if the notes discuss it; never describe its contents.
- British English. Plain language. No marketing tone, no encouragement, no preamble.`;

export type OrganiseResult =
  | { ok: true; doc: IdeaDoc; sections: number; items: number }
  | { ok: false; reason: string };

function text(value: string): IdeaNode {
  return { type: "text", text: value };
}

function paragraph(value: string): IdeaNode {
  return { type: "paragraph", content: [text(value)] };
}

function heading(level: 2 | 3, value: string): IdeaNode {
  return { type: "heading", attrs: { level }, content: [text(value)] };
}

function taskList(items: string[]): IdeaNode {
  return {
    type: "taskList",
    content: items.map((item) => ({
      type: "taskItem",
      attrs: { checked: false },
      content: [paragraph(item)],
    })),
  };
}

function bulletList(items: string[]): IdeaNode {
  return {
    type: "bulletList",
    content: items.map((item) => ({
      type: "listItem",
      content: [paragraph(item)],
    })),
  };
}

function clean(value: unknown, max: number): string {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}

function cleanList(value: unknown, max: number, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => clean(entry, max))
    .filter(Boolean)
    .slice(0, limit);
}

export async function organiseIdeaNotes(
  notes: string,
): Promise<OrganiseResult> {
  if (!workAiConfigured()) {
    return { ok: false, reason: "AI is not configured on this environment." };
  }
  if (notes.trim().length < 40) {
    return {
      ok: false,
      reason: "Write a little more on the Idea Board before organising it.",
    };
  }

  let parsed: {
    title?: unknown;
    sections?: unknown;
    facts?: unknown;
  };

  try {
    const response = await openai().responses.create({
      model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
      instructions: SYSTEM,
      input: notes,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "gamma_work_plan",
          strict: true,
          schema: PLAN_SCHEMA,
        },
      },
    });

    if (response.error) {
      return { ok: false, reason: "The AI could not organise these notes." };
    }
    if (response.incomplete_details?.reason === "max_output_tokens") {
      return {
        ok: false,
        reason:
          "These notes are too long to organise in one pass. Trim them or organise a shorter section.",
      };
    }

    parsed = JSON.parse(response.output_text);
  } catch (error) {
    return {
      ok: false,
      reason: describeFailure(error, "The work plan could not be generated."),
    };
  }

  const content: IdeaNode[] = [];
  let itemCount = 0;

  const rawSections = Array.isArray(parsed.sections) ? parsed.sections : [];
  const sections = rawSections
    .slice(0, MAX_SECTIONS)
    .map((raw) => {
      const section = raw as Record<string, unknown>;
      return {
        heading: clean(section.heading, 120),
        items: cleanList(section.items, 400, MAX_ITEMS),
        notes: cleanList(section.notes, 600, MAX_ITEMS),
      };
    })
    .filter(
      (section) =>
        section.heading && (section.items.length || section.notes.length),
    );

  if (!sections.length) {
    return {
      ok: false,
      reason: "Nothing organisable came back, so the Work Board is unchanged.",
    };
  }

  content.push(heading(2, clean(parsed.title, 120) || "Work plan"));

  for (const section of sections) {
    content.push(heading(3, section.heading));
    if (section.items.length) {
      content.push(taskList(section.items));
      itemCount += section.items.length;
    }
    if (section.notes.length) content.push(bulletList(section.notes));
  }

  const facts = (Array.isArray(parsed.facts) ? parsed.facts : [])
    .slice(0, MAX_ITEMS)
    .map((raw) => {
      const fact = raw as Record<string, unknown>;
      return `${clean(fact.label, 40)}: ${clean(fact.value, 300)}`;
    })
    .filter((line) => !line.startsWith(":") && !line.endsWith(": "));

  if (facts.length) {
    content.push(heading(3, "Stated in your notes"));
    content.push(bulletList(facts));
  }

  return {
    ok: true,
    doc: { type: "doc", content },
    sections: sections.length,
    items: itemCount,
  };
}
