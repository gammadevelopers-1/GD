"use client";

import { useTransition } from "react";
import { CornerDownRight, Loader2, X } from "lucide-react";
import type { CarryOver } from "@/lib/projects/carry-over";
import type { SimpleFormState } from "@/lib/projects/form-state";

export function WeekCarryOver({
  items,
  weekId,
  canManage,
  accept,
  dismiss,
}: {
  items: CarryOver[];
  weekId: string;
  canManage: boolean;
  accept: (item: CarryOver) => Promise<SimpleFormState>;
  dismiss: (cardId: string, targetWeekId: string) => Promise<SimpleFormState>;
}) {
  const [pending, startTransition] = useTransition();

  if (!items.length) return null;

  return (
    <ul className="mb-2 space-y-1">
      {items.map((item) => (
        <li
          key={item.cardId}
          className="flex items-center gap-2 rounded-lg border border-dashed border-amber-300/70 bg-amber-50/60 px-2.5 py-1.5"
        >
          <CornerDownRight className="size-3 shrink-0 text-amber-700/70" />
          <span className="min-w-0 flex-1 truncate text-[12px] text-black/75">
            {item.title}
          </span>
          {item.assignedName ? (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-800">
              {item.assignedName.split(/\s+/)[0]}
            </span>
          ) : null}
          <span className="shrink-0 text-[10px] text-amber-800/80">
            from Week {item.fromWeek}
          </span>

          {canManage ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await accept(item);
                  })
                }
                title={`Add it here and close it on Week ${item.fromWeek} as moved`}
                className="inline-flex h-6 shrink-0 items-center rounded-md bg-[#15181b] px-2 text-[10px] font-semibold text-white transition hover:bg-black disabled:opacity-60"
              >
                {pending ? (
                  <Loader2 className="size-2.5 animate-spin" />
                ) : (
                  "Accept"
                )}
              </button>
              <button
                type="button"
                disabled={pending}
                aria-label={`Dismiss ${item.title}`}
                onClick={() =>
                  startTransition(async () => {
                    await dismiss(item.cardId, weekId);
                  })
                }
                className="grid size-6 shrink-0 place-items-center rounded-md text-black/35 transition hover:bg-black/[0.06] hover:text-black disabled:opacity-60"
              >
                <X className="size-3" />
              </button>
            </>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
