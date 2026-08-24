"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Heading2,
  Image as ImageIcon,
  Info,
  KeyRound,
  List,
  Loader2,
  Minus,
  Paperclip,
  Plus,
  Star,
  Text as TextIcon,
  Trash2,
} from "lucide-react";
import {
  type Block,
  type CalloutTone,
  CALLOUT_LABEL,
  TEXT_MAX,
} from "@/lib/projects/blocks";
import { FOCUS_RING, INPUT_SMALL } from "@/lib/admin-ui";
import { FormSelect } from "@/components/common/form-select";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type CredentialOption = { id: string; name: string };

type UploadResult = {
  status: "idle" | "success" | "error";
  message: string | null;
  path?: string;
  name?: string;
  size?: number;
};

export function InlineText({ value }: { value: string }) {
  const parts = value.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code
              key={index}
              className="rounded bg-black/[0.06] px-1 py-0.5 font-mono text-[0.9em]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
  className,
  rows = 1,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [value]);

  return (
    <Textarea
      ref={ref}
      rows={rows}
      value={value}
      maxLength={TEXT_MAX}
      placeholder={placeholder}
      variant="bare"
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "w-full resize-none bg-transparent leading-6 outline-none placeholder:text-black/25",
        className,
      )}
    />
  );
}

const ADD_MENU: Array<{
  type: Block["type"];
  label: string;
  icon: typeof TextIcon;
  hint: string;
}> = [
  { type: "text", label: "Text", icon: TextIcon, hint: "Plain paragraph" },
  { type: "heading", label: "Heading", icon: Heading2, hint: "Section title" },
  { type: "bullet", label: "Bullets", icon: List, hint: "A short list" },
  { type: "callout", label: "Callout", icon: Star, hint: "Highlight or note" },
  { type: "image", label: "Image", icon: ImageIcon, hint: "Upload a picture" },
  { type: "file", label: "Attachment", icon: Paperclip, hint: "Upload a file" },
  {
    type: "credential",
    label: "Credential",
    icon: KeyRound,
    hint: "Link one from the vault",
  },
  { type: "divider", label: "Divider", icon: Minus, hint: "A separator" },
];

export function BlockEditor({
  blocks,
  onChange,
  credentials,
  upload,
  signedUrls,
  allowedTypes,
  addLabel,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  credentials: CredentialOption[];
  upload: (file: File) => Promise<UploadResult>;
  signedUrls: Record<string, string>;
  allowedTypes?: Array<Block["type"]>;
  addLabel?: string;
}) {
  const menu = allowedTypes
    ? ADD_MENU.filter((entry) => allowedTypes.includes(entry.type))
    : ADD_MENU;
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function replace(index: number, block: Block) {
    onChange(blocks.map((current, i) => (i === index ? block : current)));
  }

  function remove(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    const next = index + delta;
    if (next < 0 || next >= blocks.length) return;
    const copy = [...blocks];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onChange(copy);
  }

  function add(type: Block["type"]) {
    setAdding(false);
    setUploadError(null);

    if (type === "image") {
      imageInput.current?.click();
      return;
    }
    if (type === "file") {
      fileInput.current?.click();
      return;
    }

    const created: Block =
      type === "heading"
        ? { type: "heading", level: 2, text: "" }
        : type === "bullet"
          ? { type: "bullet", items: [""] }
          : type === "callout"
            ? { type: "callout", tone: "note", text: "" }
            : type === "credential"
              ? {
                  type: "credential",
                  credentialId: credentials[0]?.id ?? "",
                  name: credentials[0]?.name ?? "",
                }
              : type === "divider"
                ? { type: "divider" }
                : { type: "text", text: "" };

    if (created.type === "credential" && !credentials.length) {
      setUploadError(
        "No credentials on this project yet. Add one on the Technical tab first.",
      );
      return;
    }

    onChange([...blocks, created]);
  }

  async function onFilePicked(file: File | undefined, kind: "image" | "file") {
    if (!file) return;
    setUploading(file.name);
    setUploadError(null);

    const result = await upload(file);
    setUploading(null);

    if (result.status !== "success" || !result.path) {
      setUploadError(result.message ?? "That file could not be attached.");
      return;
    }

    onChange([
      ...blocks,
      kind === "image"
        ? { type: "image", path: result.path, alt: "" }
        : {
            type: "file",
            path: result.path,
            name: result.name ?? file.name,
            size: result.size ?? file.size,
          },
    ]);
  }

  return (
    <div className="space-y-2">
      <input
        ref={imageInput}
        type="file"
        className="sr-only"
        accept="image/*"
        onChange={(event) => {
          void onFilePicked(event.target.files?.[0], "image");
          event.target.value = "";
        }}
      />
      <input
        ref={fileInput}
        type="file"
        className="sr-only"
        accept="image/*,.pdf,.txt,.md,.csv,.doc,.docx,.xlsx"
        onChange={(event) => {
          void onFilePicked(event.target.files?.[0], "file");
          event.target.value = "";
        }}
      />

      {blocks.map((block, index) => (
        <div
          key={index}
          className="group/block relative rounded-xl px-2 py-1.5 transition-colors hover:bg-black/[0.018]"
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <BlockFields
                block={block}
                credentials={credentials}
                signedUrls={signedUrls}
                onChange={(next) => replace(index, next)}
              />
            </div>

            <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within/block:opacity-100 sm:group-hover/block:opacity-100">
              <Button
                variant="admin-icon"
                size="none"
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move block up"
                className="disabled:opacity-25"
              >
                <ChevronUp className="size-3.5" />
              </Button>
              <Button
                variant="admin-icon"
                size="none"
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === blocks.length - 1}
                aria-label="Move block down"
                className="disabled:opacity-25"
              >
                <ChevronDown className="size-3.5" />
              </Button>
              <Button
                variant="admin-icon-danger"
                size="none"
                type="button"
                onClick={() => remove(index)}
                aria-label="Delete block"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      {uploading ? (
        <p className="flex items-center gap-2 px-2 text-[11px] text-black/45">
          <Loader2 className="size-3 animate-spin" />
          Uploading {uploading}…
        </p>
      ) : null}

      {uploadError ? (
        <p className="flex items-center gap-1.5 px-2 text-[11px] font-medium text-red-700">
          <AlertTriangle className="size-3" />
          {uploadError}
        </p>
      ) : null}

      {adding ? (
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-black/[0.08] bg-white p-1.5 sm:grid-cols-4">
          {menu.map((entry) => (
            <Button
              variant="bare"
              size="none"
              key={entry.type}
              type="button"
              onClick={() => add(entry.type)}
              className={cn(
                "flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-black/[0.04]",
                FOCUS_RING,
              )}
            >
              <entry.icon className="mt-0.5 size-3.5 shrink-0 text-black/40" />
              <span className="min-w-0">
                <span className="block text-[12px] font-medium">
                  {entry.label}
                </span>
                <span className="block truncate text-[10px] text-black/35">
                  {entry.hint}
                </span>
              </span>
            </Button>
          ))}
        </div>
      ) : (
        <Button
          variant="admin-ghost"
          size="none"
          type="button"
          onClick={() => setAdding(true)}
          className="h-8 w-full justify-start px-2"
        >
          <Plus className="size-3.5" />
          {addLabel ?? "Add a block"}
        </Button>
      )}

      {!allowedTypes ? (
        <p className="px-2 text-[10px] text-black/30">
          Use **bold**, *italic* and `code` inside any text.
        </p>
      ) : null}
    </div>
  );
}

function BlockFields({
  block,
  credentials,
  signedUrls,
  onChange,
}: {
  block: Block;
  credentials: CredentialOption[];
  signedUrls: Record<string, string>;
  onChange: (block: Block) => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <div className="flex items-center gap-2">
          <FormSelect
            value={String(block.level)}
            onValueChange={(value) =>
              onChange({
                ...block,
                level: Number(value) === 3 ? 3 : 2,
              })
            }
            ariaLabel="Heading level"
            triggerSize="sm"
            triggerClassName={cn(
              INPUT_SMALL,
              "h-7 w-[68px] shrink-0 rounded-lg px-2 text-[11px]",
            )}
            options={[
              { value: "2", label: "H2" },
              { value: "3", label: "H3" },
            ]}
          />
          <AutoTextarea
            value={block.text}
            onChange={(text) => onChange({ ...block, text })}
            placeholder="Section heading"
            className={cn(
              "font-semibold tracking-[-0.02em]",
              block.level === 2 ? "text-[17px]" : "text-[15px]",
            )}
          />
        </div>
      );

    case "text":
      return (
        <AutoTextarea
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
          placeholder="Write anything — context, a decision, what you tried…"
          className="text-[13px] text-black/75"
        />
      );

    case "bullet":
      return (
        <div className="space-y-1">
          {block.items.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="mt-2.5 size-1 shrink-0 rounded-full bg-black/30" />
              <AutoTextarea
                value={item}
                onChange={(value) =>
                  onChange({
                    ...block,
                    items: block.items.map((current, i) =>
                      i === index ? value : current,
                    ),
                  })
                }
                placeholder="List item"
                className="text-[13px] text-black/75"
              />
              <Button
                variant="admin-icon"
                size="none"
                type="button"
                onClick={() =>
                  onChange({
                    ...block,
                    items: block.items.filter((_, i) => i !== index),
                  })
                }
                aria-label="Remove list item"
                className="mt-0.5 size-6"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="admin-ghost"
            size="none"
            type="button"
            onClick={() => onChange({ ...block, items: [...block.items, ""] })}
            className="h-7 px-2"
          >
            <Plus className="size-3" />
            Item
          </Button>
        </div>
      );

    case "callout":
      return (
        <div
          className={cn(
            "rounded-xl border px-3 py-2.5",
            calloutClass(block.tone),
          )}
        >
          <div className="mb-1.5 flex items-center gap-2">
            <Info className="size-3.5 shrink-0 opacity-60" />
            <FormSelect
              value={block.tone}
              onValueChange={(value) =>
                onChange({
                  ...block,
                  tone: value as CalloutTone,
                })
              }
              ariaLabel="Callout kind"
              triggerSize="sm"
              triggerClassName="h-7 w-[104px] rounded-lg border-black/10 bg-white/75 px-2 text-[10px] font-semibold shadow-sm"
              options={(["note", "warn", "key"] as CalloutTone[]).map(
                (tone) => ({
                  value: tone,
                  label: CALLOUT_LABEL[tone],
                }),
              )}
            />
          </div>
          <AutoTextarea
            value={block.text}
            onChange={(text) => onChange({ ...block, text })}
            placeholder="What must nobody miss?"
            className="text-[13px]"
          />
        </div>
      );

    case "image":
      return (
        <figure className="space-y-1.5">
          {signedUrls[block.path] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signedUrls[block.path]}
              alt={block.alt}
              className="max-h-80 w-auto max-w-full rounded-xl border border-black/[0.08]"
            />
          ) : (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-black/12 text-[11px] text-black/35">
              Image attached
            </div>
          )}
          <Input
            variant="admin-sm"
            value={block.alt}
            onChange={(event) =>
              onChange({ ...block, alt: event.target.value })
            }
            placeholder="Describe the image (for screen readers)"
            className={cn("h-7 w-full")}
          />
        </figure>
      );

    case "file":
      return (
        <a
          href={signedUrls[block.path] ?? "#"}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-2.5 rounded-xl border border-black/[0.08] px-3 py-2.5 transition hover:border-black/20 hover:bg-white"
        >
          <FileText className="size-4 shrink-0 text-black/40" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium">
              {block.name}
            </span>
            <span className="block text-[10px] text-black/35">
              {formatBytes(block.size)}
            </span>
          </span>
        </a>
      );

    case "credential":
      return (
        <div className="flex items-center gap-2.5 rounded-xl border border-[#2fe85c]/30 bg-[#2fe85c]/[0.06] px-3 py-2.5">
          <KeyRound className="size-4 shrink-0 text-[#08743d]" />
          <FormSelect
            value={block.credentialId}
            onValueChange={(value) => {
              const chosen = credentials.find((option) => option.id === value);
              onChange({
                ...block,
                credentialId: value,
                name: chosen?.name ?? block.name,
              });
            }}
            ariaLabel="Credential"
            triggerSize="sm"
            triggerClassName={cn(INPUT_SMALL, "h-8 min-w-0 flex-1")}
            options={
              credentials.length > 0
                ? credentials.map((option) => ({
                    value: option.id,
                    label: option.name,
                  }))
                : [
                    {
                      value: "",
                      label: "No credentials available",
                      disabled: true,
                    },
                  ]
            }
          />
          <span className="shrink-0 text-[10px] text-black/40">
            name only — open it on Technical
          </span>
        </div>
      );

    case "divider":
      return <hr className="my-1 border-black/[0.09]" />;
  }
}

function calloutClass(tone: CalloutTone) {
  if (tone === "warn") return "border-amber-200 bg-amber-50 text-amber-900";
  if (tone === "key")
    return "border-[#2fe85c]/35 bg-[#2fe85c]/[0.08] text-[#08743d]";
  return "border-black/[0.08] bg-black/[0.025] text-black/70";
}

export function formatBytes(size: number) {
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
