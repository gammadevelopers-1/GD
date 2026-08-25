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
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  type UploadResult,
  WeekIdeaBoard,
} from "@/components/admin/projects/week-idea-board";
import {
  TranscriptPanel,
  type TranscriptActions,
} from "@/components/admin/projects/transcript-panel";
import type { WeekTranscript } from "@/lib/projects/transcript";
import {
  WeekWorkBoard,
  type WorkBoardActions,
} from "@/components/admin/projects/week-work-board";
import { WeekCarryOver } from "@/components/admin/projects/week-carry-over";
import { FormDatePicker } from "@/components/common/form-date-picker";
import type { IdeaEditorHandle } from "@/components/admin/projects/idea-editor";
import type { AskIdeaAi } from "@/components/admin/projects/idea-ai-panel";
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
import { HIGHLIGHT_YELLOW } from "@/lib/projects/idea-doc";
import { Modal } from "@/components/admin/projects/modal";
import { TONE_SOFT, TONE_SOLID } from "@/lib/admin-ui";
import type { SimpleFormState } from "@/lib/projects/form-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  dismissedCarry,
  acceptCarry,
  dismissCarry,
  setComplete,
  addWeek,
  archiveWeek,
  saveIdeaBoard,
  setFocus,
  askIdeaAi,
  upload,
  workActions,
  transcripts,
  transcriptMedia,
  transcriptActions,
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
  setFocus: (weekId: string, focus: string) => Promise<SimpleFormState>;
  upload: (state: UploadResult, formData: FormData) => Promise<UploadResult>;
  askIdeaAi: AskIdeaAi;
  workActions: WorkBoardActions;
  transcripts: Record<string, WeekTranscript[]>;
  transcriptMedia: Record<string, string>;
  transcriptActions: TranscriptActions;
}) {
  const storageKey = `gd:week-open:${projectId}`;
  const stored = useStoredWeek(storageKey);
  const [chosen, setChosen] = useState<string | null | undefined>(undefined);
  const [expandedBoard, setExpandedBoard] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [unfinished, setUnfinished] = useState<MilestoneWeek | null>(null);

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
      setUnfinished(week);
      return;
    }
    run(() => setComplete(week.id, !week.completedAt));
  }

  return (
    <section className="bg-gd-panel flex flex-col rounded-[20px] border border-black/[0.07]">
      <div className="flex shrink-0 items-center gap-3 rounded-t-[20px] border-b border-black/[0.07] bg-[#eef0e9] px-4 py-3 sm:px-6">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-black/55 uppercase">
          Weeks
        </span>

        {weeks.length ? (
          <span className="font-mono text-[11px] text-black/60">
            {closed}/{weeks.length} closed · {progress}%
          </span>
        ) : null}

        {error ? (
          <span role="alert" className="truncate text-[11px] text-red-600">
            {error}
          </span>
        ) : null}

        {pending ? (
          <Loader2 className="size-3 animate-spin text-black/55" />
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
        <div className="space-y-3 px-4 pt-4 pb-4 sm:px-6 sm:pb-5">
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
              canManage={canManage}
              canTick={canTick}
              workActions={workActions}
              carryOver={carryOverFor(week, weeks, dismissed)}
              acceptCarry={acceptCarry}
              dismissCarry={dismissCarry}
              archiveWeek={archiveWeek}
              saveIdeaBoard={saveIdeaBoard}
              setFocus={setFocus}
              askIdeaAi={askIdeaAi}
              upload={upload}
              projectId={projectId}
              transcripts={transcripts[week.id] ?? []}
              transcriptMedia={transcriptMedia}
              transcriptActions={transcriptActions}
            />
          ))}
        </div>
      ) : (
        <p className="px-4 pt-4 pb-4 text-[12px] text-black/55 sm:px-6 sm:pb-5">
          {isOwner ? "No weeks yet. Add the first one." : "No weeks yet."}
        </p>
      )}

      <Modal
        open={Boolean(unfinished)}
        onClose={() => setUnfinished(null)}
        title={unfinished ? `Complete Week ${unfinished.number}` : "Complete"}
      >
        {unfinished ? (
          <>
            <p className="text-[13px] leading-6 text-black/60">
              {`Week ${unfinished.number} still has ${openTaskCount(unfinished)} unfinished ${
                openTaskCount(unfinished) === 1 ? "task" : "tasks"
              }. Mark it complete anyway?`}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="admin-secondary"
                size="none"
                type="button"
                onClick={() => setUnfinished(null)}
                className="h-9 px-3.5 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="admin-danger"
                size="none"
                type="button"
                autoFocus
                onClick={() => {
                  const week = unfinished;
                  setUnfinished(null);
                  run(() => setComplete(week.id, !week.completedAt));
                }}
                className="h-9 px-3.5 text-xs"
              >
                <Check className="size-3.5" />
                Mark complete
              </Button>
            </div>
          </>
        ) : null}
      </Modal>
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
  canManage,
  canTick,
  workActions,
  carryOver,
  acceptCarry,
  dismissCarry,
  archiveWeek,
  saveIdeaBoard,
  setFocus,
  askIdeaAi,
  upload,
  transcripts,
  transcriptMedia,
  transcriptActions,
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
  setFocus: (weekId: string, focus: string) => Promise<SimpleFormState>;
  upload: (state: UploadResult, formData: FormData) => Promise<UploadResult>;
  askIdeaAi: AskIdeaAi;
  transcripts: WeekTranscript[];
  transcriptMedia: Record<string, string>;
  transcriptActions: TranscriptActions;
}) {
  const [workOpen, setWorkOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
        "overflow-hidden rounded-xl border border-black/[0.07] bg-white",
        complete && "opacity-70",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 pr-3 transition sm:pr-4",
          open ? "bg-white" : "hover:bg-black/[0.02]",
        )}
      >
        <Button
          variant="bare"
          size="none"
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-4 text-left sm:pl-5"
        >
          <ChevronRight
            aria-hidden
            className={cn(
              "size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none",
              open ? "rotate-90 text-black/55" : "text-black/55",
            )}
          />

          <span className="flex min-w-0 shrink-0 items-baseline gap-2">
            <span
              className={cn(
                "font-display truncate text-[15px] font-semibold tracking-[-0.02em]",
                complete ? "text-black/55" : "text-black/85",
              )}
            >
              {week.focus ?? `Week ${week.number}`}
            </span>
            {week.focus ? (
              <span className="shrink-0 font-mono text-[10px] text-black/40">
                W{week.number}
              </span>
            ) : null}
          </span>

          <span className="hidden shrink-0 text-[12px] text-black/60 sm:inline">
            {week.startsOn ? `${formatDate(week.startsOn)} – ` : "due "}
            {formatDate(week.dueOn)}
          </span>

          {state === "overdue" ? (
            <span
              title="Past its end date with work outstanding"
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                TONE_SOLID.danger,
              )}
            >
              <TriangleAlert className="size-3" />
              Overdue
            </span>
          ) : state === "current" ? (
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                TONE_SOFT.ok,
              )}
            >
              {WEEK_STATE_LABEL.current}
            </span>
          ) : null}

          <span
            className={cn(
              "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
              undone
                ? TONE_SOFT.warning
                : week.workCards.length
                  ? "text-gd-green-ink"
                  : "text-black/55",
            )}
          >
            {undone
              ? `${undone} undone`
              : week.workCards.length
                ? "all done"
                : "no tasks"}
          </span>
        </Button>

        {canPlan ? (
          <Button
            variant="bare"
            size="none"
            type="button"
            onClick={onComplete}
            disabled={pending}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition disabled:opacity-60",
              complete
                ? "border border-black/[0.12] text-black/60 hover:border-black/30 hover:text-black"
                : "bg-gd-panel-dark text-brand hover:bg-black",
            )}
          >
            <Check className="size-3" />
            <span className="hidden sm:inline">
              {complete ? "Reopen" : "Mark complete"}
            </span>
          </Button>
        ) : null}

        {canPlan ? <RenameWeek week={week} setFocus={setFocus} /> : null}

        {isOwner ? (
          <>
            <Button
              variant="bare"
              size="none"
              type="button"
              onClick={() => setDeleting(true)}
              aria-label={`Delete week ${week.number}`}
              title="Delete week"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-black/55 transition hover:bg-black/[0.06] hover:text-red-600"
            >
              <Trash2 className="size-3.5" />
            </Button>

            <Modal
              open={deleting}
              onClose={() => setDeleting(false)}
              title={`Delete Week ${week.number}`}
            >
              <p className="text-[13px] leading-6 text-black/60">
                It is archived and removed from this list.
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="admin-secondary"
                  size="none"
                  type="button"
                  onClick={() => setDeleting(false)}
                  className="h-9 px-3.5 text-xs"
                >
                  Cancel
                </Button>
                <form action={archiveWeek}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="weekId" value={week.id} />
                  <input type="hidden" name="archived" value="1" />
                  <Button
                    variant="admin-danger"
                    size="none"
                    type="submit"
                    className="h-9 px-3.5 text-xs"
                  >
                    <Trash2 className="size-3.5" />
                    Delete week
                  </Button>
                </form>
              </div>
            </Modal>
          </>
        ) : null}
      </div>

      {week.workCards.length ? (
        <div className="h-0.5 w-full bg-black/[0.05]">
          <div
            className={cn(
              "h-full transition-[width] duration-300 motion-reduce:transition-none",
              undone ? "bg-brand" : "bg-gd-green",
            )}
            style={{
              width: `${Math.round(((week.workCards.length - undone) / week.workCards.length) * 100)}%`,
            }}
          />
        </div>
      ) : null}

      {open ? (
        <div
          id={panelId}
          className="space-y-4 border-t border-black/[0.06] bg-[#fcfcf9] px-4 pt-4 pb-2 sm:px-5"
        >
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
                        {
                          type: "highlight",
                          attrs: { color: HIGHLIGHT_YELLOW },
                        },
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
            workOpen={workOpen}
            editorRef={editorRef}
            onDocChange={setDoc}
            onExpandedChange={onBoardExpandedChange}
            onOpenWork={() => setWorkOpen(true)}
            save={saveIdeaBoard}
            askAi={canWrite ? askIdeaAi : undefined}
            transcript={
              <TranscriptPanel
                projectId={projectId}
                weekId={week.id}
                transcripts={transcripts}
                media={transcriptMedia}
                canEdit={canWrite}
                actions={transcriptActions}
              />
            }
            workBoard={
              <WeekWorkBoard
                projectId={projectId}
                weekId={week.id}
                weekNumber={week.number}
                tasks={tasks}
                upload={upload}
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
                transcripts={transcripts}
                transcriptActions={transcriptActions}
                canEditPoints={canWrite}
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
  const [named, setNamed] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const number = nextWeekNumber(weeks);
  const last = weeks[weeks.length - 1];
  const startsOn = last
    ? addDays(last.dueOn, 1)
    : new Date().toISOString().slice(0, 10);

  function close() {
    setOpen(false);
    setNamed(false);
    setName("");
    setMessage(null);
  }

  function submit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await action({ status: "idle", message: null }, formData);
      if (result.status === "error") {
        setMessage(result.message ?? "The week could not be added.");
        return;
      }
      close();
      if (result.weekId) onAdded(result.weekId);
    });
  }

  return (
    <>
      <Button
        variant="bare"
        size="none"
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-lg border border-black/[0.09] bg-white px-2 text-[11px] font-medium text-black/60 transition hover:border-black/25 hover:text-black"
      >
        <Plus className="size-3" />
        Add week
      </Button>

      <Modal open={open} onClose={close} title="Add a week">
        <form action={submit}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="weekNumber" value={number} />
          <input type="hidden" name="focus" value={named ? name.trim() : ""} />

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-black/70">Name</span>
            <div className="inline-flex gap-0.5 rounded-xl bg-black/[0.05] p-0.75">
              <Button
                variant="bare"
                size="none"
                type="button"
                onClick={() => setNamed(false)}
                aria-pressed={!named}
                className={cn(
                  "rounded-[10px] px-3 py-1.5 text-xs font-medium transition",
                  named
                    ? "text-black/55 hover:text-black"
                    : "bg-white text-black shadow-[0_1px_2px_rgba(20,23,26,0.12)]",
                )}
              >
                Week {number}
              </Button>
              <Button
                variant="bare"
                size="none"
                type="button"
                onClick={() => setNamed(true)}
                aria-pressed={named}
                className={cn(
                  "rounded-[10px] px-3 py-1.5 text-xs font-medium transition",
                  named
                    ? "bg-white text-black shadow-[0_1px_2px_rgba(20,23,26,0.12)]"
                    : "text-black/55 hover:text-black",
                )}
              >
                Custom name
              </Button>
            </div>
            {named ? (
              <Input
                variant="admin"
                autoFocus
                maxLength={240}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Discovery and planning"
                className="mt-1.5 h-9 text-sm"
              />
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-black/70">Starts</span>
              <FormDatePicker
                name="startsOn"
                defaultValue={startsOn}
                triggerClassName="h-9 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-black/70">Ends</span>
              <FormDatePicker
                name="dueOn"
                required
                defaultValue={addDays(startsOn, 6)}
                triggerClassName="h-9 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-sm"
              />
            </label>
          </div>

          {message ? (
            <p role="alert" className="mt-3 text-xs text-red-700">
              {message}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button
              variant="admin-ghost"
              size="admin"
              type="button"
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              variant="admin-cta"
              size="admin"
              type="submit"
              disabled={pending}
              data-button-fill
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              <span className="button-fill-fx__label">Add week</span>
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function RenameWeek({
  week,
  setFocus,
}: {
  week: MilestoneWeek;
  setFocus: (weekId: string, focus: string) => Promise<SimpleFormState>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(week.focus ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await setFocus(week.id, name.trim());
      if (result.status === "error") {
        setMessage(result.message ?? "That name was not saved.");
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        variant="bare"
        size="none"
        type="button"
        onClick={() => {
          setName(week.focus ?? "");
          setMessage(null);
          setOpen(true);
        }}
        title={`Rename Week ${week.number}`}
        aria-label={`Rename Week ${week.number}`}
        className="grid size-7 shrink-0 place-items-center rounded-lg text-black/40 transition hover:bg-black/[0.05] hover:text-black"
      >
        <Pencil className="size-3.5" />
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Rename Week ${week.number}`}
      >
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-black/70">Name</span>
          <Input
            variant="admin"
            autoFocus
            maxLength={240}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              save();
            }}
            placeholder={`Week ${week.number}`}
            className="h-9 text-sm"
          />
        </label>

        {message ? (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {message}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="admin-ghost"
            size="admin"
            type="button"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="admin-cta"
            size="admin"
            type="button"
            onClick={save}
            disabled={pending}
            data-button-fill
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            <span className="button-fill-fx__label">Save name</span>
          </Button>
        </div>
      </Modal>
    </>
  );
}
