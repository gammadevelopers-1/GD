import "server-only";

import OpenAI from "openai";
import { type Block, blocksToText } from "@/lib/projects/blocks";

const DEFAULT_MODEL = "gpt-5.6-terra";
const MAX_OUTPUT_TOKENS = 900;

export function boardAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

let client: OpenAI | null = null;

function openai(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    client = new OpenAI({ apiKey, maxRetries: 1, timeout: 20_000 });
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

const ORDER_SCHEMA = {
  type: "object",
  properties: {
    ordered_ids: {
      type: "array",
      description: "Every supplied card id, in the order they should be done.",
      items: { type: "string" },
    },
    rationale: {
      type: "string",
      description: "One short sentence explaining the ordering.",
    },
  },
  required: ["ordered_ids", "rationale"],
  additionalProperties: false,
} as const;

const SYSTEM = `You sequence a week of delivery work for a small software studio.

You receive the ideas planned for one week. Return the same ids, reordered so
the week flows sensibly: unblock-others first, then the work that depends on
it, then anything that can slip without hurting.

Rules:
- Return every id you were given, exactly once. Invent nothing.
- Do not rename, merge or drop cards.
- The rationale is one sentence, plain and specific. No preamble.`;

export type IdeaForOrdering = {
  id: string;
  title: string;
  blocks: Block[];
};

export type OrderSuggestion =
  | { ok: true; orderedIds: string[]; rationale: string }
  | { ok: false; reason: string };

export async function suggestIdeaOrder(
  ideas: IdeaForOrdering[],
): Promise<OrderSuggestion> {
  if (!boardAiConfigured()) {
    return { ok: false, reason: "AI is not configured on this environment." };
  }
  if (ideas.length < 2) {
    return { ok: false, reason: "Add at least two ideas to sequence them." };
  }

  const input = ideas
    .map((idea) => {
      const body = blocksToText(idea.blocks).slice(0, 600);
      return `id: ${idea.id}\ntitle: ${idea.title}${body ? `\nnotes: ${body}` : ""}`;
    })
    .join("\n\n---\n\n");

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
          name: "gamma_week_order",
          strict: true,
          schema: ORDER_SCHEMA,
        },
      },
    });

    if (response.error) return { ok: false, reason: "The suggestion failed." };

    const parsed = JSON.parse(response.output_text) as {
      ordered_ids?: unknown;
      rationale?: unknown;
    };

    const supplied = new Set(ideas.map((idea) => idea.id));
    const ordered = Array.isArray(parsed.ordered_ids)
      ? parsed.ordered_ids
          .map(String)
          .filter((id) => supplied.has(id))
          .filter((id, index, all) => all.indexOf(id) === index)
      : [];

    if (ordered.length !== ideas.length) {
      return {
        ok: false,
        reason: "The suggestion was incomplete, so nothing moved.",
      };
    }

    return {
      ok: true,
      orderedIds: ordered,
      rationale:
        typeof parsed.rationale === "string"
          ? parsed.rationale.slice(0, 300)
          : "Reordered by dependency.",
    };
  } catch (error) {
    return {
      ok: false,
      reason: describeFailure(error, "The suggestion could not be generated."),
    };
  }
}

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    blocks: {
      type: "array",
      description: "Between two and eight blocks, in reading order.",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["heading", "text", "bullet", "callout"],
          },
          text: {
            type: "string",
            description:
              "Content for heading, text and callout. Empty for bullet.",
          },
          items: {
            type: "array",
            description: "List entries for bullet. Empty for everything else.",
            items: { type: "string" },
          },
          tone: {
            type: "string",
            enum: ["note", "warn", "key"],
            description: "Only meaningful for callout.",
          },
        },
        required: ["kind", "text", "items", "tone"],
        additionalProperties: false,
      },
    },
  },
  required: ["blocks"],
  additionalProperties: false,
} as const;

const DRAFT_SYSTEM = `You help a small software studio think through one piece
of delivery work before starting it.

Given a card title and whatever rough notes exist, return a short, concrete
plan for that card. Structure it as blocks:

- a short "text" block saying what this actually involves, in one or two lines
- a "bullet" block of the concrete steps, 3 to 6 of them
- optionally one "callout" for the single biggest risk or decision, tone "warn"
  for a risk and "key" for something nobody must miss

Rules:
- Be specific to the title. No filler, no restating the title back.
- British English. Plain language. No marketing tone.
- Never invent client names, dates, credentials, URLs or people.
- At most eight blocks.`;

export type DraftedBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "text"; text: string }
  | { type: "bullet"; items: string[] }
  | { type: "callout"; tone: "note" | "warn" | "key"; text: string };

export type DraftResult =
  { ok: true; blocks: DraftedBlock[] } | { ok: false; reason: string };

export async function draftIdeaBlocks(
  title: string,
  existing: Block[],
): Promise<DraftResult> {
  if (!boardAiConfigured()) {
    return { ok: false, reason: "AI is not configured on this environment." };
  }
  if (!title.trim()) {
    return { ok: false, reason: "Give the card a title first." };
  }

  const notes = blocksToText(existing).slice(0, 1500);
  const input = `title: ${title}${notes ? `\n\nexisting notes:\n${notes}` : ""}`;

  try {
    const response = await openai().responses.create({
      model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
      instructions: DRAFT_SYSTEM,
      input,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "gamma_card_draft",
          strict: true,
          schema: DRAFT_SCHEMA,
        },
      },
    });

    if (response.error) return { ok: false, reason: "The draft failed." };

    const parsed = JSON.parse(response.output_text) as {
      blocks?: Array<Record<string, unknown>>;
    };

    const blocks: DraftedBlock[] = [];
    for (const raw of parsed.blocks ?? []) {
      const text = typeof raw.text === "string" ? raw.text.trim() : "";
      const items = Array.isArray(raw.items)
        ? raw.items
            .map(String)
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      if (raw.kind === "heading" && text) {
        blocks.push({ type: "heading", level: 2, text });
      } else if (raw.kind === "text" && text) {
        blocks.push({ type: "text", text });
      } else if (raw.kind === "bullet" && items.length) {
        blocks.push({ type: "bullet", items });
      } else if (raw.kind === "callout" && text) {
        const tone =
          raw.tone === "warn" || raw.tone === "key" ? raw.tone : "note";
        blocks.push({ type: "callout", tone, text });
      }
    }

    if (!blocks.length) {
      return {
        ok: false,
        reason: "Nothing usable came back, so nothing changed.",
      };
    }

    return { ok: true, blocks: blocks.slice(0, 8) };
  } catch (error) {
    return {
      ok: false,
      reason: describeFailure(error, "The draft could not be generated."),
    };
  }
}
