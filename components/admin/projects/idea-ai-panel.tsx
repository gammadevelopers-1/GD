"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowRight,
  ArrowUp,
  Check,
  Lightbulb,
  Loader2,
  PenLine,
  RotateCcw,
  Sparkles,
  TextQuote,
  Wand2,
  X,
} from "lucide-react";
import {
  IDEA_PROMPT_MAX,
  type IdeaAiAction,
  type IdeaAiState,
  type IdeaDraftBlock,
} from "@/lib/projects/idea-draft";
import { IDLE_FORM } from "@/lib/projects/form-state";
import { FOCUS_RING, FOCUS_RING_DARK } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export type AskIdeaAi = (
  state: IdeaAiState,
  formData: FormData,
) => Promise<IdeaAiState>;

export type IdeaAiConfig = { projectId: string; ask: AskIdeaAi };

const QUICK = [
  { action: "brainstorm", label: "Brainstorm ideas", icon: Lightbulb },
  { action: "continue", label: "Continue writing", icon: PenLine },
  { action: "improve", label: "Improve writing", icon: Wand2 },
  { action: "summarise", label: "Summarise", icon: TextQuote },
] as const satisfies ReadonlyArray<{
  action: IdeaAiAction;
  label: string;
  icon: typeof Lightbulb;
}>;

export function AskAiTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <Button
      variant="bare"
      size="none"
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onOpen}
      title="Ask AI to help write"
      className={cn(
        "group ring-gd-mint-bright/35 hover:ring-gd-mint-bright/70 relative ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 overflow-hidden rounded-full bg-[linear-gradient(120deg,var(--color-gd-panel-dark),var(--color-gd-green-ink)_62%,var(--color-gd-panel-dark))] px-3 text-xs font-semibold text-white/90 shadow-[0_2px_10px_rgba(20,23,26,0.22)] ring-1 transition duration-200 ring-inset hover:-translate-y-px hover:text-white hover:shadow-[0_8px_22px_rgba(47,232,92,0.4)] active:translate-y-0",
        FOCUS_RING,
      )}
    >
      <Sparkles className="text-gd-mint-bright relative size-3.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90 motion-reduce:transition-none" />
      <span className="relative">Ask AI</span>
    </Button>
  );
}

export function AskAiPanel({
  config,
  note,
  selection,
  onInsert,
  onClose,
}: {
  config: IdeaAiConfig;
  note: string;
  selection: string;
  onInsert: (blocks: IdeaDraftBlock[], replaceSelection: boolean) => void;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [blocks, setBlocks] = useState<IdeaDraftBlock[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startDraft] = useTransition();
  const last = useRef<{ action: IdeaAiAction; prompt: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const hasSelection = selection.trim().length > 0;

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  function run(action: IdeaAiAction, text: string) {
    if (pending) return;
    if (action === "custom" && !text.trim()) return;

    last.current = { action, prompt: text };
    setError(null);
    setBlocks(null);

    const data = new FormData();
    data.set("projectId", config.projectId);
    data.set("action", action);
    data.set("prompt", text.slice(0, IDEA_PROMPT_MAX));
    data.set("document", note);
    data.set("selection", selection);

    startDraft(async () => {
      const result = await config.ask(IDLE_FORM, data);
      if (result.blocks?.length) setBlocks(result.blocks);
      else setError(result.message ?? "Nothing came back.");
    });
  }

  return (
    <div
      role="dialog"
      aria-label="Ask AI"
      className="animate-ai-rise absolute inset-x-3 bottom-3 z-30 flex max-h-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_26px_64px_rgba(20,23,26,0.24),0_0_0_1px_rgba(20,23,26,0.06),0_0_0_5px_rgba(47,232,92,0.07)] sm:inset-x-6 sm:bottom-4"
    >
      <div className="bg-gd-panel-dark flex shrink-0 items-center gap-2.5 bg-[linear-gradient(120deg,var(--color-gd-panel-dark),var(--color-gd-green-ink)_140%)] px-4 py-3 text-white">
        <span className="relative grid size-7.5 shrink-0 place-items-center">
          <span
            aria-hidden
            className="bg-brand/50 animate-ai-halo absolute inset-0 rounded-[12px]"
          />
          <span className="from-gd-mint-bright to-gd-green relative grid size-7.5 place-items-center rounded-[10px] bg-gradient-to-br text-[#06251a] shadow-[0_4px_14px_rgba(47,232,92,0.42)]">
            <Sparkles className="size-4" />
          </span>
        </span>

        <span className="min-w-0">
          <span className="block text-[13.5px] leading-tight font-semibold">
            Ask AI
          </span>
          <span className="text-gd-mint-bright/85 block font-mono text-[8.5px] tracking-[0.16em] uppercase">
            {hasSelection ? "Rewriting your selection" : "Writing assistant"}
          </span>
        </span>

        <Button
          variant="bare"
          size="none"
          type="button"
          onClick={onClose}
          aria-label="Close Ask AI"
          className={cn(
            "ml-auto grid size-7 shrink-0 place-items-center rounded-lg bg-white/15 text-white/80 transition duration-200 hover:rotate-90 hover:bg-white/25 hover:text-white",
            FOCUS_RING_DARK,
          )}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {pending ? (
          <Drafting />
        ) : blocks ? (
          <>
            <div className="relative overflow-hidden rounded-[13px] border border-black/10 bg-[#faf9f4]">
              <span
                aria-hidden
                className="from-gd-mint-bright to-gd-green absolute top-3 bottom-3 left-0 w-[3px] rounded-r-[3px] bg-gradient-to-b"
              />
              <ScrollArea
                className="pr-2.5"
                viewportClassName="max-h-40 sm:max-h-52"
              >
                <div className="py-3.5 pr-2 pl-5 text-[13px] leading-[1.62] text-black/80">
                  <DraftPreview blocks={blocks} />
                </div>
              </ScrollArea>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="admin-primary"
                  size="none"
                  type="button"
                  onClick={() => {
                    onInsert(blocks, hasSelection);
                    onClose();
                  }}
                  className="h-8 px-3 text-xs"
                >
                  <Check className="size-3.5" />
                  {hasSelection ? "Replace selection" : "Insert"}
                </Button>

                {hasSelection ? (
                  <Button
                    variant="admin-secondary"
                    size="none"
                    type="button"
                    onClick={() => {
                      onInsert(blocks, false);
                      onClose();
                    }}
                    className="h-8 px-3 text-xs"
                  >
                    Insert below
                  </Button>
                ) : null}

                <Button
                  variant="admin-secondary"
                  size="none"
                  type="button"
                  onClick={() => {
                    const previous = last.current;
                    if (previous) run(previous.action, previous.prompt);
                  }}
                  className="h-8 px-3 text-xs"
                >
                  <RotateCcw className="size-3.5" />
                  Retry
                </Button>

                <Button
                  variant="admin-ghost"
                  size="none"
                  type="button"
                  onClick={() => {
                    setBlocks(null);
                    setPrompt("");
                  }}
                  className="h-8 px-2.5"
                >
                  New prompt
                </Button>
              </div>

              <span className="inline-flex items-center gap-1.5 font-mono text-[8.5px] tracking-[0.08em] text-black/35">
                <Sparkles className="size-3" />
                AI draft · check it
              </span>
            </div>
          </>
        ) : (
          <>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                run("custom", prompt);
              }}
              className="focus-within:border-gd-green flex h-11 items-center gap-2.5 rounded-[13px] border-[1.5px] border-black/[0.12] bg-[#faf9f4] pr-1.5 pl-3 transition duration-150 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(47,232,92,0.14)]"
            >
              <Sparkles className="text-gd-green-deep size-4 shrink-0" />
              <Input
                ref={input}
                variant="bare"
                value={prompt}
                maxLength={IDEA_PROMPT_MAX}
                onChange={(event) => setPrompt(event.target.value)}
                aria-label="Tell AI what to write"
                placeholder={
                  hasSelection
                    ? "Tell AI how to change the selection…"
                    : "Tell AI what to write…"
                }
                className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[13.5px] shadow-none outline-none placeholder:text-black/35 focus-visible:ring-0"
              />
              <Button
                variant="bare"
                size="none"
                type="submit"
                disabled={!prompt.trim()}
                aria-label="Write it"
                title="Write it"
                className={cn(
                  "group bg-brand grid size-8 shrink-0 place-items-center rounded-[10px] text-[#06251a] transition duration-150 hover:-translate-y-px hover:scale-105 hover:shadow-[0_8px_18px_rgba(47,232,92,0.4)] active:scale-95 disabled:pointer-events-none disabled:opacity-40",
                  FOCUS_RING,
                )}
              >
                <ArrowUp className="size-4 transition-transform duration-150 group-hover:-translate-y-px motion-reduce:transition-none" />
              </Button>
            </form>

            {error ? (
              <p role="alert" className="mt-2.5 text-[11.5px] text-red-600">
                {error}
              </p>
            ) : null}

            <p className="mt-4 mb-2 font-mono text-[8.5px] tracking-[0.16em] text-black/40 uppercase">
              Quick actions
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              {QUICK.map((quick) => (
                <Button
                  key={quick.action}
                  variant="bare"
                  size="none"
                  type="button"
                  onClick={() => run(quick.action, "")}
                  className={cn(
                    "group hover:border-brand/60 hover:bg-brand/[0.07] hover:text-gd-green-ink flex items-center gap-2.5 rounded-xl border border-black/10 bg-white p-2.5 text-left text-[12.5px] font-medium text-black/75 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-8px_rgba(47,232,92,0.4)] active:translate-y-0",
                    FOCUS_RING,
                  )}
                >
                  <span className="bg-brand/[0.13] text-gd-green-deep group-hover:bg-brand grid size-7 shrink-0 place-items-center rounded-lg transition duration-200 group-hover:scale-105 group-hover:text-[#06251a]">
                    <quick.icon className="size-4" />
                  </span>
                  {quick.label}
                  <ArrowRight className="text-gd-green-deep ml-auto size-3.5 shrink-0 -translate-x-1 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none" />
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Drafting() {
  return (
    <div className="px-0.5 pt-1 pb-0.5">
      <div className="flex items-center gap-2.5 text-[13.5px] font-semibold">
        <span className="from-gd-mint-bright to-gd-green grid size-7 shrink-0 place-items-center rounded-[9px] bg-gradient-to-br text-[#06251a]">
          <Loader2 className="size-4 animate-spin" />
        </span>
        <span className="animate-ai-shimmer bg-[linear-gradient(100deg,rgba(20,23,26,0.32)_20%,var(--color-gd-green-ink)_50%,rgba(20,23,26,0.32)_80%)] bg-[length:200%_100%] bg-clip-text text-transparent">
          Writing your draft…
        </span>
      </div>
      <div className="mt-3.5 flex flex-col gap-2">
        <Skeleton className="h-2.5 rounded-full" />
        <Skeleton className="h-2.5 w-[92%] rounded-full" />
        <Skeleton className="h-2.5 w-[74%] rounded-full" />
      </div>
    </div>
  );
}

function DraftPreview({ blocks }: { blocks: IdeaDraftBlock[] }) {
  return blocks.map((block, index) => {
    const key = `${block.type}-${index}`;

    if (block.type === "heading") {
      return (
        <h3
          key={key}
          className="font-display mt-3 mb-2 text-[15px] font-semibold tracking-[-0.02em] text-black/85 first:mt-0"
        >
          {block.text}
        </h3>
      );
    }
    if (block.type === "bullet") {
      return (
        <ul key={key} className="mb-2 list-disc pl-4.5 last:mb-0">
          {block.items.map((item) => (
            <li key={item} className="mb-1 last:mb-0">
              {item}
            </li>
          ))}
        </ul>
      );
    }
    if (block.type === "numbered") {
      return (
        <ol key={key} className="mb-2 list-decimal pl-4.5 last:mb-0">
          {block.items.map((item) => (
            <li key={item} className="mb-1 last:mb-0">
              {item}
            </li>
          ))}
        </ol>
      );
    }
    if (block.type === "quote") {
      return (
        <blockquote
          key={key}
          className="mb-2 border-l-2 border-black/15 pl-3 italic last:mb-0"
        >
          {block.text}
        </blockquote>
      );
    }
    return (
      <p key={key} className="mb-2 last:mb-0">
        {block.text}
      </p>
    );
  });
}
