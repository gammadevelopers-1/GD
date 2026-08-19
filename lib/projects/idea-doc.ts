import { looksLikeSecret } from "@/lib/projects/technical";

export type IdeaDoc = { type: "doc"; content: IdeaNode[] };

export type IdeaNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: IdeaNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
};

export const EMPTY_DOC: IdeaDoc = { type: "doc", content: [] };

export const IDEA_MAX_NODES = 4000;
export const IDEA_MAX_CHARS = 400_000;

export const TEXT_COLORS = [
  { name: "Default", value: "#14171a" },
  { name: "Grey", value: "#6b7280" },
  { name: "Red", value: "#dc2626" },
  { name: "Amber", value: "#b45309" },
  { name: "Green", value: "#08743d" },
  { name: "Teal", value: "#0f766e" },
  { name: "Blue", value: "#1d4ed8" },
  { name: "Indigo", value: "#4338ca" },
  { name: "Purple", value: "#7e22ce" },
  { name: "Pink", value: "#be185d" },
] as const;

export const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#fde047" },
  { name: "Lime", value: "#bef264" },
  { name: "Green", value: "#86efac" },
  { name: "Teal", value: "#5eead4" },
  { name: "Blue", value: "#93c5fd" },
  { name: "Indigo", value: "#a5b4fc" },
  { name: "Purple", value: "#d8b4fe" },
  { name: "Pink", value: "#f9a8d4" },
  { name: "Red", value: "#fca5a5" },
  { name: "Grey", value: "#d1d5db" },
] as const;

export const HIGHLIGHT_YELLOW = HIGHLIGHT_COLORS[0].value;

// The palette was deepened after these were already written into documents.
// Dropping them from the allowlist would strip the mark off older notes the
// next time they were parsed, so they stay valid to read and are simply no
// longer offered in the picker.
const RETIRED_HIGHLIGHTS = [
  "#fef08a",
  "#d9f99d",
  "#bbf7d0",
  "#99f6e4",
  "#bfdbfe",
  "#c7d2fe",
  "#e9d5ff",
  "#fbcfe8",
  "#fecaca",
  "#e5e7eb",
];

const ALLOWED_COLORS = new Set<string>([
  ...TEXT_COLORS.map((color) => color.value),
  ...HIGHLIGHT_COLORS.map((color) => color.value),
  ...RETIRED_HIGHLIGHTS,
]);

const ALIGNMENTS = new Set(["left", "center", "right", "justify"]);

const NODE_TYPES = new Set([
  "paragraph",
  "heading",
  "text",
  "bulletList",
  "orderedList",
  "listItem",
  "taskList",
  "taskItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "hardBreak",
  "attachment",
]);

const MARK_TYPES = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
  "subscript",
  "superscript",
  "highlight",
  "textStyle",
]);

const ALIGNABLE = new Set(["paragraph", "heading"]);

const SAFE_HREF = /^(https?:|mailto:|tel:)/i;

export class IdeaDocError extends Error {}

function safeHref(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const href = value.trim().slice(0, 2000);
  if (!SAFE_HREF.test(href)) return null;
  return href;
}

function storagePath(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  if (value.includes("..") || value.startsWith("/") || value.length > 400) {
    return null;
  }
  if (!value.includes("/ideas/")) return null;
  return value;
}

function cleanMarks(raw: unknown) {
  if (!Array.isArray(raw)) return undefined;
  const marks = raw.flatMap((mark) => {
    if (!mark || typeof mark !== "object") return [];
    const type = (mark as { type?: unknown }).type;
    if (typeof type !== "string" || !MARK_TYPES.has(type)) return [];
    const attrs = (mark as { attrs?: Record<string, unknown> }).attrs ?? {};

    if (type === "link") {
      const href = safeHref(attrs.href);
      if (!href) return [];
      return [{ type, attrs: { href, target: "_blank", rel: "noreferrer" } }];
    }

    // Colours become inline style, so only the palette is ever stored.
    if (type === "highlight" || type === "textStyle") {
      const raw = typeof attrs.color === "string" ? attrs.color : "";
      if (!ALLOWED_COLORS.has(raw)) return [];
      return [{ type, attrs: { color: raw } }];
    }

    return [{ type }];
  });
  return marks.length ? marks : undefined;
}

function cleanAttachment(attrs: Record<string, unknown> | undefined) {
  const path = storagePath(attrs?.path);
  if (!path) return null;
  const size = Number(attrs?.size);
  return {
    path,
    name:
      typeof attrs?.name === "string" && attrs.name
        ? attrs.name.slice(0, 200)
        : "Attachment",
    mime: typeof attrs?.mime === "string" ? attrs.mime.slice(0, 120) : "",
    size: Number.isFinite(size) ? Math.max(0, Math.trunc(size)) : 0,
  };
}

export function parseIdeaDoc(raw: unknown): IdeaDoc {
  let input = raw;
  if (typeof input === "string") {
    try {
      input = JSON.parse(input || "null");
    } catch {
      throw new IdeaDocError("The board content could not be read.");
    }
  }
  if (!input || typeof input !== "object") return EMPTY_DOC;
  const root = input as IdeaNode;
  if (root.type !== "doc") return EMPTY_DOC;

  let nodes = 0;
  let chars = 0;
  const secrets: string[] = [];

  const walk = (node: unknown): IdeaNode | null => {
    if (!node || typeof node !== "object") return null;
    const value = node as IdeaNode;
    if (typeof value.type !== "string" || !NODE_TYPES.has(value.type)) {
      return null;
    }

    nodes += 1;
    if (nodes > IDEA_MAX_NODES) {
      throw new IdeaDocError("This board has grown too large to save.");
    }

    if (value.type === "text") {
      const text = typeof value.text === "string" ? value.text : "";
      if (!text) return null;
      chars += text.length;
      if (chars > IDEA_MAX_CHARS) {
        throw new IdeaDocError("This board has grown too large to save.");
      }
      if (looksLikeSecret(text)) secrets.push(text);
      const marks = cleanMarks(value.marks);
      return marks ? { type: "text", text, marks } : { type: "text", text };
    }

    if (value.type === "attachment") {
      const attrs = cleanAttachment(value.attrs);
      return attrs ? { type: "attachment", attrs } : null;
    }

    const cleaned: IdeaNode = { type: value.type };
    const attrs: Record<string, unknown> = {};

    if (value.type === "heading") {
      const level = Number(value.attrs?.level);
      attrs.level = level === 3 ? 3 : level === 4 ? 4 : 2;
    }
    if (ALIGNABLE.has(value.type)) {
      const align = value.attrs?.textAlign;
      if (typeof align === "string" && ALIGNMENTS.has(align)) {
        attrs.textAlign = align;
      }
    }
    if (value.type === "taskItem") {
      attrs.checked = value.attrs?.checked === true;
    }
    if (Object.keys(attrs).length) cleaned.attrs = attrs;
    if (value.type === "codeBlock") {
      const language = value.attrs?.language;
      cleaned.attrs = {
        language: typeof language === "string" ? language.slice(0, 40) : null,
      };
    }

    if (Array.isArray(value.content)) {
      const content = value.content
        .map(walk)
        .filter((child): child is IdeaNode => child !== null);
      if (content.length) cleaned.content = content;
    }

    return cleaned;
  };

  const content = Array.isArray(root.content)
    ? root.content.map(walk).filter((node): node is IdeaNode => node !== null)
    : [];

  if (secrets.length) {
    throw new IdeaDocError(
      "That looks like a key or password. Store it in Credentials and link to it instead — nothing was saved.",
    );
  }

  return { type: "doc", content };
}

export function ideaDocIsEmpty(doc: IdeaDoc) {
  return !doc.content.length;
}
