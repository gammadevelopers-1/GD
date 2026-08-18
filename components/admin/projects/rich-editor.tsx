"use client";

import { useImperativeHandle, useState, type Ref } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  List,
  Minus,
  Redo2,
  Undo2,
} from "lucide-react";
import type { Block } from "@/lib/projects/blocks";
import {
  blocksToDoc,
  docToBlocks,
  nodesForBlocks,
} from "@/lib/projects/rich-doc";
import { FOCUS_RING } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export type RichEditorHandle = {
  appendBlocks: (blocks: Block[]) => void;
};

function ToolButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid size-7 place-items-center rounded-md transition disabled:opacity-30",
        FOCUS_RING,
        active
          ? "bg-[#15181b] text-white"
          : "text-black/55 hover:bg-black/[0.06] hover:text-black",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-4 w-px bg-black/10" />;
}

export function RichEditor({
  initialBlocks,
  onChange,
  ref,
}: {
  initialBlocks: Block[];
  onChange: (blocks: Block[]) => void;
  ref?: Ref<RichEditorHandle>;
}) {
  const [, setTick] = useState(0);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        blockquote: false,
        codeBlock: false,
        orderedList: false,
        strike: false,
        underline: false,
        link: false,
      }),
    ],
    content: blocksToDoc(initialBlocks),
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(docToBlocks(editor.getJSON())),
    onTransaction: () => setTick((tick) => tick + 1),
  });

  useImperativeHandle(
    ref,
    () => ({
      appendBlocks(blocks) {
        if (!editor) return;
        const nodes = nodesForBlocks(blocks);
        if (!nodes.length) return;
        editor
          .chain()
          .focus("end")
          .insertContentAt(editor.state.doc.content.size, nodes)
          .run();
      },
    }),
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.09] bg-white transition-colors focus-within:border-black/25">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-black/[0.06] bg-black/[0.02] px-1.5 py-1">
        <ToolButton
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 className="size-3.5" />
        </ToolButton>
        <ToolButton
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 className="size-3.5" />
        </ToolButton>
        <Divider />
        <ToolButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-3.5" />
        </ToolButton>
        <ToolButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-3.5" />
        </ToolButton>
        <ToolButton
          label="Code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="size-3.5" />
        </ToolButton>
        <Divider />
        <ToolButton
          label="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="size-3.5" />
        </ToolButton>
        <ToolButton
          label="Subheading"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="size-3.5" />
        </ToolButton>
        <Divider />
        <ToolButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-3.5" />
        </ToolButton>
        <ToolButton
          label="Divider line"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-3.5" />
        </ToolButton>
      </div>

      <div className="board-editor relative px-3.5 py-3">
        {editor.isEmpty ? (
          <p className="pointer-events-none absolute top-3 left-3.5 text-[13px] text-black/25">
            Write anything — context, a decision, what you tried…
          </p>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
