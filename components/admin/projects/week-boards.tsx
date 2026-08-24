"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  Lightbulb,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  AddCardForm,
  type BoardActions,
  BoardColumn,
  CardRow,
  EmptyNote,
} from "@/components/admin/projects/boards-panel";
import type { MilestoneWeek } from "@/data/project-detail";
import type { CredentialOption } from "@/components/admin/projects/block-editor";
import { IDLE_FORM } from "@/lib/projects/form-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function WeekBoardArea({
  projectId,
  week,
  nextWeek,
  canManage,
  canUpdateStatus,
  credentials,
  signedUrls,
  actions,
}: {
  projectId: string;
  week: MilestoneWeek;
  nextWeek: MilestoneWeek | null;
  canManage: boolean;
  canUpdateStatus: boolean;
  credentials: CredentialOption[];
  signedUrls: Record<string, string>;
  actions: BoardActions;
}) {
  const [showWork, setShowWork] = useState(false);
  const [organise, organiseAction, organising] = useActionState(
    actions.organiseWeek,
    IDLE_FORM,
  );

  const undone = week.workCards.filter(
    (card) => card.status !== "completed",
  ).length;

  const cardProps = {
    projectId,
    nextWeek,
    canManage,
    canUpdateStatus,
    credentials,
    signedUrls,
    actions,
  };

  return (
    <div className="relative min-h-72 overflow-hidden rounded-xl border border-black/[0.07] bg-white">
      <div inert={showWork} className="min-h-72">
        <BoardColumn
          title="Idea Board"
          hint="Anything worth doing this week"
          icon={Lightbulb}
          count={week.ideaCards.length}
          tone="idea"
        >
          {week.ideaCards.map((card) => (
            <CardRow key={card.id} card={card} {...cardProps} />
          ))}

          {canManage ? (
            <AddCardForm
              projectId={projectId}
              weekId={week.id}
              action={actions.createCard}
            />
          ) : null}

          {!week.ideaCards.length && !canManage ? (
            <EmptyNote>No ideas captured for this week.</EmptyNote>
          ) : null}
        </BoardColumn>
      </div>

      <div
        aria-hidden
        onClick={() => setShowWork(false)}
        className={cn(
          "absolute inset-0 z-10 bg-black/10 transition-opacity duration-200 ease-in-out motion-reduce:transition-none",
          showWork ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <Button
        variant="bare"
        size="none"
        type="button"
        onClick={() => setShowWork(true)}
        title={`Open week ${week.number} work board`}
        className={cn(
          "group absolute top-1/2 right-0 z-20 flex -translate-y-1/2 items-center gap-1.5 rounded-l-xl bg-[#15181b] py-3.5 pr-2 pl-1.5 text-white shadow-[0_10px_30px_rgba(20,23,26,0.18)] transition hover:pr-3 focus-visible:ring-2 focus-visible:ring-[#2fe85c]/60 focus-visible:outline-none",
          showWork && "pointer-events-none opacity-0",
        )}
      >
        <ChevronLeft className="size-3 shrink-0 text-[#2fe85c] transition group-hover:-translate-x-0.5" />
        <span className="text-[10px] font-semibold tracking-[0.04em] [writing-mode:vertical-rl]">
          Work Board
        </span>
        {undone ? (
          <span className="rounded-full bg-[#2fe85c]/20 px-1 py-0.5 font-mono text-[9px] text-[#2fe85c]">
            {undone}
          </span>
        ) : null}
      </Button>

      <div
        inert={!showWork}
        className={cn(
          "absolute inset-y-0 right-0 left-4 z-30 flex flex-col overflow-hidden rounded-l-xl border-l border-black/[0.09] bg-white shadow-lg transition-transform duration-200 ease-in-out will-change-transform motion-reduce:transition-none sm:left-10",
          showWork ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-black/[0.07] px-3 py-2">
          <Button
            variant="bare"
            size="none"
            type="button"
            onClick={() => setShowWork(false)}
            title="Back to the idea board"
            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-black/[0.09] bg-white px-2 text-[11px] font-medium text-black/65 transition hover:border-black/25 hover:text-black"
          >
            <ArrowLeft className="size-3" />
            <span className="hidden sm:inline">Idea Board</span>
          </Button>

          <span className="font-mono text-[10px] tracking-[0.14em] text-black/35 uppercase">
            Week {week.number} work
          </span>

          {canManage && week.ideaCards.length > 1 ? (
            <form action={organiseAction} className="ml-auto">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="weekId" value={week.id} />
              <Button
                variant="bare"
                size="none"
                type="submit"
                disabled={organising}
                title="Let AI order this week's ideas"
                className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-[#15181b] px-2.5 text-[11px] font-semibold text-[#2fe85c] transition hover:bg-black disabled:opacity-60"
              >
                {organising ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3" />
                )}
                Organise with AI
              </Button>
            </form>
          ) : null}
        </div>

        {organise.status !== "idle" && organise.message ? (
          <p
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b border-black/[0.06] px-3 py-1.5 text-[11px]",
              organise.status === "success"
                ? "bg-[#2fe85c]/[0.06] text-[#08743d]"
                : "bg-red-50 text-red-700",
            )}
          >
            {organise.status === "success" ? (
              <Sparkles className="size-3" />
            ) : (
              <AlertCircle className="size-3" />
            )}
            {organise.message}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <BoardColumn
            title="Work Board"
            hint="Tick items off as they land"
            icon={CheckCircle2}
            count={week.workCards.length}
            tone="work"
          >
            {week.workCards.length ? (
              week.workCards.map((card) => (
                <CardRow key={card.id} card={card} {...cardProps} />
              ))
            ) : (
              <EmptyNote>
                Nothing has moved across yet. Start an idea to bring it here.
              </EmptyNote>
            )}
          </BoardColumn>
        </div>
      </div>
    </div>
  );
}
