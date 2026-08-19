"use client";

import {
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import {
  Check,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  type UploadResult,
  WeekIdeaBoard,
} from "@/components/admin/projects/week-idea-board";
import {
  type Person,
  WeekWorkBoard,
  type WorkBoardActions,
} from "@/components/admin/projects/week-work-board";
import { WeekCarryOver } from "@/components/admin/projects/week-carry-over";
import type { IdeaEditorHandle } from "@/components/admin/projects/idea-editor";
import { type CarryOver, carryOverFor } from "@/lib/projects/carry-over";
import type { MilestoneWeek } from "@/data/project-detail";
import type { CardStatus } from "@/lib/projects/board";
import {
  WEEK_STATE_LABEL,
  addDays,
  nextWeekNumber,
  weekState,
} from "@/lib/projects/plan";
import { formatDate } from "@/lib/projects/format";
import type { SimpleFormState } from "@/lib/projects/form-state";
import { cn } from "@/lib/utils";

export function WeekPlan({
  projectId,
  weeks,
  currentWeekId,
  progress,
  canPlan,
  isOwner,
  canWrite,
  canManage,
  canTick,
  people,
  dismissedCarry,
  acceptCarry,
  dismissCarry,
  setComplete,
  addWeek,
  archiveWeek,
  saveIdeaBoard,
  upload,
  workActions,
}: {
  projectId: string;
  weeks: MilestoneWeek[];
  currentWeekId: string | null;
  progress: number;
  canPlan: boolean;
  isOwner: boolean;
  canWrite: boolean;
  canManage: boolean;
  canTick: boolean;
  people: Person[];
  dismissedCarry: string[];
  acceptCarry: (
    cardId: string,
    targetWeekId: string,
  ) => Promise<SimpleFormState>;
  dismissCarry: (
    cardId: string,
    targetWeekId: string,
  ) => Promise<SimpleFormState>;
  setComplete: (weekId: string, complete: boolean) => Promise<SimpleFormState>;
  addWeek: (
    state: SimpleFormState,
    formData: FormData,
  ) => Promise<SimpleFormState & { weekId?: string }>;
  archiveWeek: (formData: FormData) => Promise<void>;
  saveIdeaBoard: (weekId: string, doc: string) => Promise<SimpleFormState>;
  upload: (state: UploadResult, formData: FormData) => Promise<UploadResult>;
  workActions: WorkBoardActions;
}) {
  const storageKey = `gd:week-open:${projectId}`;
  const stored = useStoredWeek(storageKey);
  const [chosen, setChosen] = useState<string | null | undefined>(undefined);
  const [expandedBoard, setExpandedBoard] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remembered =
    stored && weeks.some((week) => week.id === stored) ? stored : currentWeekId;
  const openId = chosen === undefined ? remembered : chosen;

  const setOpenId = useCallback(
    (next: string | null) => {
      setChosen(next);
      if (next) window.localStorage.setItem(storageKey, next);
      else window.localStorage.removeItem(storageKey);
    },
    [storageKey],
  );

  const closed = weeks.filter((week) => week.completedAt).length;
  const dismissed = new Set(dismissedCarry);

  function run(action: () => Promise<SimpleFormState>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.status === "error") setError(result.message);
    });
  }

  function complete(week: MilestoneWeek) {
    const undone = openTaskCount(week);
    if (!week.completedAt && undone) {
      const ok = window.confirm(
        `Week ${week.number} still has ${undone} unfinished ${
          undone === 1 ? "task" : "tasks"
        }. Mark it complete anyway?`,
      );
      if (!ok) return;
    }
    run(() => setComplete(week.id, !week.completedAt));
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#f8f8f3]">
      <div className="flex shrink-0 items-center gap-3 border-b border-black/[0.07] bg-[#eef0e9] px-3 py-2.5 sm:px-4">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-black/55 uppercase">
          Weeks
        </span>

        {weeks.length ? (
          <span className="font-mono text-[11px] text-black/45">
            {closed}/{weeks.length} closed · {progress}%
          </span>
        ) : null}

        {error ? (
          <span role="alert" className="truncate text-[11px] text-red-600">
            {error}
          </span>
        ) : null}

        {pending ? (
          <Loader2 className="size-3 animate-spin text-black/30" />
        ) : null}

        {isOwner ? (
          <AddWeek
            projectId={projectId}
            weeks={weeks}
            action={addWeek}
            onAdded={setOpenId}
          />
        ) : null}
      </div>

      {weeks.length ? (
        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          {weeks.map((week) => (
            <WeekRow
              key={week.id}
              week={week}
              open={openId === week.id}
              canPlan={canPlan}
              canWrite={canWrite}
              isOwner={isOwner}
              pending={pending}
              boardExpanded={expandedBoard === week.id}
              onBoardExpandedChange={(value) =>
                setExpandedBoard(value ? week.id : null)
              }
              onToggle={() => setOpenId(openId === week.id ? null : week.id)}
              onComplete={() => complete(week)}
              people={people}
              canManage={canManage}
              canTick={canTick}
              workActions={workActions}
              carryOver={carryOverFor(week, weeks, dismissed)}
              acceptCarry={acceptCarry}
              dismissCarry={dismissCarry}
              archiveWeek={archiveWeek}
              saveIdeaBoard={saveIdeaBoard}
              upload={upload}
              projectId={projectId}
            />
          ))}
        </div>
      ) : (
        <p className="px-3 pb-3 text-[12px] text-black/40 sm:px-4">
          {isOwner ? "No weeks yet. Add the first one." : "No weeks yet."}
        </p>
      )}
    </section>
  );
}

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function useStoredWeek(storageKey: string) {
  return useSyncExternalStore(
    subscribeToStorage,
    () => window.localStorage.getItem(storageKey),
    () => null,
  );
}

function openTaskCount(week: MilestoneWeek) {
  return week.workCards.filter((card) => card.status !== "completed").length;
}

function WeekRow({
  projectId,
  week,
  open,
  canPlan,
  canWrite,
  isOwner,
  pending,
  boardExpanded,
  onBoardExpandedChange,
  onToggle,
  onComplete,
  people,
  canManage,
  canTick,
  workActions,
  carryOver,
  acceptCarry,
  dismissCarry,
  archiveWeek,
  saveIdeaBoard,
  upload,
}: {
  projectId: string;
  week: MilestoneWeek;
  open: boolean;
  canPlan: boolean;
  canWrite: boolean;
  isOwner: boolean;
  pending: boolean;
  boardExpanded: boolean;
  onBoardExpandedChange: (value: boolean) => void;
  onToggle: () => void;
  onComplete: () => void;
  people: Person[];
  canManage: boolean;
  canTick: boolean;
  workActions: WorkBoardActions;
  carryOver: CarryOver[];
  acceptCarry: (
    cardId: string,
    targetWeekId: string,
  ) => Promise<SimpleFormState>;
  dismissCarry: (
    cardId: string,
    targetWeekId: string,
  ) => Promise<SimpleFormState>;
  archiveWeek: (formData: FormData) => Promise<void>;
  saveIdeaBoard: (weekId: string, doc: string) => Promise<SimpleFormState>;
  upload: (state: UploadResult, formData: FormData) => Promise<UploadResult>;
}) {
  const [workOpen, setWorkOpen] = useState(false);
  const editorRef = useRef<IdeaEditorHandle>(null);

  const [doc, setDoc] = useState(week.ideaDoc);
  const hasNotes = doc.content.length > 0;

  const [done, setDone] = useState<Record<string, boolean>>({});
  const tasks = week.workCards.map((card) =>
    card.id in done
      ? {
          ...card,
          status: (done[card.id] ? "completed" : "in_progress") as CardStatus,
        }
      : card,
  );

  const state = weekState(week);
  const panelId = `week-panel-${week.id}`;
  const undone = tasks.filter((card) => card.status !== "completed").length;
  const complete = state === "complete";

  return (
    <div
      className={cn(
        "border-t border-black/[0.06] first:border-t-0",
        complete && "opacity-70",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 pr-2 transition sm:pr-3",
          open ? "bg-white" : "hover:bg-black/[0.03]",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 text-left sm:pl-4"
        >
          <ChevronRight
            aria-hidden
            className={cn(
              "size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none",
              open ? "rotate-90 text-black/55" : "text-black/30",
            )}
          />

          <span
            className={cn(
              "font-display shrink-0 text-[15px] font-semibold tracking-[-0.02em]",
              complete ? "text-black/40" : "text-black/85",
            )}
          >
            Week {week.number}
          </span>

          <span className="hidden shrink-0 text-[12px] text-black/45 sm:inline">
            {week.startsOn ? `${formatDate(week.startsOn)} – ` : "due "}
            {formatDate(week.dueOn)}
          </span>

          {state === "overdue" ? (
            <span
              title="Past its end date with work outstanding"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800"
            >
              <TriangleAlert className="size-3" />
              Overdue
            </span>
          ) : state === "current" ? (
            <span className="shrink-0 rounded-full border border-[#2fe85c]/50 bg-[#2fe85c]/15 px-2 py-0.5 text-[10px] font-semibold text-[#08743d]">
              {WEEK_STATE_LABEL.current}
            </span>
          ) : null}

          <span
            className={cn(
              "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
              undone
                ? "bg-amber-100 text-amber-800"
                : week.workCards.length
                  ? "text-[#0f7a37]"
                  : "text-black/30",
            )}
          >
            {undone
              ? `${undone} undone`
              : week.workCards.length
                ? "all done"
                : "no tasks"}
          </span>
        </button>

        {canPlan ? (
          <button
            type="button"
            onClick={onComplete}
            disabled={pending}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition disabled:opacity-60",
              complete
                ? "border border-black/[0.12] text-black/50 hover:border-black/30 hover:text-black"
                : "bg-[#15181b] text-[#2fe85c] hover:bg-black",
            )}
          >
            <Check className="size-3" />
            <span className="hidden sm:inline">
              {complete ? "Reopen" : "Mark complete"}
            </span>
          </button>
        ) : null}

        {isOwner ? (
          <form
            action={archiveWeek}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  `Delete Week ${week.number}? It will be archived and removed from this list.`,
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="weekId" value={week.id} />
            <input type="hidden" name="archived" value="1" />
            <button
              type="submit"
              aria-label={`Delete week ${week.number}`}
              title="Delete week"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-black/30 transition hover:bg-black/[0.06] hover:text-red-600"
            >
              <Trash2 className="size-3.5" />
            </button>
          </form>
        ) : null}
      </div>

      {week.workCards.length ? (
        <div className="h-0.5 w-full bg-black/[0.05]">
          <div
            className={cn(
              "h-full transition-[width] duration-300 motion-reduce:transition-none",
              undone ? "bg-[#2fe85c]" : "bg-[#16a34a]",
            )}
            style={{
              width: `${Math.round(((week.workCards.length - undone) / week.workCards.length) * 100)}%`,
            }}
          />
        </div>
      ) : null}

      {open ? (
        <div id={panelId} className="bg-[#fcfcf9] px-3 pb-3.5 sm:px-4">
          <WeekCarryOver
            items={carryOver}
            weekId={week.id}
            canManage={canManage}
            accept={(item) => {
              editorRef.current?.appendContent([
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: item.title },
                    { type: "text", text: "  " },
                    {
                      type: "text",
                      text: `carried from Week ${item.fromWeek}`,
                      marks: [
                        { type: "highlight", attrs: { color: "#fef08a" } },
                      ],
                    },
                  ],
                },
              ]);
              return acceptCarry(item.cardId, week.id);
            }}
            dismiss={dismissCarry}
          />

          <WeekIdeaBoard
            projectId={projectId}
            upload={upload}
            weekId={week.id}
            weekNumber={week.number}
            initialDoc={doc}
            canEdit={canWrite}
            openTasks={undone}
            updatedAt={week.ideaUpdatedAt}
            updatedBy={week.ideaUpdatedBy}
            expanded={boardExpanded}
            editorRef={editorRef}
            onDocChange={setDoc}
            onExpandedChange={onBoardExpandedChange}
            onOpenWork={() => setWorkOpen(true)}
            save={saveIdeaBoard}
            workBoard={
              <WeekWorkBoard
                projectId={projectId}
                weekId={week.id}
                weekNumber={week.number}
                tasks={tasks}
                people={people}
                canManage={canManage}
                canTick={canTick}
                onTaskDone={(cardId, value) =>
                  setDone((current) => ({ ...current, [cardId]: value }))
                }
                hasNotes={hasNotes}
                updatedAt={week.workUpdatedAt}
                updatedBy={week.workUpdatedBy}
                open={workOpen}
                onClose={() => setWorkOpen(false)}
                actions={workActions}
              />
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function AddWeek({
  projectId,
  weeks,
  action,
  onAdded,
}: {
  projectId: string;
  weeks: MilestoneWeek[];
  action: (
    state: SimpleFormState,
    formData: FormData,
  ) => Promise<SimpleFormState & { weekId?: string }>;
  onAdded: (weekId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const last = weeks[weeks.length - 1];
  const startsOn = last
    ? addDays(last.dueOn, 1)
    : new Date().toISOString().slice(0, 10);

  function submit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await action({ status: "idle", message: null }, formData);
      if (result.status === "error") {
        setMessage(result.message);
        return;
      }
      setOpen(false);
      if (result.weekId) onAdded(result.weekId);
    });
  }

  return (
    <div className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-black/[0.09] bg-white px-2 text-[11px] font-medium text-black/60 transition hover:border-black/25 hover:text-black"
      >
        <Plus className="size-3" />
        Add week
      </button>

      {open ? (
        <form
          action={submit}
          className="absolute top-full right-0 z-40 mt-2 w-64 rounded-xl border border-black/[0.09] bg-white p-3 shadow-[0_16px_40px_rgba(20,23,26,0.16)]"
        >
          <input type="hidden" name="projectId" value={projectId} />
          <input
            type="hidden"
            name="weekNumber"
            value={nextWeekNumber(weeks)}
          />
          <p className="text-[11px] font-semibold">
            Week {nextWeekNumber(weeks)}
          </p>
          <label className="mt-2 block text-[10px] text-black/45">
            Starts
            <input
              type="date"
              name="startsOn"
              defaultValue={startsOn}
              className="mt-1 w-full rounded-lg border border-black/[0.12] px-2 py-1 text-[11px] outline-none focus:border-black/35"
            />
          </label>
          <label className="mt-2 block text-[10px] text-black/45">
            Due
            <input
              type="date"
              name="dueOn"
              required
              defaultValue={addDays(startsOn, 6)}
              className="mt-1 w-full rounded-lg border border-black/[0.12] px-2 py-1 text-[11px] outline-none focus:border-black/35"
            />
          </label>
          {message ? (
            <p role="alert" className="mt-2 text-[11px] text-red-600">
              {message}
            </p>
          ) : null}
          <div className="mt-3 flex gap-1.5">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-[#15181b] px-2.5 text-[11px] font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-3 animate-spin" /> : null}
              Add
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-7 items-center rounded-lg px-2 text-[11px] font-medium text-black/45 transition hover:text-black"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
