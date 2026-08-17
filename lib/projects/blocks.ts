import { looksLikeSecret } from "@/lib/projects/technical";

// The Idea Board stores an ordered list of blocks as JSONB. The database only
// checks that it is an array; this file owns the shape, and it runs on the
// server before anything is written.
//
// Deliberately a small vocabulary. A block type nobody uses is a block type
// that still has to be rendered, sanitised and migrated forever.

export const BLOCK_TYPES = [
  "heading",
  "text",
  "bullet",
  "callout",
  "image",
  "file",
  "credential",
  "divider",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const CALLOUT_TONES = ["note", "warn", "key"] as const;
export type CalloutTone = (typeof CALLOUT_TONES)[number];

export const CALLOUT_LABEL: Record<CalloutTone, string> = {
  note: "Note",
  warn: "Watch out",
  key: "Important",
};

export type Block =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "text"; text: string }
  | { type: "bullet"; items: string[] }
  | { type: "callout"; tone: CalloutTone; text: string }
  | { type: "image"; path: string; alt: string }
  | { type: "file"; path: string; name: string; size: number }
  // References a credential by id. The value never lives here — the whole
  // point of the vault is that a secret exists in exactly one place.
  | { type: "credential"; credentialId: string; name: string }
  | { type: "divider" };

export const MAX_BLOCKS = 120;
export const TEXT_MAX = 4000;
export const HEADING_MAX = 200;
export const BULLET_ITEM_MAX = 500;
export const MAX_BULLETS = 40;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class BlockError extends Error {}

function text(value: unknown, max: number): string {
  if (typeof value !== "string") throw new BlockError("Expected text.");
  const trimmed = value.replace(/\r\n/g, "\n").trimEnd();
  if (trimmed.length > max) {
    throw new BlockError(`Keep that under ${max} characters.`);
  }
  // Same rule the technical tab enforces: a pasted key belongs in the vault,
  // not in prose that every project member can read.
  if (looksLikeSecret(trimmed)) {
    throw new BlockError(
      "That looks like a key or password. Store it in Credentials and link to it instead.",
    );
  }
  return trimmed;
}

function storagePath(value: unknown): string {
  if (typeof value !== "string" || !value) {
    throw new BlockError("Missing file path.");
  }
  // Paths are written by the upload action as <project>/<card>/<file>.
  if (value.includes("..") || value.startsWith("/") || value.length > 400) {
    throw new BlockError("That file path is not valid.");
  }
  return value;
}

function parseBlock(raw: unknown): Block | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;

  switch (value.type) {
    case "heading": {
      const body = text(value.text, HEADING_MAX);
      if (!body) return null;
      return { type: "heading", level: value.level === 3 ? 3 : 2, text: body };
    }
    case "text": {
      const body = text(value.text, TEXT_MAX);
      if (!body) return null;
      return { type: "text", text: body };
    }
    case "bullet": {
      if (!Array.isArray(value.items)) return null;
      const items = value.items
        .slice(0, MAX_BULLETS)
        .map((item) => text(item, BULLET_ITEM_MAX))
        .filter(Boolean);
      if (!items.length) return null;
      return { type: "bullet", items };
    }
    case "callout": {
      const body = text(value.text, TEXT_MAX);
      if (!body) return null;
      const tone = CALLOUT_TONES.includes(value.tone as CalloutTone)
        ? (value.tone as CalloutTone)
        : "note";
      return { type: "callout", tone, text: body };
    }
    case "image":
      return {
        type: "image",
        path: storagePath(value.path),
        alt: typeof value.alt === "string" ? value.alt.slice(0, 200) : "",
      };
    case "file":
      return {
        type: "file",
        path: storagePath(value.path),
        name:
          typeof value.name === "string" && value.name
            ? value.name.slice(0, 200)
            : "Attachment",
        size: Number.isFinite(Number(value.size))
          ? Math.max(0, Math.trunc(Number(value.size)))
          : 0,
      };
    case "credential": {
      const id = String(value.credentialId ?? "");
      if (!UUID.test(id)) return null;
      return {
        type: "credential",
        credentialId: id,
        name:
          typeof value.name === "string" && value.name
            ? value.name.slice(0, 200)
            : "Credential",
      };
    }
    case "divider":
      return { type: "divider" };
    default:
      return null;
  }
}

// Throws BlockError with a message worth showing; returns clean blocks.
export function parseBlocks(raw: unknown): Block[] {
  let input = raw;
  if (typeof input === "string") {
    try {
      input = JSON.parse(input || "[]");
    } catch {
      throw new BlockError("The board content could not be read.");
    }
  }
  if (!Array.isArray(input)) return [];
  if (input.length > MAX_BLOCKS) {
    throw new BlockError(`A card holds at most ${MAX_BLOCKS} blocks.`);
  }
  return input.map(parseBlock).filter((block): block is Block => block !== null);
}

// Plain text for AI prompts, search and previews.
export function blocksToText(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `${block.level === 2 ? "##" : "###"} ${block.text}`;
        case "text":
          return block.text;
        case "bullet":
          return block.items.map((item) => `- ${item}`).join("\n");
        case "callout":
          return `[${CALLOUT_LABEL[block.tone]}] ${block.text}`;
        case "file":
          return `[file] ${block.name}`;
        case "image":
          return block.alt ? `[image] ${block.alt}` : "[image]";
        case "credential":
          return `[credential] ${block.name}`;
        case "divider":
          return "---";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

export function blockSummary(blocks: Block[]): string {
  const first = blocks.find(
    (block) => block.type === "text" || block.type === "bullet",
  );
  if (!first) return "";
  if (first.type === "text") return first.text.slice(0, 160);
  if (first.type === "bullet") return first.items.join(" · ").slice(0, 160);
  return "";
}

export function countAttachments(blocks: Block[]) {
  return blocks.filter(
    (block) => block.type === "image" || block.type === "file",
  ).length;
}
