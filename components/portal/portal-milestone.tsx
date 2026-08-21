"use client";

import { useCallback, useOptimistic, useState, useTransition } from "react";
import { CalendarRange, Check, Loader2, PenLine } from "lucide-react";
import { DocView } from "@/components/portal/doc-view";
import { IdeaEditor } from "@/components/admin/projects/idea-editor";
import { useBoardDoc } from "@/components/admin/projects/use-board-doc";
import type { PortalItem, PortalWeek } from "@/lib/portal/types";
import { summarise, today, weekIsBehind } from "@/lib/portal/types";
import { EMPTY_DOC } from "@/lib/projects/idea-doc";
import type { SimpleFormState } from "@/lib/projects/form-state";
import { formatDate } from "@/lib/projects/format";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export type MilestoneActions = {
  setDone: (
    publicId: string,
    cardId: string,
    done: boolean,
  ) => Promise<SimpleFormState>;
  saveIdeas: (
    publicId: string,
    weekId: string,
    doc: string,
  ) => Promise<SimpleFormState>;
};

export function PortalMilestone({
  publicId,
  weeks,
  canEdit,
  actions,
}: {
  publicId: string;
  weeks: PortalWeek[];
  canEdit: boolean;
  actions: MilestoneActions;
}) {
  const now = today();
  const summary = summarise(weeks, now);

  if (!weeks.length) {
    return (
      <section className="card-surface rounded-2xl border border-black/[0.06] p-5">
        <p className="text-sm text-black/45">
          The weekly plan has not been set out yet.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {summary.total ? (
        <div className="card-surface flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-black/[0.06] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <CalendarRange className="size-4 text-black/35" />
            <h2 className="text-[14px] font-semibold tracking-[-0.025em]">
              {weeks.length} {weeks.length === 1 ? "week" : "weeks"} planned
            </h2>
          </div>
          <span className="ml-auto font-mono text-[10px] text-black/40">
            {summary.done}/{summary.total} done
          </span>
          <Progress
            value={summary.percent}
            aria-label="Milestone progress"
            className="h-2 w-full bg-black/[0.07]"
            indicatorClassName="rounded-full bg-[#2fe85c] transition-transform duration-500"
          />
        </div>
      ) : null}

      <ol className="space-y-3">
        {weeks.map((week) => (
          <Week
            key={week.id}
            publicId={publicId}
            week={week}
            now={now}
            isCurrent={summary.currentWeek?.id === week.id}
            canEdit={canEdit}
            actions={actions}
          />
        ))}
      </ol>
    </div>
  );
}

function Week({
  publicId,
  week,
  now,
  isCurrent,
  canEdit,
  actions,
}: {
  publicId: string;
  week: PortalWeek;
  now: string;
  isCurrent: boolean;
  canEdit: boolean;
  actions: MilestoneActions;
}) {
  const done = week.items.filter((item) => item.done).length;
  const complete = Boolean(week.completedAt);
  const behind = weekIsBehind(week, now);

  return (
    <li className="card-surface rounded-2xl border border-black/[0.06] p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        <h3 className="text-[14px] font-semibold tracking-[-0.025em]">
          Week {week.number}
        </h3>
        <span className="font-mono text-[10px] text-black/40">
          {week.startsOn ? `${formatDate(week.startsOn)} – ` : "due "}
          {formatDate(week.dueOn)}
        </span>

        {complete ? (
          <Badge tone="ok">Complete</Badge>
        ) : behind ? (
          <Badge tone="late">Behind</Badge>
        ) : isCurrent ? (
          <Badge tone="now">This week</Badge>
        ) : null}

        {week.items.length ? (
          <span className="ml-auto font-mono text-[10px] text-black/40">
            {done}/{week.items.length} done
          </span>
        ) : null}
      </div>

      {week.focus ? (
        <p className="mt-2.5 text-[12.5px] leading-6 text-black/50">
          {week.focus}
        </p>
      ) : null}

      {week.items.length ? (
        <ul className="mt-4 space-y-2">
          {week.items.map((item) =>
            canEdit ? (
              <TickableItem
                key={item.id}
                publicId={publicId}
                item={item}
                setDone={actions.setDone}
              />
            ) : (
              <StaticItem key={item.id} item={item} />
            ),
          )}
        </ul>
      ) : (
        <p className="mt-4 text-[12px] text-black/35">
          Nothing planned for this week yet.
        </p>
      )}

      <WeekNotes
        publicId={publicId}
        week={week}
        canEdit={canEdit}
        save={actions.saveIdeas}
      />
    </li>
  );
}

function StaticItem({ item }: { item: PortalItem }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-[5px] border",
          item.done
            ? "border-[#2fe85c] bg-[#2fe85c] text-[#0b3f1e]"
            : "border-black/20",
        )}
      >
        {item.done ? <Check className="size-3" /> : null}
      </span>
      <span
        className={cn(
          "text-[13px] leading-6",
          item.done ? "text-black/35 line-through" : "text-black/75",
        )}
      >
        {item.title}
      </span>
      <span className="sr-only">{item.done ? "Done" : "Not done"}</span>
    </li>
  );
}

function TickableItem({
  publicId,
  item,
  setDone,
}: {
  publicId: string;
  item: PortalItem;
  setDone: MilestoneActions["setDone"];
}) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const [done, setOptimisticDone] = useOptimistic(item.done);

  return (
    <li className="flex items-start gap-3">
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={done}
          disabled={pending}
          onChange={(event) => {
            const next = event.target.checked;
            setFailed(false);
            startTransition(async () => {
              setOptimisticDone(next);
              const result = await setDone(publicId, item.id, next);
              if (result.status === "error") setFailed(true);
            });
          }}
          className="mt-0.5 size-4 shrink-0 rounded-[5px] accent-[#2fe85c] focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none"
        />
        <span
          className={cn(
            "text-[13px] leading-6",
            done ? "text-black/35 line-through" : "text-black/75",
          )}
        >
          {item.title}
        </span>
      </label>
      {failed ? (
        <span role="alert" className="shrink-0 text-[12px] text-red-700">
          Not saved
        </span>
      ) : null}
    </li>
  );
}

function WeekNotes({
  publicId,
  week,
  canEdit,
  save,
}: {
  publicId: string;
  week: PortalWeek;
  canEdit: boolean;
  save: MilestoneActions["saveIdeas"];
}) {
  const [writing, setWriting] = useState(false);
  const hasNotes = Boolean(week.ideaDoc?.content.length);

  if (!hasNotes && !canEdit) return null;

  return (
    <div className="mt-5 border-t border-black/[0.06] pt-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-[10px] tracking-[0.06em] text-black/35 uppercase">
          Notes
        </h4>
        {canEdit && !writing ? (
          <button
            type="button"
            onClick={() => setWriting(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-medium text-black/45 transition hover:bg-black/[0.045] hover:text-black focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none"
          >
            <PenLine className="size-3.5" />
            Write
          </button>
        ) : null}
      </div>

      <div className="mt-3">
        {writing ? (
          <NotesEditor publicId={publicId} week={week} save={save} />
        ) : hasNotes && week.ideaDoc ? (
          <DocView doc={week.ideaDoc} />
        ) : (
          <p className="text-[13px] text-black/35">
            Nothing written for this week yet.
          </p>
        )}
      </div>
    </div>
  );
}

function NotesEditor({
  publicId,
  week,
  save,
}: {
  publicId: string;
  week: PortalWeek;
  save: MilestoneActions["saveIdeas"];
}) {
  const perform = useCallback(
    (weekId: string, doc: string) => save(publicId, weekId, doc),
    [publicId, save],
  );

  const board = useBoardDoc(week.id, week.ideaDoc ?? EMPTY_DOC, perform);

  return (
    <div>
      <div className="rounded-2xl border border-black/[0.09] bg-white">
        <IdeaEditor
          initialDoc={week.ideaDoc ?? EMPTY_DOC}
          editable
          placeholder="Anything you want the team to see this week"
          onChange={board.onChange}
        />
      </div>
      <p
        role="status"
        className="mt-2.5 flex items-center gap-1.5 text-[12px] text-black/40"
      >
        {board.status === "saving" ? (
          <>
            <Loader2 className="size-3 animate-spin" /> Saving
          </>
        ) : board.status === "error" ? (
          <span className="text-red-700">
            {board.message ?? "Those notes were not saved."}
          </span>
        ) : board.unsaved ? (
          "Unsaved changes"
        ) : (
          "Saved automatically"
        )}
      </p>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "ok" | "late" | "now";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10.5px] font-semibold",
        tone === "ok"
          ? "border-[#2fe85c]/30 bg-[#2fe85c]/12 text-[#08743d]"
          : tone === "late"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-black/[0.09] bg-black/[0.04] text-black/55",
      )}
    >
      {children}
    </span>
  );
}
