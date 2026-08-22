"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { CodeBlockWithCopy } from "@/components/admin/projects/code-block-node";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Code,
  Highlighter,
  Italic,
  Link2,
  Link2Off,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  Minus,
  Paperclip,
  Quote,
  Redo2,
  SquareCode,
  RemoveFormatting,
  Strikethrough,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { Attachment } from "@/components/admin/projects/attachment-node";
import { FormSelect } from "@/components/common/form-select";
import { TEXT_COLORS, HIGHLIGHT_COLORS } from "@/lib/projects/idea-doc";
import type { IdeaDoc } from "@/lib/projects/idea-doc";
import { cn } from "@/lib/utils";

export type IdeaEditorHandle = {
  insertAttachment: (attrs: {
    path: string;
    name: string;
    mime: string;
    size: number;
  }) => void;
  replaceContent: (doc: IdeaDoc) => void;
  appendContent: (nodes: unknown[]) => void;
  getDoc: () => IdeaDoc | null;
  focus: () => void;
};

const BLOCKS = [
  { label: "Normal text", level: 0 },
  { label: "Heading 1", level: 2 },
  { label: "Heading 2", level: 3 },
  { label: "Heading 3", level: 4 },
] as const;

function Tool({
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
        "grid size-8 shrink-0 place-items-center rounded-md transition disabled:opacity-30",
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
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-black/10" />;
}

function Swatches({
  label,
  icon,
  colors,
  active,
  onPick,
  onClear,
}: {
  label: string;
  icon: React.ReactNode;
  colors: readonly { name: string; value: string }[];
  active: string | null;
  onPick: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!holder.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={holder} className="relative shrink-0">
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        aria-expanded={open}
        title={label}
        className={cn(
          "grid size-8 place-items-center rounded-md transition",
          open || active
            ? "bg-black/[0.07] text-black"
            : "text-black/55 hover:bg-black/[0.06] hover:text-black",
        )}
      >
        <span className="relative grid place-items-center">
          {icon}
          <span
            aria-hidden
            className="absolute -bottom-1.5 h-[3px] w-4 rounded-full"
            style={{ background: active ?? "transparent" }}
          />
        </span>
      </button>

      {open ? (
        <div className="absolute top-full left-0 z-30 mt-1 w-40 rounded-xl border border-black/[0.09] bg-white p-2 shadow-[0_16px_40px_rgba(20,23,26,0.14)]">
          <div className="grid grid-cols-5 gap-1">
            {colors.map((color) => (
              <button
                key={color.value}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onPick(color.value);
                  setOpen(false);
                }}
                aria-label={color.name}
                title={color.name}
                className="size-6 rounded-md border border-black/10 transition hover:scale-110"
                style={{ background: color.value }}
              />
            ))}
          </div>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onClear();
              setOpen(false);
            }}
            className="mt-2 w-full rounded-md px-2 py-1 text-[11px] font-medium text-black/60 transition hover:bg-black/[0.05] hover:text-black"
          >
            None
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Toolbar({
  editor,
  onAttach,
  attaching,
}: {
  editor: Editor;
  onAttach?: () => void;
  attaching?: boolean;
}) {
  const setLink = useCallback(() => {
    const previous = String(editor.getAttributes("link").href ?? "");
    const href = window.prompt("Link address", previous);
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const safe = /^(https?:|mailto:|tel:)/i.test(href.trim())
      ? href.trim()
      : `https://${href.trim()}`;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: safe })
      .run();
  }, [editor]);

  const activeBlock = BLOCKS.find((block) =>
    block.level === 0
      ? editor.isActive("paragraph")
      : editor.isActive("heading", { level: block.level }),
  );

  return (
    <div className="z-20 flex shrink-0 flex-wrap items-center gap-0.5 border-b border-black/[0.07] bg-[#f8f8f3] px-2 py-1.5">
      <Tool
        label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2 className="size-4" />
      </Tool>
      <Tool
        label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2 className="size-4" />
      </Tool>
      <Divider />

      <FormSelect
        ariaLabel="Text style"
        value={String(activeBlock?.level ?? 0)}
        onValueChange={(value) => {
          const level = Number(value);
          if (level === 0) editor.chain().focus().setParagraph().run();
          else
            editor
              .chain()
              .focus()
              .setHeading({ level: level as 2 | 3 | 4 })
              .run();
        }}
        triggerSize="sm"
        triggerClassName="h-8 w-[118px] shrink-0 rounded-lg border-black/[0.09] bg-white px-2.5 text-xs text-black/70 shadow-sm transition hover:border-black/20"
        options={BLOCKS.map((block) => ({
          value: String(block.level),
          label: block.label,
        }))}
      />
      <Divider />

      <Tool
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </Tool>
      <Tool
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </Tool>
      <Tool
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" />
      </Tool>
      <Tool
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </Tool>

      <Swatches
        label="Text colour"
        icon={<Baseline className="size-4" />}
        colors={TEXT_COLORS}
        active={editor.getAttributes("textStyle").color ?? null}
        onPick={(value) => editor.chain().focus().setColor(value).run()}
        onClear={() => editor.chain().focus().unsetColor().run()}
      />
      <Swatches
        label="Highlight"
        icon={<Highlighter className="size-4" />}
        colors={HIGHLIGHT_COLORS}
        active={editor.getAttributes("highlight").color ?? null}
        onPick={(value) =>
          editor.chain().focus().setHighlight({ color: value }).run()
        }
        onClear={() => editor.chain().focus().unsetHighlight().run()}
      />

      <Tool
        label="Inline code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="size-4" />
      </Tool>
      <Tool
        label="Superscript"
        active={editor.isActive("superscript")}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      >
        <SupIcon className="size-4" />
      </Tool>
      <Tool
        label="Subscript"
        active={editor.isActive("subscript")}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
      >
        <SubIcon className="size-4" />
      </Tool>
      <Divider />

      <Tool label="Link" active={editor.isActive("link")} onClick={setLink}>
        <Link2 className="size-4" />
      </Tool>
      <Tool
        label="Remove link"
        disabled={!editor.isActive("link")}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        <Link2Off className="size-4" />
      </Tool>
      <Divider />

      <Tool
        label="Align left"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className="size-4" />
      </Tool>
      <Tool
        label="Align centre"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter className="size-4" />
      </Tool>
      <Tool
        label="Align right"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className="size-4" />
      </Tool>
      <Tool
        label="Justify"
        active={editor.isActive({ textAlign: "justify" })}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
      >
        <AlignJustify className="size-4" />
      </Tool>
      <Divider />

      <Tool
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </Tool>
      <Tool
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </Tool>
      <Tool
        label="Checklist"
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <ListChecks className="size-4" />
      </Tool>
      <Tool
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </Tool>
      <Tool
        label="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <SquareCode className="size-4" />
      </Tool>
      <Tool
        label="Divider line"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="size-4" />
      </Tool>
      <Divider />

      <Tool
        label="Clear formatting"
        onClick={() =>
          editor.chain().focus().unsetAllMarks().clearNodes().run()
        }
      >
        <RemoveFormatting className="size-4" />
      </Tool>

      {onAttach ? (
        <>
          <Divider />
          <Tool label="Attach a file" disabled={attaching} onClick={onAttach}>
            {attaching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Paperclip className="size-4" />
            )}
          </Tool>
        </>
      ) : null}
    </div>
  );
}

export function IdeaEditor({
  initialDoc,
  editable,
  placeholder,
  onChange,
  onAttach,
  attaching,
  ref,
}: {
  initialDoc: IdeaDoc;
  editable: boolean;
  placeholder?: string;
  onChange: (doc: unknown) => void;
  onAttach?: () => void;
  attaching?: boolean;
  ref?: Ref<IdeaEditorHandle>;
}) {
  const [, setTick] = useState(0);

  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noreferrer", target: "_blank" },
        },
      }),
      CodeBlockWithCopy,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder:
          placeholder ??
          "Start writing — plans, decisions, research, anything.",
      }),
      CharacterCount,
      Attachment,
    ],
    content: initialDoc.content.length ? initialDoc : undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "idea-prose", spellcheck: "true" },
      handleClick(view, _pos, event) {
        const anchor = (event.target as HTMLElement)?.closest("a");
        const href = anchor?.getAttribute("href");
        if (!href) return false;
        if (!view.editable || event.metaKey || event.ctrlKey) {
          window.open(href, "_blank", "noreferrer");
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    onTransaction: () => setTick((tick) => tick + 1),
  });

  useImperativeHandle(
    ref,
    () => ({
      insertAttachment(attrs) {
        editor
          ?.chain()
          .focus()
          .insertContent({ type: "attachment", attrs })
          .createParagraphNear()
          .run();
      },
      replaceContent(doc) {
        editor?.commands.setContent(doc, { emitUpdate: false });
      },
      appendContent(nodes) {
        editor
          ?.chain()
          .focus("end")
          .insertContentAt(editor.state.doc.content.size, nodes)
          .run();
      },
      getDoc() {
        return (editor?.getJSON() as IdeaDoc | undefined) ?? null;
      },
      focus() {
        editor?.chain().focus().run();
      },
    }),
    [editor],
  );

  if (!editor) {
    return <div className="h-full min-h-96 animate-pulse bg-black/[0.02]" />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {editable ? (
        <Toolbar editor={editor} onAttach={onAttach} attaching={attaching} />
      ) : null}

      <div className="idea-surface min-h-0 flex-1 overflow-y-auto py-4 pr-6 pl-3 sm:pr-8 sm:pl-4">
        <EditorContent editor={editor} />
      </div>

      {editable ? (
        <div className="flex justify-end border-t border-black/[0.06] px-4 py-1.5 text-[10px] text-black/55">
          {editor.storage.characterCount.words()} words
        </div>
      ) : null}
    </div>
  );
}
