import "server-only";

import OpenAI from "openai";
import {
  IDEA_CONTEXT_MAX,
  IDEA_PROMPT_MAX,
  IDEA_SELECTION_MAX,
  type IdeaAiAction,
  type IdeaDraftBlock,
} from "@/lib/projects/idea-draft";

const DEFAULT_MODEL = "gpt-5.6-terra";
const MAX_OUTPUT_TOKENS = 1600;
const MAX_BLOCKS = 10;
const MAX_ITEMS = 8;

export function ideaAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

let client: OpenAI | null = null;

function openai(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    client = new OpenAI({ apiKey, maxRetries: 1, timeout: 30_000 });
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
    return "The AI account has no credits left, so nothing was written.";
  }
  if (status === 401 || status === 403) {
    return "The AI key was rejected. Check OPENAI_API_KEY.";
  }
  if (status === 404) {
    return "That AI model is unavailable. Check OPENAI_MODEL.";
  }
  return fallback;
}

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    blocks: {
      type: "array",
      description: "The passage to put on the page, in reading order.",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["heading", "text", "bullet", "numbered", "quote"],
          },
          text: {
            type: "string",
            description:
              "Content for heading, text and quote. Empty for the two list kinds.",
          },
          items: {
            type: "array",
            description:
              "Entries for bullet and numbered. Empty for everything else.",
            items: { type: "string" },
          },
        },
        required: ["kind", "text", "items"],
        additionalProperties: false,
      },
    },
  },
  required: ["blocks"],
  additionalProperties: false,
} as const;

const SYSTEM = `You are the writing assistant inside the weekly idea board of a
small software studio — where a team keeps the plans, decisions and research
for one week of delivery work.

You are given the note that is open, the passage the writer has selected if
there is one, and what they asked for. Return the passage to put on the page.

Rules:
- Write only the passage. No preamble, no "here is", no sign-off, no meta.
- Match the note's own voice, tense and level of detail.
- Stay on this project. Never invent client names, dates, people, numbers,
  credentials or URLs, and never repeat a key or password back.
- British English. Plain language. Sentence case. No marketing tone.
- When a selection is given, your passage replaces it — cover the same ground.
- Prefer a short paragraph or a tight list over a wall of text.
- Use a heading only when the passage genuinely needs a title.
- At most ${MAX_BLOCKS} blocks, and at most ${MAX_ITEMS} entries in a list.`;

const INTENT: Record<Exclude<IdeaAiAction, "custom">, string> = {
  brainstorm:
    "Brainstorm what this week could contain. Give a short list of concrete, distinct ideas that follow from the note — not generic project advice.",
  continue:
    "Continue the note from where it stops, in the same voice and format. Two or three sentences, or the next few entries of the list it ends on.",
  improve:
    "Rewrite the selected passage so it is clearer and tighter. With no selection, rewrite the note. Keep every fact and decision — change the wording, not the meaning.",
  summarise:
    "Summarise the note into a short brief someone could read in twenty seconds: what this week is, and what it turns on.",
};

export type IdeaDraftRequest = {
  action: IdeaAiAction;
  prompt: string;
  document: string;
  selection: string;
};

export type IdeaDraftResult =
  { ok: true; blocks: IdeaDraftBlock[] } | { ok: false; reason: string };

export async function draftIdeaPassage(
  request: IdeaDraftRequest,
): Promise<IdeaDraftResult> {
  if (!ideaAiConfigured()) {
    return { ok: false, reason: "AI is not configured on this environment." };
  }

  const prompt =
    request.action === "custom"
      ? request.prompt.trim().slice(0, IDEA_PROMPT_MAX)
      : INTENT[request.action];

  if (!prompt) {
    return { ok: false, reason: "Tell AI what to write first." };
  }

  const document = request.document.trim().slice(0, IDEA_CONTEXT_MAX);
  const selection = request.selection.trim().slice(0, IDEA_SELECTION_MAX);

  if (!document && !selection && request.action !== "custom") {
    return {
      ok: false,
      reason: "There is nothing on the board yet — write a line first.",
    };
  }

  const input = [
    `the note:\n${document || "(empty)"}`,
    selection ? `the selected passage:\n${selection}` : null,
    `what they asked for:\n${prompt}`,
  ]
    .filter(Boolean)
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
          name: "gamma_idea_draft",
          strict: true,
          schema: DRAFT_SCHEMA,
        },
      },
    });

    if (response.error) {
      return { ok: false, reason: "The draft could not be written." };
    }

    const parsed = JSON.parse(response.output_text) as {
      blocks?: Array<Record<string, unknown>>;
    };

    const blocks: IdeaDraftBlock[] = [];
    for (const raw of parsed.blocks ?? []) {
      const text = typeof raw.text === "string" ? raw.text.trim() : "";
      const items = Array.isArray(raw.items)
        ? raw.items
            .map(String)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, MAX_ITEMS)
        : [];

      if (raw.kind === "heading" && text) {
        blocks.push({ type: "heading", text });
      } else if (raw.kind === "text" && text) {
        blocks.push({ type: "text", text });
      } else if (raw.kind === "quote" && text) {
        blocks.push({ type: "quote", text });
      } else if (raw.kind === "bullet" && items.length) {
        blocks.push({ type: "bullet", items });
      } else if (raw.kind === "numbered" && items.length) {
        blocks.push({ type: "numbered", items });
      }
    }

    if (!blocks.length) {
      return {
        ok: false,
        reason: "Nothing usable came back. Try asking a different way.",
      };
    }

    return { ok: true, blocks: blocks.slice(0, MAX_BLOCKS) };
  } catch (error) {
    return {
      ok: false,
      reason: describeFailure(error, "The draft could not be written."),
    };
  }
}
