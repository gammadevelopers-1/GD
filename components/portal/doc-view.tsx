import type { IdeaDoc, IdeaNode } from "@/lib/projects/idea-doc";

type Mark = { type: string; attrs?: Record<string, unknown> };

function safeHref(raw: unknown) {
  const value = typeof raw === "string" ? raw.trim() : "";
  return /^(https?:|mailto:|tel:)/i.test(value) ? value : null;
}

function Text({ node, index }: { node: IdeaNode; index: number }) {
  const text = node.text ?? "";
  if (!text) return null;

  let content: React.ReactNode = text;
  const marks = (node.marks ?? []) as Mark[];

  for (const mark of marks) {
    if (mark.type === "bold") content = <strong>{content}</strong>;
    else if (mark.type === "italic") content = <em>{content}</em>;
    else if (mark.type === "underline") content = <u>{content}</u>;
    else if (mark.type === "strike") content = <s>{content}</s>;
    else if (mark.type === "subscript") content = <sub>{content}</sub>;
    else if (mark.type === "superscript") content = <sup>{content}</sup>;
    else if (mark.type === "code") content = <code>{content}</code>;
    else if (mark.type === "highlight") {
      const color = mark.attrs?.color;
      content = (
        <mark
          style={
            typeof color === "string" ? { backgroundColor: color } : undefined
          }
        >
          {content}
        </mark>
      );
    } else if (mark.type === "textStyle") {
      const color = mark.attrs?.color;
      if (typeof color === "string") {
        content = <span style={{ color }}>{content}</span>;
      }
    } else if (mark.type === "link") {
      const href = safeHref(mark.attrs?.href);
      content = href ? (
        <a href={href} target="_blank" rel="noreferrer noopener nofollow">
          {content}
        </a>
      ) : (
        content
      );
    }
  }

  return <span key={index}>{content}</span>;
}

function Children({ nodes }: { nodes: IdeaNode[] | undefined }) {
  return <>{(nodes ?? []).map((node, index) => Render(node, index))}</>;
}

function Render(node: IdeaNode, index: number): React.ReactNode {
  const align =
    typeof node.attrs?.textAlign === "string"
      ? { textAlign: node.attrs.textAlign as React.CSSProperties["textAlign"] }
      : undefined;

  switch (node.type) {
    case "text":
      return <Text key={index} node={node} index={index} />;
    case "hardBreak":
      return <br key={index} />;
    case "paragraph":
      return (
        <p key={index} style={align}>
          <Children nodes={node.content} />
        </p>
      );
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      const Tag = (level === 4 ? "h4" : level === 3 ? "h3" : "h2") as "h2";
      return (
        <Tag key={index} style={align}>
          <Children nodes={node.content} />
        </Tag>
      );
    }
    case "bulletList":
      return (
        <ul key={index}>
          <Children nodes={node.content} />
        </ul>
      );
    case "orderedList":
      return (
        <ol key={index}>
          <Children nodes={node.content} />
        </ol>
      );
    case "listItem":
      return (
        <li key={index}>
          <Children nodes={node.content} />
        </li>
      );
    case "taskList":
      return (
        <ul key={index} className="list-none pl-0">
          <Children nodes={node.content} />
        </ul>
      );
    case "taskItem": {
      const checked = node.attrs?.checked === true;
      return (
        <li key={index} className="flex list-none items-start gap-2 pl-0">
          <input
            type="checkbox"
            checked={checked}
            readOnly
            disabled
            aria-label={checked ? "Done" : "Not done"}
            className="mt-1.5 size-3.5 shrink-0 accent-[#16a34a]"
          />
          <span className="min-w-0">
            <Children nodes={node.content} />
          </span>
        </li>
      );
    }
    case "blockquote":
      return (
        <blockquote key={index}>
          <Children nodes={node.content} />
        </blockquote>
      );
    case "codeBlock":
      return (
        <pre key={index}>
          <code>
            <Children nodes={node.content} />
          </code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={index} />;
    default:
      return null;
  }
}

export function DocView({ doc }: { doc: IdeaDoc }) {
  return (
    <div className="idea-prose">
      <Children nodes={doc.content} />
    </div>
  );
}
