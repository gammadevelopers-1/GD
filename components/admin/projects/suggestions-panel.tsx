"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, X } from "lucide-react";
import type { SuggestionGroup } from "@/lib/projects/suggestions";
import { CARD_STATUS_CHIP, CARD_STATUS_LABEL } from "@/lib/projects/board";
import { formatDate } from "@/lib/projects/format";
import { cn } from "@/lib/utils";

export function SuggestionsPanel({
  groups,
  open,
  onClose,
}: {
  groups: SuggestionGroup[];
  open: boolean;
  onClose: () => void;
}) {
  if (!groups.length) return null;

  const [latest, ...older] = groups;

  return (
    <aside
      inert={!open}
      aria-label="Unfinished work"
      className={cn(
        "absolute inset-y-0 right-0 z-30 w-full max-w-80 overflow-y-auto border-l border-black/[0.09] bg-[#f8f8f3] transition-transform duration-300 ease-out motion-reduce:transition-none",
        open
          ? "translate-x-0 shadow-[-18px_0_40px_rgba(20,23,26,0.08)]"
          : "translate-x-full",
      )}
    >
      <div className="sticky top-0 flex items-center gap-2 border-b border-black/[0.07] bg-[#f8f8f3] px-4 py-2.5">
        <Sparkles className="size-3.5 text-[#08743d]" />
        <h2 className="text-[12px] font-semibold tracking-[-0.01em]">
          Unfinished work
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close suggestions"
          className="ml-auto grid size-7 place-items-center rounded-lg text-black/40 transition hover:bg-black/[0.06] hover:text-black"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="p-4">
        <p className="font-mono text-[9px] tracking-[0.14em] text-black/35 uppercase">
          Week {latest.weekNumber}
        </p>
        <ul className="mt-2 space-y-2">
          {latest.items.map((item) => (
            <SuggestionRow key={item.cardId} item={item} />
          ))}
        </ul>

        {older.length ? <Earlier groups={older} /> : null}
      </div>
    </aside>
  );
}

function Earlier({ groups }: { groups: SuggestionGroup[] }) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-black/45 transition hover:text-black"
      >
        <ChevronDown
          className={cn("size-3 transition", open && "rotate-180")}
        />
        Earlier weeks
      </button>
      {open
        ? groups.map((group) => (
            <div key={group.weekNumber} className="mt-3">
              <p className="font-mono text-[9px] tracking-[0.14em] text-black/30 uppercase">
                Week {group.weekNumber}
              </p>
              <ul className="mt-2 space-y-2">
                {group.items.map((item) => (
                  <SuggestionRow key={item.cardId} item={item} />
                ))}
              </ul>
            </div>
          ))
        : null}
    </>
  );
}

function SuggestionRow({ item }: { item: SuggestionGroup["items"][number] }) {
  const [open, setOpen] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="w-full rounded-xl border border-black/[0.06] bg-white px-3 py-2.5 text-left transition hover:border-black/[0.14]"
      >
        <span className="block text-[12px] font-medium text-black/75">
          {item.title}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
              CARD_STATUS_CHIP[item.status],
            )}
          >
            {CARD_STATUS_LABEL[item.status]}
          </span>
          <span className="text-[10px] text-black/35">
            Week {item.weekNumber} · due {formatDate(item.weekDueOn)}
          </span>
        </span>
        {open ? (
          <span className="mt-2 block border-t border-black/[0.06] pt-2 text-[11px] leading-4 text-black/50">
            {item.reason ? <span className="block">{item.reason}</span> : null}
            <span className="block text-black/35">
              Added by {item.createdBy ?? "someone on the team"}
            </span>
          </span>
        ) : null}
      </button>
    </li>
  );
}
