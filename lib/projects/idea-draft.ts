import type { IdeaNode } from "@/lib/projects/idea-doc";
import type { SimpleFormState } from "@/lib/projects/form-state";

export const IDEA_AI_ACTIONS = [
  "custom",
  "brainstorm",
  "continue",
  "improve",
  "summarise",
] as const;

export type IdeaAiAction = (typeof IDEA_AI_ACTIONS)[number];

export function isIdeaAiAction(value: string): value is IdeaAiAction {
  return (IDEA_AI_ACTIONS as readonly string[]).includes(value);
}

export type IdeaDraftBlock =
  | { type: "heading"; text: string }
  | { type: "text"; text: string }
  | { type: "bullet"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "quote"; text: string };

export type IdeaAiState = SimpleFormState & { blocks?: IdeaDraftBlock[] };

export const IDEA_PROMPT_MAX = 500;
export const IDEA_CONTEXT_MAX = 6000;
export const IDEA_SELECTION_MAX = 2000;

function paragraph(text: string): IdeaNode {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

function entries(items: string[]): IdeaNode[] {
  return items.map((item) => ({
    type: "listItem",
    content: [paragraph(item)],
  }));
}

export function draftToNodes(blocks: IdeaDraftBlock[]): IdeaNode[] {
  return blocks.map((block) => {
    if (block.type === "heading") {
      return {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: block.text }],
      };
    }
    if (block.type === "bullet") {
      return { type: "bulletList", content: entries(block.items) };
    }
    if (block.type === "numbered") {
      return { type: "orderedList", content: entries(block.items) };
    }
    if (block.type === "quote") {
      return { type: "blockquote", content: [paragraph(block.text)] };
    }
    return paragraph(block.text);
  });
}

export function draftWordCount(blocks: IdeaDraftBlock[]) {
  const text = blocks
    .map((block) =>
      block.type === "bullet" || block.type === "numbered"
        ? block.items.join(" ")
        : block.text,
    )
    .join(" ");

  return text.split(/\s+/).filter(Boolean).length;
}
