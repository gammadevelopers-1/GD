"use client";

import {
  useActionState,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  AlertCircle,
  Archive,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Ban,
  Lightbulb,
  Loader2,
  MoveRight,
  Pencil,
  Plus,
  Sparkles,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import type { MilestoneCard, MilestoneWeek } from "@/data/project-detail";
import type { Block } from "@/lib/projects/blocks";
import {
  type CardStatus,
  CARD_STATUS_CHIP,
  CARD_STATUS_LABEL,
  NEXT_STATUSES,
  reasonFor,
} from "@/lib/projects/board";
import { type SimpleFormState, IDLE_FORM } from "@/lib/projects/form-state";
import { formatDate } from "@/lib/projects/format";
import {
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  DASHED_ACTION,
  FOCUS_RING,
  ICON_BUTTON,
  INPUT_SMALL,
} from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import {
  BlockEditor,
  type CredentialOption,
} from "@/components/admin/projects/block-editor";
import { BlockView } from "@/components/admin/projects/block-view";
import {
  RichEditor,
  type RichEditorHandle,
} from "@/components/admin/projects/rich-editor";
import { isProseBlock } from "@/lib/projects/rich-doc";
import {
  type AutosaveStatus,
  useAutosave,
} from "@/components/admin/projects/use-autosave";
import { useCloseOnSuccess } from "@/components/admin/projects/use-close-on-success";

type FormAction = (
  state: SimpleFormState,
  formData: FormData,
) => Promise<SimpleFormState>;

export type BoardActions = {
  createCard: FormAction;
  saveCard: FormAction;
  moveCard: FormAction;
  carryCard: FormAction;
  setCardArchived: (formData: FormData) => Promise<void>;
  uploadFile: (formData: FormData) => Promise<{
    status: "idle" | "success" | "error";
    message: string | null;
    path?: string;
    name?: string;
    size?: number;
  }>;
  organiseWeek: FormAction;
  draftCard: (
    state: SimpleFormState,
    formData: FormData,
  ) => Promise<SimpleFormState & { blocks?: unknown }>;
  addWeek: FormAction;
  setWeekArchived: (formData: FormData) => Promise<void>;
};

export function BoardsPanel({
  projectId,
  weeks,
  canManage,
  canUpdateStatus,
  isOwner,
  credentials,
  signedUrls,
  actions,
}: {
  projectId: string;
  weeks: MilestoneWeek[];
  canManage: boolean;
  canUpdateStatus: boolean;
  isOwner: boolean;
  credentials: CredentialOption[];
  signedUrls: Record<string, string>;
  actions: BoardActions;
}) {
  if (!weeks.length) {
    return (
      <section className="card-surface rounded-2xl border border-black/[0.06] p-8 text-center">
        <Lightbulb className="mx-auto size-6 text-black/25" />
        <h2 className="mt-3 text-[15px] font-semibold">No weeks planned yet</h2>
        <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-6 text-black/45">
          A week holds two boards: ideas on the left, and what actually happened
          on the right.
        </p>
        {isOwner ? (
          <div className="mx-auto mt-5 max-w-sm">
            <AddWeekForm projectId={projectId} action={actions.addWeek} />
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {weeks.map((week, index) => (
        <WeekBoards
          key={week.id}
          projectId={projectId}
          week={week}
          nextWeek={weeks[index + 1] ?? null}
          canManage={canManage}
          canUpdateStatus={canUpdateStatus}
          isOwner={isOwner}
          credentials={credentials}
          signedUrls={signedUrls}
          actions={actions}
        />
      ))}

      {isOwner ? (
        <AddWeekForm projectId={projectId} action={actions.addWeek} />
      ) : null}
    </div>
  );
}

function WeekBoards({
  projectId,
  week,
  nextWeek,
  canManage,
  canUpdateStatus,
  isOwner,
  credentials,
  signedUrls,
  actions,
}: {
  projectId: string;
  week: MilestoneWeek;
  nextWeek: MilestoneWeek | null;
  canManage: boolean;
  canUpdateStatus: boolean;
  isOwner: boolean;
  credentials: CredentialOption[];
  signedUrls: Record<string, string>;
  actions: BoardActions;
}) {
  const [organise, organiseAction, organising] = useActionState(
    actions.organiseWeek,
    IDLE_FORM,
  );
  const blockedCount = week.workCards.filter(
    (card) => card.status === "blocked",
  ).length;

  return (
    <section
      className={cn(
        "card-surface overflow-hidden rounded-2xl border transition-colors",
        blockedCount
          ? "border-red-300 shadow-[0_0_0_3px_rgba(220,38,38,0.06)]"
          : week.isCurrent
            ? "border-[#2fe85c]/45 shadow-[0_0_0_3px_rgba(47,232,92,0.07)]"
            : "border-black/[0.06]",
      )}
    >
      <header
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5",
          blockedCount
            ? "border-red-200/70 bg-red-50/60"
            : week.isOverdue
              ? "border-amber-200/60 bg-amber-50/50"
              : week.isCurrent
                ? "border-[#2fe85c]/20 bg-[#2fe85c]/[0.06]"
                : "border-black/[0.06] bg-black/[0.02]",
        )}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h3 className="text-[15px] font-semibold tracking-[-0.02em]">
            Week {week.number}
          </h3>
          {week.isCurrent ? (
            <span className="rounded-full bg-[#2fe85c]/15 px-2 py-0.5 text-[9px] font-semibold tracking-[0.08em] text-[#08743d] uppercase">
              This week
            </span>
          ) : null}
          {week.isOverdue ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
              Overdue
            </span>
          ) : null}
          {blockedCount ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800">
              <Ban className="size-2.5" />
              {blockedCount} blocked
            </span>
          ) : null}
          <span className="font-mono text-[10px] text-black/40">
            {week.done}/{week.total} done · due {formatDate(week.dueOn)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {canManage && week.ideaCards.length > 1 ? (
            <form action={organiseAction}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="weekId" value={week.id} />
              <button
                type="submit"
                disabled={organising}
                title="Suggest an order for this week's ideas"
                className={cn(BUTTON_GHOST, "h-8")}
              >
                {organising ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Suggest order
              </button>
            </form>
          ) : null}
          {isOwner ? (
            <form action={actions.setWeekArchived}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="weekId" value={week.id} />
              <input type="hidden" name="archived" value="1" />
              <button
                type="submit"
                aria-label={`Archive week ${week.number}`}
                className={ICON_BUTTON}
              >
                <Archive className="size-3.5" />
              </button>
            </form>
          ) : null}
        </div>
      </header>

      {organise.status !== "idle" && organise.message ? (
        <p
          className={cn(
            "flex items-center gap-1.5 border-b border-black/[0.06] px-4 py-2 text-[11px] sm:px-5",
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

      <div className="grid gap-px bg-black/[0.06] lg:grid-cols-2">
        <BoardColumn
          title="Idea Board"
          hint="Anything worth doing this week"
          icon={Lightbulb}
          count={week.ideaCards.length}
          tone="idea"
        >
          {week.ideaCards.map((card) => (
            <CardRow
              key={card.id}
              projectId={projectId}
              card={card}
              nextWeek={nextWeek}
              canManage={canManage}
              canUpdateStatus={canUpdateStatus}
              credentials={credentials}
              signedUrls={signedUrls}
              actions={actions}
            />
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

        <BoardColumn
          title="Work Board"
          hint="What actually happened, in order"
          icon={CheckCircle2}
          count={week.workCards.length}
          tone="work"
        >
          {week.workCards.length ? (
            week.workCards.map((card) => (
              <CardRow
                key={card.id}
                projectId={projectId}
                card={card}
                nextWeek={nextWeek}
                canManage={canManage}
                canUpdateStatus={canUpdateStatus}
                credentials={credentials}
                signedUrls={signedUrls}
                actions={actions}
              />
            ))
          ) : (
            <EmptyNote>
              Nothing has moved across yet. Start an idea to bring it here.
            </EmptyNote>
          )}
        </BoardColumn>
      </div>
    </section>
  );
}

const COLUMN_TONE = {
  idea: {
    surface: "bg-[#fbf9f1]",
    chip: "bg-amber-400/15 text-amber-700",
  },
  work: {
    surface: "bg-white",
    chip: "bg-[#2fe85c]/14 text-[#08743d]",
  },
} as const;

function BoardColumn({
  title,
  hint,
  icon: Icon,
  count,
  tone,
  children,
}: {
  title: string;
  hint: string;
  icon: typeof Lightbulb;
  count: number;
  tone: keyof typeof COLUMN_TONE;
  children: React.ReactNode;
}) {
  return (
    <div className={COLUMN_TONE[tone].surface}>
      <div className="flex items-center gap-2 px-4 pt-4 pb-2.5 sm:px-5">
        <span
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-md",
            COLUMN_TONE[tone].chip,
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <h4 className="text-[12px] font-semibold tracking-[-0.01em]">{title}</h4>
        <span className="font-mono text-[10px] text-black/30">{count}</span>
        <span className="ml-auto hidden text-[10px] text-black/30 sm:block">
          {hint}
        </span>
      </div>
      <div className="space-y-2 px-3 pb-4 sm:px-4">{children}</div>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-black/10 px-3 py-4 text-center text-[11px] text-black/35">
      {children}
    </p>
  );
}

const QUICK_ACTION: Record<CardStatus, { label: string; target: CardStatus }> = {
  idea: { label: "Start", target: "in_progress" },
  in_progress: { label: "Complete", target: "completed" },
  blocked: { label: "Resume", target: "in_progress" },
  completed: { label: "Reopen", target: "in_progress" },
  incomplete: { label: "Reopen", target: "in_progress" },
};

function CardRow({
  projectId,
  card,
  nextWeek,
  canManage,
  canUpdateStatus,
  credentials,
  signedUrls,
  actions,
}: {
  projectId: string;
  card: MilestoneCard;
  nextWeek: MilestoneWeek | null;
  canManage: boolean;
  canUpdateStatus: boolean;
  credentials: CredentialOption[];
  signedUrls: Record<string, string>;
  actions: BoardActions;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [status, setOptimisticStatus] = useOptimistic(card.status);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moving, startMoving] = useTransition();
  const hasBody = card.blocks.length > 0;

  function move(target: CardStatus, reason?: string) {
    setMoveError(null);
    startMoving(async () => {
      setOptimisticStatus(target);
      const data = new FormData();
      data.set("projectId", projectId);
      data.set("cardId", card.id);
      data.set("status", target);
      if (reason !== undefined) data.set("reason", reason);
      const result = await actions.moveCard(IDLE_FORM, data);
      if (result.status === "error") {
        setMoveError(result.message ?? "That move was not allowed.");
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <article
      className={cn(
        "rounded-xl border transition duration-150",
        status === "blocked"
          ? "border-red-300 border-l-4 border-l-red-500 bg-red-50/50 shadow-[0_1px_10px_-4px_rgba(220,38,38,0.35)]"
          : status === "incomplete"
            ? "border-amber-200/80 border-l-4 border-l-amber-400 bg-amber-50/40"
            : status === "completed"
              ? "border-[#16a34a]/20 border-l-4 border-l-[#16a34a]/60 bg-[#f2fbf4]"
              : "border-black/[0.07] bg-white hover:border-black/[0.14] hover:shadow-[0_6px_16px_rgba(20,23,26,0.05)]",
      )}
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={cn(
            "mt-0.5 shrink-0 rounded text-black/30 transition hover:text-black/70",
            FOCUS_RING,
          )}
          aria-label={open ? "Collapse card" : "Expand card"}
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform duration-200",
              open && "rotate-90",
            )}
          />
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex w-full items-start gap-1.5 text-left"
          >
            {status === "blocked" ? (
              <Ban className="mt-0.5 size-3.5 shrink-0 text-red-600" />
            ) : status === "incomplete" ? (
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
            ) : status === "completed" ? (
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#16a34a]" />
            ) : null}
            <span
              className={cn(
                "block min-w-0 text-[13px] leading-5 font-medium",
                status === "completed"
                  ? "text-black/40 line-through"
                  : "text-black/80",
              )}
            >
              {card.title}
            </span>
          </button>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                CARD_STATUS_CHIP[status],
              )}
            >
              {CARD_STATUS_LABEL[status]}
            </span>
            {card.carriedFromWeek ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] bg-black/[0.02] px-2 py-0.5 text-[10px] text-black/45">
                <Undo2 className="size-2.5" />
                from week {card.carriedFromWeek}
              </span>
            ) : null}
            {hasBody ? (
              <span className="text-[10px] text-black/30">
                {card.blocks.length} block{card.blocks.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

          {status === "blocked" && card.blockerReason ? (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-100/70 px-2.5 py-2">
              <p className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.1em] text-red-700 uppercase">
                <Ban className="size-2.5" />
                Blocked by
              </p>
              <p className="mt-1 text-[11px] leading-5 font-medium text-red-900">
                {card.blockerReason}
              </p>
            </div>
          ) : null}

          {status === "incomplete" && card.carryReason ? (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-100/60 px-2.5 py-2">
              <p className="text-[9px] font-bold tracking-[0.1em] text-amber-800 uppercase">
                Not finished because
              </p>
              <p className="mt-1 text-[11px] leading-5 font-medium text-amber-900">
                {card.carryReason}
              </p>
            </div>
          ) : null}

          {moveError ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-red-700">
              <AlertCircle className="size-3" />
              {moveError}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {canUpdateStatus ? (
            <button
              type="button"
              onClick={() => move(QUICK_ACTION[status].target)}
              disabled={moving}
              title={`${QUICK_ACTION[status].label} this card`}
              className={cn(
                BUTTON_GHOST,
                "h-7 px-2 text-[11px] disabled:opacity-50",
              )}
            >
              {moving ? <Loader2 className="size-3 animate-spin" /> : null}
              {QUICK_ACTION[status].label}
            </button>
          ) : null}
          {canManage ? (
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                setEditing(true);
              }}
              aria-label={`Edit ${card.title}`}
              className={ICON_BUTTON}
            >
              <Pencil className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="border-t border-black/[0.06] px-3 py-3">
          {editing && canManage ? (
            <CardEditor
              projectId={projectId}
              card={card}
              credentials={credentials}
              signedUrls={signedUrls}
              actions={actions}
              onClose={() => setEditing(false)}
            />
          ) : (
            <>
              {hasBody ? (
                <BlockView blocks={card.blocks} signedUrls={signedUrls} />
              ) : (
                <p className="text-[11px] text-black/35">
                  Nothing written on this card yet.
                </p>
              )}

              {canUpdateStatus ? (
                <StatusControls
                  projectId={projectId}
                  card={card}
                  status={status}
                  nextWeek={nextWeek}
                  canManage={canManage}
                  actions={actions}
                  moving={moving}
                  onMove={move}
                  onMoved={() => setOpen(false)}
                />
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </article>
  );
}

function SaveIndicator({
  status,
  message,
}: {
  status: AutosaveStatus;
  message: string | null;
}) {
  if (status === "idle") return null;
  if (status === "error") {
    return (
      <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-red-700">
        <AlertCircle className="size-3" />
        {message ?? "Not saved"}
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-[#08743d]">
        <CheckCircle2 className="size-3" />
        Saved
      </span>
    );
  }
  return (
    <span className="flex shrink-0 items-center gap-1 text-[10px] text-black/40">
      <Loader2 className="size-3 animate-spin" />
      Saving…
    </span>
  );
}

function CardEditor({
  projectId,
  card,
  credentials,
  signedUrls,
  actions,
  onClose,
}: {
  projectId: string;
  card: MilestoneCard;
  credentials: CredentialOption[];
  signedUrls: Record<string, string>;
  actions: BoardActions;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [prose, setProse] = useState<Block[]>(() =>
    card.blocks.filter(isProseBlock),
  );
  const [extras, setExtras] = useState<Block[]>(() =>
    card.blocks.filter((block) => !isProseBlock(block)),
  );
  const [drafting, setDrafting] = useState(false);
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const editorRef = useRef<RichEditorHandle>(null);

  const autosave = useAutosave(() => {
    const data = new FormData();
    data.set("projectId", projectId);
    data.set("cardId", card.id);
    data.set("title", title);
    data.set("blocks", JSON.stringify([...prose, ...extras]));
    return actions.saveCard(IDLE_FORM, data);
  });
  const { flush, schedule } = autosave;

  useEffect(() => () => flush(), [flush]);

  async function draft() {
    setDrafting(true);
    setDraftNote(null);
    const data = new FormData();
    data.set("projectId", projectId);
    data.set("title", title);
    data.set("blocks", JSON.stringify([...prose, ...extras]));

    const result = await actions.draftCard(IDLE_FORM, data);
    setDrafting(false);

    if (result.status !== "success" || !Array.isArray(result.blocks)) {
      setDraftNote(result.message ?? "Nothing came back.");
      return;
    }
    const drafted = result.blocks as Block[];
    const draftedProse = drafted.filter(isProseBlock);
    const draftedExtras = drafted.filter((block) => !isProseBlock(block));
    if (draftedProse.length) editorRef.current?.appendBlocks(draftedProse);
    if (draftedExtras.length) {
      setExtras((current) => [...current, ...draftedExtras]);
      schedule();
    }
    setDraftNote(result.message);
  }

  async function upload(file: File) {
    const data = new FormData();
    data.set("projectId", projectId);
    data.set("cardId", card.id);
    data.set("file", file);
    return actions.uploadFile(data);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            schedule();
          }}
          aria-label="Card title"
          className={cn(INPUT_SMALL, "h-9 w-full text-[13px] font-medium")}
        />
        <SaveIndicator status={autosave.status} message={autosave.message} />
      </div>

      <RichEditor
        ref={editorRef}
        initialBlocks={prose}
        onChange={(blocks) => {
          setProse(blocks);
          schedule();
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void draft()}
          disabled={drafting || !title.trim()}
          title="Draft steps and risks for this card"
          className={cn(BUTTON_GHOST, "h-8 disabled:opacity-40")}
        >
          {drafting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          Draft with AI
        </button>
        {draftNote ? (
          <span className="text-[10px] text-black/45">{draftNote}</span>
        ) : null}
      </div>

      <BlockEditor
        blocks={extras}
        onChange={(blocks) => {
          setExtras(blocks);
          schedule();
        }}
        credentials={credentials}
        upload={upload}
        signedUrls={signedUrls}
        allowedTypes={["callout", "image", "file", "credential"]}
        addLabel="Add a callout, image, file or credential"
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            flush();
            onClose();
          }}
          className={cn(BUTTON_SECONDARY, "h-8 text-xs")}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function StatusControls({
  projectId,
  card,
  status,
  nextWeek,
  canManage,
  actions,
  moving,
  onMove,
  onMoved,
}: {
  projectId: string;
  card: MilestoneCard;
  status: CardStatus;
  nextWeek: MilestoneWeek | null;
  canManage: boolean;
  actions: BoardActions;
  moving: boolean;
  onMove: (target: CardStatus, reason?: string) => void;
  onMoved: () => void;
}) {
  const [carryState, carryAction, carrying] = useActionState(
    actions.carryCard,
    IDLE_FORM,
  );
  const [reasonTarget, setReasonTarget] = useState<CardStatus | null>(null);
  const prompt = reasonTarget ? reasonFor(reasonTarget) : null;

  useCloseOnSuccess(carryState, onMoved);

  return (
    <div className="mt-3 space-y-2 border-t border-black/[0.06] pt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-black/35">Move to</span>
        {NEXT_STATUSES[status].map((next) => (
          <button
            key={next}
            type="button"
            disabled={moving}
            onClick={() => {
              if (reasonFor(next)) {
                setReasonTarget(next === reasonTarget ? null : next);
              } else {
                setReasonTarget(null);
                onMove(next);
              }
            }}
            aria-pressed={reasonTarget === next}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition disabled:opacity-50",
              FOCUS_RING,
              reasonTarget === next
                ? "border-[#15181b] bg-[#15181b] text-white"
                : "border-black/10 bg-white text-black/55 hover:border-black/25 hover:text-black",
            )}
          >
            {CARD_STATUS_LABEL[next]}
          </button>
        ))}
        {moving ? (
          <Loader2 className="size-3 animate-spin text-black/35" />
        ) : null}
      </div>

      {reasonTarget && prompt ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const reason = new FormData(event.currentTarget).get("reason");
            const target = reasonTarget;
            setReasonTarget(null);
            onMove(target, String(reason ?? ""));
          }}
          className="space-y-2"
        >
          <div>
            <label
              htmlFor={`reason-${card.id}`}
              className="text-[10px] font-medium text-black/50"
            >
              {prompt.label}
              {prompt.required ? (
                <span className="ml-1 text-red-600">*</span>
              ) : null}
            </label>
            <textarea
              id={`reason-${card.id}`}
              name="reason"
              rows={2}
              autoFocus
              required={prompt.required}
              defaultValue={
                reasonTarget === "blocked"
                  ? (card.blockerReason ?? "")
                  : (card.carryReason ?? "")
              }
              placeholder={prompt.placeholder}
              className={cn(INPUT_SMALL, "mt-1 w-full resize-none py-2")}
            />
          </div>
          <button
            type="submit"
            disabled={moving}
            className={cn(BUTTON_SECONDARY, "h-8 text-xs")}
          >
            Move to {CARD_STATUS_LABEL[reasonTarget].toLowerCase()}
          </button>
        </form>
      ) : null}

      {canManage && status === "incomplete" && nextWeek ? (
        <form action={carryAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="cardId" value={card.id} />
          <input type="hidden" name="weekId" value={nextWeek.id} />
          <button
            type="submit"
            disabled={carrying}
            className={cn(BUTTON_SECONDARY, "h-8 text-xs")}
          >
            {carrying ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <MoveRight className="size-3.5" />
            )}
            Carry into week {nextWeek.number}
          </button>
          <span className="text-[10px] text-black/35">
            Keeps the reason it slipped.
          </span>
        </form>
      ) : null}

      {carryState.status === "error" && carryState.message ? (
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-700">
          <AlertCircle className="size-3" />
          {carryState.message}
        </p>
      ) : null}
    </div>
  );
}

function AddCardForm({
  projectId,
  weekId,
  action,
}: {
  projectId: string;
  weekId: string;
  action: FormAction;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [open, setOpen] = useState(false);

  useCloseOnSuccess(state, () => setOpen(false));

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(DASHED_ACTION, "py-2.5 text-[11px]")}
      >
        <Plus className="size-3.5" />
        Add an idea
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="weekId" value={weekId} />
      <input
        name="title"
        autoFocus
        placeholder="What could we do this week?"
        className={cn(INPUT_SMALL, "h-9 w-full")}
      />
      {state.status === "error" && state.message ? (
        <p className="text-[11px] font-medium text-red-700">{state.message}</p>
      ) : null}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={cn(BUTTON_GHOST, "h-8")}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className={cn(BUTTON_PRIMARY, "h-8 text-xs")}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Add
        </button>
      </div>
    </form>
  );
}

function AddWeekForm({
  projectId,
  action,
}: {
  projectId: string;
  action: FormAction;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [open, setOpen] = useState(false);

  useCloseOnSuccess(state, () => setOpen(false));

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={DASHED_ACTION}
      >
        <CalendarPlus className="size-4" />
        Plan another week
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="card-surface space-y-3 rounded-2xl border border-black/[0.06] p-4"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-[11px] font-medium text-black/50">
          Week number
          <input
            name="weekNumber"
            type="number"
            min={1}
            required
            className={cn(INPUT_SMALL, "mt-1 h-9 w-full")}
          />
        </label>
        <label className="text-[11px] font-medium text-black/50">
          Starts on
          <input
            name="startsOn"
            type="date"
            className={cn(INPUT_SMALL, "mt-1 h-9 w-full")}
          />
        </label>
        <label className="text-[11px] font-medium text-black/50">
          Due on
          <input
            name="dueOn"
            type="date"
            required
            className={cn(INPUT_SMALL, "mt-1 h-9 w-full")}
          />
        </label>
      </div>
      {state.status === "error" && state.message ? (
        <p className="text-[11px] font-medium text-red-700">{state.message}</p>
      ) : null}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={cn(BUTTON_GHOST, "h-9")}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className={cn(BUTTON_PRIMARY, "h-9 text-xs")}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Add week
        </button>
      </div>
    </form>
  );
}
