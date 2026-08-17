import "server-only";

import OpenAI from "openai";
import { type Block, blocksToText } from "@/lib/projects/blocks";

// Reuses the shape already proven by the public audit in lib/audit/openai.ts:
// the Responses API, a strict JSON schema, and store:false so nothing about a
// client project is retained upstream.
//
// AI is a convenience here and never a dependency. Every board workflow works
// with the key absent — this module simply reports that it is unavailable.

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

    // A model that dropped or invented cards does not get to reorder the week.
    if (ordered.length !== ideas.length) {
      return { ok: false, reason: "The suggestion was incomplete, so nothing moved." };
    }

    return {
      ok: true,
      orderedIds: ordered,
      rationale:
        typeof parsed.rationale === "string"
          ? parsed.rationale.slice(0, 300)
          : "Reordered by dependency.",
    };
  } catch {
    return { ok: false, reason: "The suggestion could not be generated." };
  }
}
