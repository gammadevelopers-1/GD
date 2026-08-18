import type { JSONContent } from "@tiptap/react";
import type { Block } from "@/lib/projects/blocks";

export function isProseBlock(block: Block) {
  return (
    block.type === "heading" ||
    block.type === "text" ||
    block.type === "bullet" ||
    block.type === "divider"
  );
}

const INLINE_SPLIT = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

function inlineNodes(text: string): JSONContent[] {
  const nodes: JSONContent[] = [];
  for (const part of text.split(INLINE_SPLIT)) {
    if (!part) continue;
    let marks: JSONContent["marks"];
    let body = part;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      marks = [{ type: "bold" }];
      body = part.slice(2, -2);
    } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      marks = [{ type: "italic" }];
      body = part.slice(1, -1);
    } else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      marks = [{ type: "code" }];
      body = part.slice(1, -1);
    }
    body.split("\n").forEach((line, index) => {
      if (index > 0) nodes.push({ type: "hardBreak" });
      if (line) {
        nodes.push(
          marks
            ? { type: "text", text: line, marks }
            : { type: "text", text: line },
        );
      }
    });
  }
  return nodes;
}

function blockToNode(block: Block): JSONContent | null {
  switch (block.type) {
    case "heading": {
      const content = inlineNodes(block.text);
      return {
        type: "heading",
        attrs: { level: block.level },
        ...(content.length ? { content } : {}),
      };
    }
    case "text": {
      const content = inlineNodes(block.text);
      return { type: "paragraph", ...(content.length ? { content } : {}) };
    }
    case "bullet":
      return {
        type: "bulletList",
        content: block.items.map((item) => {
          const content = inlineNodes(item);
          return {
            type: "listItem",
            content: [
              { type: "paragraph", ...(content.length ? { content } : {}) },
            ],
          };
        }),
      };
    case "divider":
      return { type: "horizontalRule" };
    default:
      return null;
  }
}

export function nodesForBlocks(blocks: Block[]): JSONContent[] {
  return blocks
    .map(blockToNode)
    .filter((node): node is JSONContent => node !== null);
}

export function blocksToDoc(blocks: Block[]): JSONContent {
  const content = nodesForBlocks(blocks);
  return {
    type: "doc",
    content: content.length ? content : [{ type: "paragraph" }],
  };
}

function serializeInline(content: JSONContent[] | undefined): string {
  if (!content) return "";
  return content
    .map((node) => {
      if (node.type === "hardBreak") return "\n";
      if (node.type !== "text" || !node.text) return "";
      const marks = node.marks?.map((mark) => mark.type) ?? [];
      if (marks.includes("code")) return `\`${node.text}\``;
      if (marks.includes("bold")) return `**${node.text}**`;
      if (marks.includes("italic")) return `*${node.text}*`;
      return node.text;
    })
    .join("");
}

function listItemText(item: JSONContent): string {
  return (item.content ?? [])
    .map((child) =>
      child.type === "paragraph" ? serializeInline(child.content) : "",
    )
    .filter(Boolean)
    .join("\n");
}

export function docToBlocks(doc: JSONContent): Block[] {
  const blocks: Block[] = [];
  for (const node of doc.content ?? []) {
    switch (node.type) {
      case "heading": {
        const text = serializeInline(node.content).trim();
        if (text) {
          blocks.push({
            type: "heading",
            level: node.attrs?.level === 3 ? 3 : 2,
            text,
          });
        }
        break;
      }
      case "paragraph": {
        const text = serializeInline(node.content).trimEnd();
        if (text.trim()) blocks.push({ type: "text", text });
        break;
      }
      case "bulletList":
      case "orderedList": {
        const items = (node.content ?? [])
          .map(listItemText)
          .map((item) => item.trim())
          .filter(Boolean);
        if (items.length) blocks.push({ type: "bullet", items });
        break;
      }
      case "horizontalRule":
        blocks.push({ type: "divider" });
        break;
    }
  }
  return blocks;
}
