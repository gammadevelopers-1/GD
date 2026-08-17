import { FileText, Info, KeyRound } from "lucide-react";
import { type Block, type CalloutTone, CALLOUT_LABEL } from "@/lib/projects/blocks";
import { cn } from "@/lib/utils";

// Read-only rendering of a card's blocks. Everyone with project access sees
// this; only an owner or the project lead gets the editor.

function Inline({ value }: { value: string }) {
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

function calloutClass(tone: CalloutTone) {
  if (tone === "warn") return "border-amber-200 bg-amber-50 text-amber-900";
  if (tone === "key")
    return "border-[#2fe85c]/35 bg-[#2fe85c]/[0.08] text-[#08743d]";
  return "border-black/[0.08] bg-black/[0.025] text-black/70";
}

function formatBytes(size: number) {
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function BlockView({
  blocks,
  signedUrls,
}: {
  blocks: Block[];
  signedUrls: Record<string, string>;
}) {
  if (!blocks.length) return null;

  return (
    <div className="space-y-2.5">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return block.level === 2 ? (
              <h4
                key={index}
                className="text-[15px] font-semibold tracking-[-0.02em]"
              >
                <Inline value={block.text} />
              </h4>
            ) : (
              <h5
                key={index}
                className="text-[13px] font-semibold tracking-[-0.02em] text-black/75"
              >
                <Inline value={block.text} />
              </h5>
            );

          case "text":
            return (
              <p
                key={index}
                className="text-[13px] leading-6 whitespace-pre-wrap text-black/70"
              >
                <Inline value={block.text} />
              </p>
            );

          case "bullet":
            return (
              <ul key={index} className="space-y-1">
                {block.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="flex items-start gap-2 text-[13px] leading-6 text-black/70"
                  >
                    <span className="mt-2.5 size-1 shrink-0 rounded-full bg-black/30" />
                    <span className="min-w-0">
                      <Inline value={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );

          case "callout":
            return (
              <div
                key={index}
                className={cn(
                  "rounded-xl border px-3 py-2.5",
                  calloutClass(block.tone),
                )}
              >
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase opacity-70">
                  <Info className="size-3" />
                  {CALLOUT_LABEL[block.tone]}
                </p>
                <p className="text-[13px] leading-6 whitespace-pre-wrap">
                  <Inline value={block.text} />
                </p>
              </div>
            );

          case "image":
            return signedUrls[block.path] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={index}
                src={signedUrls[block.path]}
                alt={block.alt}
                className="max-h-80 w-auto max-w-full rounded-xl border border-black/[0.08]"
              />
            ) : (
              <div
                key={index}
                className="flex h-20 items-center justify-center rounded-xl border border-dashed border-black/12 text-[11px] text-black/35"
              >
                Image unavailable
              </div>
            );

          case "file":
            return (
              <a
                key={index}
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
            // The name, never the value. Copying still happens in the vault,
            // where the grant is checked and the copy is audited.
            return (
              <div
                key={index}
                className="flex items-center gap-2.5 rounded-xl border border-[#2fe85c]/30 bg-[#2fe85c]/[0.06] px-3 py-2.5"
              >
                <KeyRound className="size-4 shrink-0 text-[#08743d]" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#08743d]">
                  {block.name}
                </span>
                <span className="shrink-0 text-[10px] text-black/40">
                  open on Technical
                </span>
              </div>
            );

          case "divider":
            return <hr key={index} className="border-black/[0.09]" />;
        }
      })}
    </div>
  );
}
