"use client";

import { useActionState, useState } from "react";
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
  // Authors board content: owner and project lead.
  canManage: boolean;
  // Moves work along: owner, lead and assigned members.
  canUpdateStatus: boolean;
  // Week planning stayed owner-only.
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
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] bg-black/[0.012] px-4 py-3 sm:px-5">
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
          {/* Something being stuck is the most actionable fact about a week,
              so it is readable without opening anything. */}
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

function BoardColumn({
  title,
  hint,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  hint: string;
  icon: typeof Lightbulb;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2 sm:px-5">
        <Icon className="size-3.5 text-black/35" />
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
  const hasBody = card.blocks.length > 0;

  return (
    <article
      className={cn(
        "rounded-xl border transition duration-150",
        card.status === "blocked"
          ? "border-red-300 border-l-4 border-l-red-500 bg-red-50/50 shadow-[0_1px_10px_-4px_rgba(220,38,38,0.35)]"
          : card.status === "incomplete"
            ? "border-amber-200/80 border-l-4 border-l-amber-400 bg-amber-50/40"
            : "border-black/[0.07] bg-white hover:border-black/[0.14]",
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
            className="block w-full text-left"
          >
            <span
              className={cn(
                "block text-[13px] leading-5 font-medium",
                card.status === "completed"
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
                CARD_STATUS_CHIP[card.status],
              )}
            >
              {CARD_STATUS_LABEL[card.status]}
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

          {/* The blocker stays visible without opening the card — that is the
              whole point of marking something blocked. */}
          {card.status === "blocked" && card.blockerReason ? (
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

          {card.status === "incomplete" && card.carryReason ? (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-100/60 px-2.5 py-2">
              <p className="text-[9px] font-bold tracking-[0.1em] text-amber-800 uppercase">
                Not finished because
              </p>
              <p className="mt-1 text-[11px] leading-5 font-medium text-amber-900">
                {card.carryReason}
              </p>
            </div>
          ) : null}
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setEditing(true);
            }}
            aria-label={`Edit ${card.title}`}
            className={cn(ICON_BUTTON, "shrink-0")}
          >
            <Pencil className="size-3.5" />
          </button>
        ) : null}
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
              onDone={() => setEditing(false)}
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
                <MoveControls
                  projectId={projectId}
                  card={card}
                  nextWeek={nextWeek}
                  canManage={canManage}
                  actions={actions}
                />
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </article>
  );
}

function CardEditor({
  projectId,
  card,
  credentials,
  signedUrls,
  actions,
  onDone,
}: {
  projectId: string;
  card: MilestoneCard;
  credentials: CredentialOption[];
  signedUrls: Record<string, string>;
  actions: BoardActions;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    actions.saveCard,
    IDLE_FORM,
  );
  const [title, setTitle] = useState(card.title);
  const [blocks, setBlocks] = useState<Block[]>(card.blocks);

  async function upload(file: File) {
    const data = new FormData();
    data.set("projectId", projectId);
    data.set("cardId", card.id);
    data.set("file", file);
    return actions.uploadFile(data);
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="cardId" value={card.id} />
      <input type="hidden" name="blocks" value={JSON.stringify(blocks)} />

      <input
        name="title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        aria-label="Card title"
        className={cn(INPUT_SMALL, "h-9 w-full text-[13px] font-medium")}
      />

      <BlockEditor
        blocks={blocks}
        onChange={setBlocks}
        credentials={credentials}
        upload={upload}
        signedUrls={signedUrls}
      />

      {state.status !== "idle" && state.message ? (
        <p
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-medium",
            state.status === "success" ? "text-[#08743d]" : "text-red-700",
          )}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="size-3" />
          ) : (
            <AlertCircle className="size-3" />
          )}
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className={cn(BUTTON_GHOST, "h-8")}
        >
          Done
        </button>
        <button
          type="submit"
          disabled={pending}
          className={cn(BUTTON_PRIMARY, "h-8 text-xs")}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Save card
        </button>
      </div>
    </form>
  );
}

function MoveControls({
  projectId,
  card,
  nextWeek,
  canManage,
  actions,
}: {
  projectId: string;
  card: MilestoneCard;
  nextWeek: MilestoneWeek | null;
  canManage: boolean;
  actions: BoardActions;
}) {
  const [state, formAction, pending] = useActionState(
    actions.moveCard,
    IDLE_FORM,
  );
  const [carryState, carryAction, carrying] = useActionState(
    actions.carryCard,
    IDLE_FORM,
  );
  const [target, setTarget] = useState<CardStatus | null>(null);
  const prompt = target ? reasonFor(target) : null;

  return (
    <div className="mt-3 space-y-2 border-t border-black/[0.06] pt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-black/35">Move to</span>
        {NEXT_STATUSES[card.status].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setTarget(status === target ? null : status)}
            aria-pressed={target === status}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition",
              FOCUS_RING,
              target === status
                ? "border-[#15181b] bg-[#15181b] text-white"
                : "border-black/10 bg-white text-black/55 hover:border-black/25 hover:text-black",
            )}
          >
            {CARD_STATUS_LABEL[status]}
          </button>
        ))}
      </div>

      {target ? (
        <form action={formAction} className="space-y-2">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="cardId" value={card.id} />
          <input type="hidden" name="status" value={target} />

          {prompt ? (
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
                required={prompt.required}
                defaultValue={
                  target === "blocked"
                    ? (card.blockerReason ?? "")
                    : (card.carryReason ?? "")
                }
                placeholder={prompt.placeholder}
                className={cn(INPUT_SMALL, "mt-1 w-full resize-none py-2")}
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={cn(BUTTON_SECONDARY, "h-8 text-xs")}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Move to {CARD_STATUS_LABEL[target].toLowerCase()}
          </button>
        </form>
      ) : null}

      {/* Carrying a card rewrites the plan, so it stays with the authors.
          Only what did not get finished can be carried, and only forward. */}
      {canManage && card.status === "incomplete" && nextWeek ? (
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

      {[state, carryState].map((result, index) =>
        result.status === "error" && result.message ? (
          <p
            key={index}
            className="flex items-center gap-1.5 text-[11px] font-medium text-red-700"
          >
            <AlertCircle className="size-3" />
            {result.message}
          </p>
        ) : null,
      )}
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
