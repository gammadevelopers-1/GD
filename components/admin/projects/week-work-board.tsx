"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  FilePlus2,
  FileText,
  ListChecks,
  MessagesSquare,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import {
  IdeaEditor,
  type IdeaEditorHandle,
} from "@/components/admin/projects/idea-editor";
import {
  EMPTY_DOC,
  type IdeaDoc,
  type IdeaNode,
} from "@/lib/projects/idea-doc";
import {
  type UploadAction,
  useAttachment,
} from "@/components/admin/projects/use-attachment";
import { IDLE_FORM, type SimpleFormState } from "@/lib/projects/form-state";
import { TONE_SOFT } from "@/lib/admin-ui";
import type { MilestoneCard } from "@/data/project-detail";
import {
  type TranscriptPoint,
  type WeekTranscript,
} from "@/lib/projects/transcript";
import {
  PointSheet,
  type TranscriptActions,
} from "@/components/admin/projects/transcript-panel";
import { formatDate } from "@/lib/projects/format";
import { duration as motionDuration, ease, gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export type ProposedTask = {
  title: string;
  detail: string;
  references: string[];
  existingId: string | null;
  existingTitle: string | null;
};

export type WorkBoardActions = {
  saveTask: (input: {
    projectId: string;
    weekId: string;
    cardId?: string;
    title: string;
    doc: string;
  }) => Promise<SimpleFormState & { cardId?: string }>;
  setTaskDone: (cardId: string, done: boolean) => Promise<SimpleFormState>;
  suggest: (
    projectId: string,
    weekId: string,
  ) => Promise<SimpleFormState & { tasks?: ProposedTask[] }>;
  accept: (
    projectId: string,
    weekId: string,
    tasks: Array<{
      title: string;
      detail?: string;
      references?: string[];
      existingId?: string | null;
    }>,
  ) => Promise<SimpleFormState>;
};

export function WeekWorkBoard({
  projectId,
  weekId,
  weekNumber,
  tasks,
  canManage,
  canTick,
  hasNotes,
  updatedAt,
  updatedBy,
  open,
  onClose,
  onTaskDone,
  upload,
  actions,
  transcripts,
  transcriptActions,
  canEditPoints,
}: {
  projectId: string;
  weekId: string;
  weekNumber: number;
  tasks: MilestoneCard[];
  canManage: boolean;
  canTick: boolean;
  hasNotes: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
  open: boolean;
  onClose: () => void;
  onTaskDone: (cardId: string, done: boolean) => void;
  upload: UploadAction;
  actions: WorkBoardActions;
  transcripts: WeekTranscript[];
  transcriptActions: TranscriptActions;
  canEditPoints: boolean;
}) {
  const [tab, setTab] = useState<"tasks" | "points">("tasks");
  const [openPoint, setOpenPoint] = useState<TranscriptPoint | null>(null);
  const [organising, startOrganise] = useTransition();
  const points = transcripts.flatMap((transcript) => transcript.points);

  const [editing, setEditing] = useState<MilestoneCard | "new" | null>(null);
  const [proposals, setProposals] = useState<ProposedTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const animationReady = useRef(false);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const panel = panelRef.current;
      const backdrop = backdropRef.current;
      if (!panel || !backdrop) return;

      if (!animationReady.current) {
        gsap.set(panel, { x: 32, xPercent: 100, force3D: true });
        gsap.set(backdrop, { opacity: 0 });
        animationReady.current = true;
        if (!open) return;
      }

      gsap.killTweensOf([panel, backdrop]);

      if (reducedMotion) {
        gsap.set(panel, {
          x: open ? 0 : 32,
          xPercent: open ? 0 : 100,
          force3D: true,
        });
        gsap.set(backdrop, { opacity: open ? 1 : 0 });
        return;
      }

      gsap.to(panel, {
        x: open ? 0 : 32,
        xPercent: open ? 0 : 100,
        duration: motionDuration.base,
        ease: ease.inOut,
        force3D: true,
        overwrite: "auto",
      });
      gsap.to(backdrop, {
        opacity: open ? 1 : 0,
        duration: open ? 0.5 : motionDuration.fast,
        ease: ease.soft,
        overwrite: "auto",
      });
    },
    { dependencies: [open, reducedMotion] },
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusDelay = reducedMotion ? 0 : motionDuration.base * 1000;
    const focusTimer = window.setTimeout(
      () => closeRef.current?.focus({ preventScroll: true }),
      focusDelay,
    );
    return () => {
      window.clearTimeout(focusTimer);
      previous?.focus?.({ preventScroll: true });
    };
  }, [open, reducedMotion]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (editing) setEditing(null);
      else if (proposals) setProposals(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, editing, proposals, onClose]);

  function organisePoints() {
    setError(null);
    const data = new FormData();
    data.set("weekId", weekId);
    startOrganise(async () => {
      const result = await transcriptActions.organise(IDLE_FORM, data);
      if (result.status === "error") {
        setError(result.message ?? "The points could not be organised.");
      }
    });
  }

  function suggest() {
    setError(null);
    startBusy(async () => {
      const result = await actions.suggest(projectId, weekId);
      if (result.status === "error" || !result.tasks) {
        setError(result.message ?? "Nothing was suggested.");
        return;
      }
      setProposals(result.tasks);
    });
  }

  return (
    <>
      <div
        ref={backdropRef}
        aria-hidden
        onClick={onClose}
        style={{ opacity: 0 }}
        className={cn(
          "absolute inset-0 z-20 bg-black/12 will-change-[opacity]",
          !open && "pointer-events-none",
        )}
      />

      <aside
        ref={panelRef}
        id={`week-work-board-${weekId}`}
        inert={!open}
        role="dialog"
        aria-modal={open || undefined}
        aria-label={`Week ${weekNumber} work board`}
        style={{ transform: "translate3d(calc(100% + 2rem), 0, 0)" }}
        className={cn(
          "absolute inset-y-0 right-0 left-2 z-30 flex flex-col overflow-hidden rounded-l-2xl border-l border-black/[0.09] bg-white shadow-[-18px_0_50px_rgba(20,23,26,0.22)] will-change-transform backface-hidden sm:left-8 lg:left-12",
          !open && "pointer-events-none",
        )}
      >
        <header className="bg-gd-panel-dark flex shrink-0 items-center gap-2 px-3 py-2 text-white">
          <Button
            variant="bare"
            size="none"
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close work board"
            className="grid size-7 place-items-center rounded-lg text-white/65 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </Button>
          <span className="text-brand font-mono text-[10px] tracking-[0.14em] uppercase">
            Work Board
          </span>
          <span className="ml-auto min-w-0 truncate text-right text-[10px] text-white/65">
            {updatedAt
              ? `${updatedBy ? `${updatedBy} · ` : ""}${formatDate(updatedAt.slice(0, 10))}`
              : `Week ${weekNumber}`}
          </span>
        </header>

        {error ? (
          <p
            role="alert"
            className="flex shrink-0 items-start gap-1.5 border-b border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700"
          >
            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button
              variant="bare"
              size="none"
              type="button"
              onClick={() => setError(null)}
              className="font-semibold underline underline-offset-2"
            >
              Dismiss
            </Button>
          </p>
        ) : null}

        <div className="bg-gd-panel flex shrink-0 items-center gap-1 border-b border-black/[0.07] px-3 py-1.5">
          <BoardTab
            on={tab === "tasks"}
            icon={ListChecks}
            label="Tasks"
            count={`${tasks.filter((task) => task.status === "completed").length}/${tasks.length}`}
            onClick={() => setTab("tasks")}
          />
          <BoardTab
            on={tab === "points"}
            icon={MessagesSquare}
            label="Transcript"
            count={String(points.length)}
            onClick={() => setTab("points")}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {tab === "tasks" ? (
            <>
              {canManage ? (
                <OrganiseBar
                  busy={busy}
                  disabled={busy || !hasNotes}
                  title={
                    hasNotes
                      ? "Read the idea board and suggest tasks"
                      : "Write something on the idea board first"
                  }
                  hint={hasNotes ? null : "Nothing on the idea board yet."}
                  onClick={suggest}
                />
              ) : null}

              {tasks.length ? (
                <ul className="space-y-1">
                  {tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      hasDetail={hasDetail(task)}
                      canTick={canTick}
                      canManage={canManage}
                      onOpen={() => setEditing(task)}
                      onDone={onTaskDone}
                      setDone={actions.setTaskDone}
                    />
                  ))}
                </ul>
              ) : (
                <p className="px-1 py-8 text-center text-[12px] text-black/55">
                  No tasks yet.
                </p>
              )}
            </>
          ) : (
            <>
              {canEditPoints && points.length > 1 ? (
                <OrganiseBar
                  busy={organising}
                  disabled={organising}
                  title="Reword, retag and reorder these points"
                  hint={null}
                  onClick={organisePoints}
                />
              ) : null}

              {points.length ? (
                <ul className="space-y-1">
                  {points.map((point) => (
                    <PointRow
                      key={point.id}
                      point={point}
                      canCheck={canEditPoints}
                      sendToWork={transcriptActions.sendToWork}
                      onOpen={() => setOpenPoint(point)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="px-1 py-8 text-center text-[12px] leading-relaxed text-black/55">
                  No transcript points yet. Give the assistant a file on the
                  Idea Board and they show up here.
                </p>
              )}
            </>
          )}
        </div>

        {canManage && tab === "tasks" ? (
          <div className="bg-gd-panel shrink-0 border-t border-black/[0.07] px-3 py-2">
            <Button
              variant="bare"
              size="none"
              type="button"
              onClick={() => setEditing("new")}
              className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-black/15 text-[11px] font-medium text-black/55 transition hover:border-black/30 hover:text-black"
            >
              <Plus className="size-3.5" />
              Add task
            </Button>
          </div>
        ) : null}
      </aside>

      {editing ? (
        <TaskEditor
          projectId={projectId}
          weekId={weekId}
          task={editing === "new" ? null : editing}
          editable={canManage}
          upload={upload}
          onClose={() => setEditing(null)}
          save={actions.saveTask}
        />
      ) : null}

      {openPoint ? (
        <PointSheet
          point={openPoint}
          editable={canEditPoints}
          save={transcriptActions.savePoint}
          onClose={() => setOpenPoint(null)}
        />
      ) : null}

      {proposals ? (
        <ProposalReview
          projectId={projectId}
          weekId={weekId}
          proposals={proposals}
          onClose={() => setProposals(null)}
          accept={actions.accept}
        />
      ) : null}
    </>
  );
}

function OrganiseBar({
  busy,
  disabled,
  title,
  hint,
  onClick,
}: {
  busy: boolean;
  disabled: boolean;
  title: string;
  hint: string | null;
  onClick: () => void;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Button
        variant="bare"
        size="none"
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className="bg-gd-panel-dark text-brand inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold transition hover:bg-black disabled:opacity-45"
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        Organize with AI
      </Button>
      {hint ? <span className="text-[10px] text-black/55">{hint}</span> : null}
    </div>
  );
}

function BoardTab({
  on,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  on: boolean;
  icon: typeof ListChecks;
  label: string;
  count: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="bare"
      size="none"
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11.5px] font-medium transition",
        on
          ? "bg-black/[0.07] text-black"
          : "text-black/50 hover:bg-black/[0.04] hover:text-black",
      )}
    >
      <Icon className="size-3.5" />
      {label}
      <span className="rounded-full bg-black/[0.06] px-1.5 font-mono text-[9px] text-black/55">
        {count}
      </span>
    </Button>
  );
}

function PointRow({
  point,
  canCheck,
  sendToWork,
  onOpen,
}: {
  point: TranscriptPoint;
  canCheck: boolean;
  sendToWork: TranscriptActions["sendToWork"];
  onOpen: () => void;
}) {
  const [sendState, send, sending] = useActionState(sendToWork, IDLE_FORM);
  const checked = Boolean(point.cardId) || sendState.status === "success";
  const failed = sendState.status === "error";

  return (
    <li
      className={cn(
        BOARD_ROW,
        failed ? "border-red-200 bg-red-50" : BOARD_ROW_IDLE,
      )}
    >
      <Button
        variant="bare"
        size="none"
        type="button"
        onClick={onOpen}
        aria-label={`Open details for ${point.body.slice(0, 60)}`}
        className={BOARD_ROW_OPEN}
      >
        <span className="sr-only">
          Open details for {point.body.slice(0, 60)}
        </span>
      </Button>

      <form action={send} className="relative z-10 shrink-0">
        <input type="hidden" name="pointId" value={point.id} />
        <Button
          variant="bare"
          size="none"
          type="submit"
          disabled={!canCheck || checked || sending}
          role="checkbox"
          aria-checked={checked}
          aria-label={
            checked
              ? `${point.body} is on the Work Board`
              : `Add ${point.body} to the Work Board`
          }
          className={cn(
            BOARD_ROW_CHECK,
            checked
              ? "border-gd-green bg-gd-green text-white disabled:opacity-100"
              : "border-black/20 hover:border-black/45",
          )}
        >
          {sending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : checked ? (
            <Check className="size-3" />
          ) : null}
        </Button>
      </form>

      <span
        aria-hidden
        className="pointer-events-none relative z-10 min-w-0 flex-1 truncate py-0.5 text-left text-[12.5px] font-medium text-black/80 transition group-hover:text-black"
      >
        {point.body}
      </span>

      {point.tag ? (
        <span
          className={cn(
            "relative z-10 shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[8.5px] tracking-[0.08em] whitespace-nowrap uppercase",
            TONE_SOFT.muted,
          )}
        >
          {point.tag}
        </span>
      ) : null}

      <BoardDetailButton hasDetail noun="point" onOpen={onOpen} />

      {failed ? (
        <span role="alert" className="shrink-0 text-[9px] text-red-600">
          Not saved
        </span>
      ) : null}
    </li>
  );
}

const BOARD_ROW =
  "group relative flex cursor-pointer items-center gap-2.5 rounded-xl border px-2.5 py-2 transition duration-150";

const BOARD_ROW_IDLE =
  "border-black/[0.07] bg-white focus-within:border-black/20 focus-within:shadow-[0_5px_14px_rgba(20,23,26,0.05)] hover:border-black/20 hover:bg-[#f8faf7] hover:shadow-[0_5px_14px_rgba(20,23,26,0.05)]";

const BOARD_ROW_OPEN =
  "focus-visible:ring-gd-green/45 absolute inset-0 z-0 cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none";

const BOARD_ROW_CHECK =
  "focus-visible:ring-gd-green/40 relative z-10 grid size-5 shrink-0 cursor-pointer place-items-center rounded-md border bg-white transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default disabled:opacity-40";

const BOARD_ROW_DETAIL =
  "relative z-10 grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border shadow-sm transition duration-150 active:scale-95";

const BOARD_ROW_DETAIL_FILLED =
  "border-gd-green/35 bg-gd-green/10 text-gd-green-ink group-hover:border-gd-green/45 hover:border-gd-green/60 hover:bg-gd-green/20";

const BOARD_ROW_DETAIL_EMPTY =
  "border-dashed border-black/30 bg-white text-black/60 group-hover:border-black/40 hover:border-black/55 hover:bg-black/[0.04] hover:text-black";

function BoardDetailButton({
  hasDetail,
  noun,
  onOpen,
}: {
  hasDetail: boolean;
  noun: "point" | "task";
  onOpen: () => void;
}) {
  return (
    <Button
      variant="bare"
      size="none"
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={onOpen}
      title={hasDetail ? `Open ${noun} details` : `Add ${noun} details`}
      className={cn(
        BOARD_ROW_DETAIL,
        hasDetail ? BOARD_ROW_DETAIL_FILLED : BOARD_ROW_DETAIL_EMPTY,
      )}
    >
      {hasDetail ? (
        <FileText className="size-4" />
      ) : (
        <FilePlus2 className="size-4" />
      )}
    </Button>
  );
}

function TaskRow({
  task,
  hasDetail,
  canTick,
  canManage,
  onOpen,
  onDone,
  setDone,
}: {
  task: MilestoneCard;
  hasDetail: boolean;
  canTick: boolean;
  canManage: boolean;
  onOpen: () => void;
  onDone: (cardId: string, done: boolean) => void;
  setDone: (cardId: string, done: boolean) => Promise<SimpleFormState>;
}) {
  const done = task.status === "completed";
  const [failed, setFailed] = useState(false);
  const [, startSaving] = useTransition();

  function toggle() {
    const next = !done;
    onDone(task.id, next);
    setFailed(false);
    startSaving(async () => {
      const result = await setDone(task.id, next);
      if (result.status === "error") {
        onDone(task.id, !next);
        setFailed(true);
      }
    });
  }

  return (
    <li
      className={cn(
        BOARD_ROW,
        failed ? "border-red-200 bg-red-50" : BOARD_ROW_IDLE,
      )}
    >
      <Button
        variant="bare"
        size="none"
        type="button"
        onClick={onOpen}
        aria-label={`${canManage ? "Edit" : "View"} details for ${task.title}`}
        className={BOARD_ROW_OPEN}
      >
        <span className="sr-only">
          {canManage ? "Edit" : "View"} details for {task.title}
        </span>
      </Button>

      <Button
        variant="bare"
        size="none"
        type="button"
        onClick={toggle}
        disabled={!canTick}
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Untick ${task.title}` : `Tick ${task.title}`}
        className={cn(
          BOARD_ROW_CHECK,
          done
            ? "border-gd-green bg-gd-green text-white"
            : "border-black/20 hover:border-black/45",
        )}
      >
        {done ? <Check className="size-3" /> : null}
      </Button>

      <span
        aria-hidden
        className={cn(
          "pointer-events-none relative z-10 min-w-0 flex-1 truncate py-0.5 text-left text-[12.5px] font-medium transition",
          done ? "text-black/55 line-through" : "text-black/80",
          "group-hover:text-black",
        )}
      >
        {task.title}
      </span>

      <BoardDetailButton hasDetail={hasDetail} noun="task" onOpen={onOpen} />

      {failed ? (
        <span role="alert" className="shrink-0 text-[9px] text-red-600">
          Not saved
        </span>
      ) : null}
    </li>
  );
}

function firstLine(doc: IdeaDoc): string {
  const walk = (nodes: IdeaDoc["content"]): string => {
    for (const node of nodes ?? []) {
      if (node.type === "text" && node.text?.trim()) return node.text.trim();
      const nested = walk((node.content ?? []) as IdeaDoc["content"]);
      if (nested) return nested;
    }
    return "";
  };
  return walk(doc.content).replace(/\s+/g, " ").slice(0, 240);
}

function nodeText(node: IdeaNode): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(nodeText).join("");
}

// seedDoc writes the title in as a heading, so a task with nothing but a title
// still has one node. Detail means anything beyond that.
function hasDetail(task: MilestoneCard): boolean {
  const nodes = task.doc.content ?? [];
  if (!nodes.length) return false;

  const [first, ...rest] = nodes;
  const body =
    first.type === "heading" && nodeText(first).trim() === task.title.trim()
      ? rest
      : nodes;

  return body.some(
    (node) => node.type === "attachment" || nodeText(node).trim() !== "",
  );
}

function seedDoc(task: MilestoneCard | null): IdeaDoc {
  if (!task) return EMPTY_DOC;
  if (task.doc.content.length) {
    const written = firstLine(task.doc);
    if (written === task.title) return task.doc;
    return {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: task.title }],
        },
        ...task.doc.content,
      ],
    };
  }
  return {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: task.title }],
      },
    ],
  };
}

function TaskEditor({
  projectId,
  weekId,
  task,
  editable,
  upload,
  onClose,
  save,
}: {
  projectId: string;
  weekId: string;
  task: MilestoneCard | null;
  editable: boolean;
  upload: UploadAction;
  onClose: () => void;
  save: WorkBoardActions["saveTask"];
}) {
  const initial = seedDoc(task);
  const [error, setError] = useState<string | null>(null);
  const [pending, startSaving] = useTransition();
  const doc = useRef<IdeaDoc>(initial);
  const editor = useRef<IdeaEditorHandle>(null);
  const attach = useAttachment({
    projectId,
    upload,
    editorRef: editor,
    canEdit: editable,
  });

  function submit() {
    const title = firstLine(doc.current);
    if (!title) {
      setError("Write the task on the first line.");
      return;
    }

    setError(null);
    startSaving(async () => {
      const result = await save({
        projectId,
        weekId,
        cardId: task?.id,
        title,
        doc: JSON.stringify(doc.current),
      });
      if (result.status === "error") setError(result.message);
      else onClose();
    });
  }

  const title = task ? (editable ? "Edit task" : "Task details") : "New task";

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        overlayClassName="z-60 bg-black/45 supports-backdrop-filter:backdrop-blur-[3px]"
        className="z-60 flex h-[min(90dvh,860px)] w-[calc(100%-1.5rem)] max-w-[min(calc(100vw-1.5rem),68rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-white p-0 shadow-[0_30px_80px_rgba(0,0,0,0.4)] sm:max-w-[min(calc(100vw-1.5rem),68rem)]"
      >
        <div className="bg-gd-panel-dark flex shrink-0 items-center gap-2 px-3 py-2 text-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="focus-visible:ring-brand/55 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <DialogTitle className="text-brand font-mono text-[10px] font-semibold tracking-[0.14em] uppercase">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editable
              ? "Edit the task title and rich text details."
              : "View the task rich text details."}
          </DialogDescription>

          {attach.error ? (
            <span role="alert" className="ml-auto text-[11px] text-red-300">
              {attach.error}
            </span>
          ) : null}

          {attach.input}
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col"
          onDrop={editable ? attach.onDrop : undefined}
          onDragOver={editable ? attach.onDragOver : undefined}
        >
          <IdeaEditor
            ref={editor}
            initialDoc={initial}
            editable={editable}
            contentClassName="mx-auto w-full max-w-3xl"
            placeholder="First line is the task. Everything under it is the detail."
            onChange={(next) => {
              doc.current = next as IdeaDoc;
            }}
            onAttach={editable ? attach.open : undefined}
            attaching={attach.uploading}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-black/[0.08] bg-[#fbfbf7] px-3 py-2">
          {error ? (
            <span role="alert" className="text-[11px] text-red-600">
              {error}
            </span>
          ) : (
            <span className="text-[10px] text-black/60">
              {editable
                ? "The first line becomes the task title."
                : "Task detail is view only."}
            </span>
          )}
          {editable ? (
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={pending}
                className="text-[11px]"
              >
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={pending}
                className="text-[11px]"
              >
                {pending ? <Loader2 className="size-3 animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={onClose}
              className="ml-auto text-[11px]"
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProposalReview({
  projectId,
  weekId,
  proposals,
  onClose,
  accept,
}: {
  projectId: string;
  weekId: string;
  proposals: ProposedTask[];
  onClose: () => void;
  accept: WorkBoardActions["accept"];
}) {
  const [rows, setRows] = useState(() =>
    proposals.map((task) => ({
      title: task.title,
      detail: task.detail,
      references: task.references,
      existingId: task.existingId,
      existingTitle: task.existingTitle,
      keep: true,
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startSaving] = useTransition();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const chosen = rows.filter((row) => row.keep);

  function update(index: number, patch: Partial<(typeof rows)[number]>) {
    setRows((all) =>
      all.map((row, position) =>
        position === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function submit() {
    setError(null);
    startSaving(async () => {
      const result = await accept(
        projectId,
        weekId,
        chosen.map((row) => ({
          title: row.title,
          detail: row.detail,
          references: row.references,
          existingId: row.existingId,
        })),
      );
      if (result.status === "error") setError(result.message);
      else onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-60 grid place-items-center bg-black/30 p-3">
      <div
        role="dialog"
        aria-label="Review suggested tasks"
        className="flex h-[min(80vh,640px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-black/[0.09] bg-white shadow-lg"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-black/[0.07] px-3 py-2">
          <Sparkles className="text-gd-green-deep size-3.5" />
          <span className="text-[12px] font-semibold">Suggested tasks</span>
          <span className="font-mono text-[10px] text-black/55">
            {chosen.length} of {rows.length}
          </span>
          <Button
            variant="bare"
            size="none"
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto grid size-7 place-items-center rounded-lg text-black/60 transition hover:bg-black/[0.06] hover:text-black"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-2.5">
          {rows.map((row, index) => (
            <div
              key={index}
              className={cn(
                "rounded-xl border px-2.5 py-2 transition",
                row.keep
                  ? "border-black/[0.12] bg-white"
                  : "border-black/[0.06] bg-black/[0.02]",
              )}
            >
              <div className="flex items-start gap-2">
                <Button
                  variant="bare"
                  size="none"
                  type="button"
                  role="checkbox"
                  aria-checked={row.keep}
                  aria-label={`Keep ${row.title}`}
                  onClick={() => update(index, { keep: !row.keep })}
                  className={cn(
                    "mt-1 grid size-4 shrink-0 place-items-center rounded border transition",
                    row.keep
                      ? "border-gd-green bg-gd-green text-white"
                      : "border-black/20 hover:border-black/45",
                  )}
                >
                  {row.keep ? <Check className="size-3" /> : null}
                </Button>

                <div className="min-w-0 flex-1">
                  <Input
                    variant="bare"
                    value={row.title}
                    onChange={(event) =>
                      update(index, { title: event.target.value.slice(0, 240) })
                    }
                    aria-label="Task title"
                    className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[12px] text-black/80 outline-none hover:border-black/[0.09] focus:border-black/30 focus:bg-white"
                  />
                  {row.existingTitle ? (
                    <p className="px-1 text-[11px] leading-4 text-black/55">
                      was{" "}
                      <span className="line-through">{row.existingTitle}</span>
                    </p>
                  ) : null}
                  {row.detail ? (
                    <p className="px-1 text-[11px] leading-4 text-black/60">
                      {row.detail}
                    </p>
                  ) : null}
                  {row.references.length ? (
                    <p className="px-1 text-[10px] leading-4 text-black/55">
                      refs: {row.references.join(", ")}
                    </p>
                  ) : null}
                </div>

                <span
                  className={cn(
                    "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                    row.existingId
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-brand/40 bg-brand/10 text-gd-green-deep",
                  )}
                >
                  {row.existingId ? "Tidy" : "New"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-black/[0.07] px-3 py-2">
          {error ? (
            <span role="alert" className="text-[11px] text-red-600">
              {error}
            </span>
          ) : null}
          <Button
            variant="bare"
            size="none"
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-8 items-center rounded-lg px-2.5 text-[11px] font-medium text-black/60 transition hover:text-black"
          >
            Cancel
          </Button>
          <Button
            variant="bare"
            size="none"
            type="button"
            onClick={submit}
            disabled={pending || !chosen.length}
            className="bg-gd-panel-dark inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold text-white transition hover:bg-black disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : null}
            Apply {chosen.length || ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
