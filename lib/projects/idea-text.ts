import type { IdeaDoc, IdeaNode } from "@/lib/projects/idea-doc";
import { mediaKind } from "@/lib/projects/idea-media";

function inline(nodes: IdeaNode[] | undefined): string {
  if (!nodes) return "";
  return nodes
    .map((node) => {
      if (node.type === "text") return node.text ?? "";
      if (node.type === "hardBreak") return " ";
      return inline(node.content);
    })
    .join("");
}

function listLines(node: IdeaNode, ordered: boolean, depth: number): string[] {
  const pad = "  ".repeat(depth);
  return (node.content ?? []).flatMap((item, index) => {
    const marker = ordered ? `${index + 1}.` : "-";
    const checked = item.attrs?.checked === true ? "[x] " : "";
    const own = (item.content ?? []).filter(
      (child) => child.type !== "bulletList" && child.type !== "orderedList",
    );
    const nested = (item.content ?? []).filter(
      (child) => child.type === "bulletList" || child.type === "orderedList",
    );
    const head =
      `${pad}${marker} ${item.type === "taskItem" ? checked : ""}${inline(own)}`.trimEnd();
    return [
      head,
      ...nested.flatMap((child) =>
        listLines(child, child.type === "orderedList", depth + 1),
      ),
    ];
  });
}

function blockLines(node: IdeaNode): string[] {
  switch (node.type) {
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      return [`${"#".repeat(Math.max(1, level - 1))} ${inline(node.content)}`];
    }
    case "paragraph":
      return [inline(node.content)];
    case "blockquote":
      return (node.content ?? []).flatMap((child) =>
        blockLines(child).map((line) => `> ${line}`),
      );
    case "bulletList":
    case "taskList":
      return listLines(node, false, 0);
    case "orderedList":
      return listLines(node, true, 0);
    case "codeBlock":
      return ["```", inline(node.content), "```"];
    case "horizontalRule":
      return ["---"];
    case "attachment": {
      const name = String(node.attrs?.name ?? "attachment");
      const kind = mediaKind(String(node.attrs?.mime ?? ""));
      return [`[${kind} attached: ${name}]`];
    }
    default:
      return node.content ? (node.content ?? []).flatMap(blockLines) : [];
  }
}

export function ideaDocToText(doc: IdeaDoc, limit = 14_000): string {
  const text = doc.content
    .flatMap(blockLines)
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.length > limit ? `${text.slice(0, limit)}\n…` : text;
}
