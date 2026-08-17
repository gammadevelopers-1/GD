"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  CalendarPlus,
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react";
import type { MilestoneItem, MilestoneWeek } from "@/data/project-detail";
import { type SimpleFormState, IDLE_FORM } from "@/lib/projects/form-state";
import { formatDate } from "@/lib/projects/format";
import {
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  DASHED_ACTION,
  FOCUS_RING,
  ICON_BUTTON,
  ICON_BUTTON_DANGER,
  INPUT_SMALL,
  REVEAL_ON_HOVER,
  ROW_HOVER,
} from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

type Person = { id: string; name: string };

type FormAction = (
  state: SimpleFormState,
  formData: FormData,
) => Promise<SimpleFormState>;
type PlainAction = (formData: FormData) => Promise<void>;

export type MilestoneActions = {
  toggleItem: PlainAction;
  addWeek: FormAction;
  updateWeek: FormAction;
  setWeekArchived: PlainAction;
  addItem: FormAction;
  saveItem: FormAction;
  setItemArchived: PlainAction;
};

export function MilestonesPanel({
  projectId,
  weeks,
  archivedWeeks,
  members,
  isOwner,
  actions,
}: {
  projectId: string;
  weeks: MilestoneWeek[];
  archivedWeeks: MilestoneWeek[];
  members: Person[];
  isOwner: boolean;
  actions: MilestoneActions;
}) {
  const nextWeekNumber =
    weeks.reduce((highest, week) => Math.max(highest, week.number), 0) + 1;
  const totalItems = weeks.reduce((sum, week) => sum + week.total, 0);
  const doneItems = weeks.reduce((sum, week) => sum + week.done, 0);

  return (
    <div className="space-y-3">
      {weeks.length ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-xs text-black/45">
              {weeks.length} week{weeks.length === 1 ? "" : "s"} planned ·{" "}
              {doneItems} of {totalItems} item{totalItems === 1 ? "" : "s"} done
            </p>
            {isOwner ? (
              <p className="text-[11px] text-black/35">
                Members can tick items off. Only you can change the plan.
              </p>
            ) : (
              <p className="text-[11px] text-black/35">
                Tick items off as you finish them.
              </p>
            )}
          </div>
          {weeks.map((week) => (
            <WeekCard
              key={week.id}
              projectId={projectId}
              week={week}
              members={members}
              isOwner={isOwner}
              actions={actions}
            />
          ))}
        </>
      ) : (
        <div className="rounded-[20px] border border-dashed border-black/10 bg-white/35 px-6 py-10 text-center">
          <h2 className="text-sm font-semibold">No weeks planned yet</h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-black/45">
            Work is laid out as a sequence of weeks, each holding a handful of
            things that should be done by the end of it. Every item is simply
            done or not done — no sub-tasks, no priorities.
          </p>
        </div>
      )}

      {isOwner ? (
        <AddWeekForm
          projectId={projectId}
          nextWeekNumber={nextWeekNumber}
          addWeek={actions.addWeek}
        />
      ) : null}

      {isOwner && archivedWeeks.length ? (
        <ArchivedWeeks
          projectId={projectId}
          weeks={archivedWeeks}
          setWeekArchived={actions.setWeekArchived}
        />
      ) : null}
    </div>
  );
}

function WeekCard({
  projectId,
  week,
  members,
  isOwner,
  actions,
}: {
  projectId: string;
  week: MilestoneWeek;
  members: Person[];
  isOwner: boolean;
  actions: MilestoneActions;
}) {
  const [editingWeek, setEditingWeek] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const progress = week.total ? Math.round((week.done / week.total) * 100) : 0;

  return (
    <section
      className={cn(
        "group/week spot card-surface relative overflow-hidden rounded-2xl border transition duration-300",
        week.isCurrent
          ? "border-[#2fe85c]/45 shadow-[0_10px_30px_rgba(47,232,92,0.08)]"
          : "border-black/[0.07] hover:border-black/[0.13]",
      )}
    >
      {week.isCurrent ? (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px] bg-[#2fe85c]"
        />
      ) : null}

      <header className="border-b border-black/[0.06] px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">Week {week.number}</h2>
              {week.isCurrent ? (
                <span className="rounded-full bg-[#2fe85c]/15 px-2 py-0.5 text-[9px] font-semibold text-[#08743d]">
                  Current week
                </span>
              ) : null}
              {week.isOverdue ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-semibold text-red-700">
                  <AlertTriangle className="size-2.5" /> Overdue
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[10px] text-black/38">
              {week.startsOn ? `${formatDate(week.startsOn)} — ` : "Due "}
              {formatDate(week.dueOn)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/[0.07]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    week.isOverdue ? "bg-red-500" : "bg-[#2fe85c]",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] text-black/38">
                {week.done}/{week.total}
              </span>
            </div>

            {isOwner ? (
              <div
                className={cn(
                  "flex items-center gap-1",
                  "opacity-100 sm:opacity-60 sm:transition-opacity sm:duration-150 sm:group-hover/week:opacity-100",
                )}
              >
                <button
                  type="button"
                  onClick={() => setEditingWeek((open) => !open)}
                  aria-label={`Edit week ${week.number}`}
                  aria-expanded={editingWeek}
                  className={ICON_BUTTON}
                >
                  <Pencil className="size-3.5" />
                </button>
                <form action={actions.setWeekArchived} className="flex">
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="weekId" value={week.id} />
                  <input type="hidden" name="archived" value="1" />
                  <button
                    type="submit"
                    aria-label={`Archive week ${week.number}`}
                    className={ICON_BUTTON_DANGER}
                  >
                    <Archive className="size-3.5" />
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>

        {editingWeek ? (
          <WeekForm
            projectId={projectId}
            week={week}
            action={actions.updateWeek}
            submitLabel="Save week"
            onDone={() => setEditingWeek(false)}
          />
        ) : null}
      </header>

      <div className="divide-y divide-black/[0.055]">
        {week.items.length ? (
          week.items.map((item) => (
            <ItemRow
              key={item.id}
              projectId={projectId}
              item={item}
              members={members}
              isOwner={isOwner}
              actions={actions}
            />
          ))
        ) : (
          <p className="px-4 py-5 text-sm text-black/40 sm:px-5">
            Nothing planned for this week yet.
          </p>
        )}
      </div>

      {isOwner ? (
        <div className="border-t border-black/[0.06] px-4 py-3 sm:px-5">
          {addingItem ? (
            <ItemForm
              projectId={projectId}
              weekId={week.id}
              members={members}
              action={actions.addItem}
              submitLabel="Add item"
              onDone={() => setAddingItem(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingItem(true)}
              className={cn(
                BUTTON_GHOST,
                "-ml-2.5 h-8 text-[11px] font-semibold text-[#08743d] hover:bg-[#2fe85c]/10 hover:text-[#08743d]",
              )}
            >
              <Plus className="size-3.5" />
              Add an item to week {week.number}
            </button>
          )}

          {week.archivedItems.length ? (
            <div className="mt-3 border-t border-black/[0.05] pt-3">
              <button
                type="button"
                onClick={() => setShowArchived((open) => !open)}
                aria-expanded={showArchived}
                className={cn(
                  "rounded px-1 text-[10px] font-medium text-black/40 transition-colors duration-150 hover:text-black",
                  FOCUS_RING,
                )}
              >
                {showArchived ? "Hide" : "Show"} {week.archivedItems.length}{" "}
                removed item{week.archivedItems.length === 1 ? "" : "s"}
              </button>
              {showArchived ? (
                <ul className="mt-2 space-y-1.5">
                  {week.archivedItems.map((item) => (
                    <li
                      key={item.id}
                      className="group/removed flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/[0.03] px-2.5 py-1.5 transition-colors duration-150 hover:bg-black/[0.05]"
                    >
                      <span className="min-w-0 truncate text-[12px] text-black/45 line-through">
                        {item.label}
                      </span>
                      <form action={actions.setItemArchived}>
                        <input
                          type="hidden"
                          name="projectId"
                          value={projectId}
                        />
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="archived" value="0" />
                        <button
                          type="submit"
                          className={cn(
                            "inline-flex items-center gap-1 rounded px-1 text-[10px] font-semibold text-[#08743d] transition hover:underline",
                            FOCUS_RING,
                          )}
                        >
                          <RotateCcw className="size-2.5" />
                          Restore
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ItemRow({
  projectId,
  item,
  members,
  isOwner,
  actions,
}: {
  projectId: string;
  item: MilestoneItem;
  members: Person[];
  isOwner: boolean;
  actions: MilestoneActions;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="bg-black/[0.015] px-4 py-3 sm:px-5">
        <ItemForm
          projectId={projectId}
          itemId={item.id}
          members={members}
          defaultLabel={item.label}
          defaultAssignee={item.assigneeId ?? ""}
          action={actions.saveItem}
          submitLabel="Save item"
          onDone={() => setEditing(false)}
          extra={
            <form action={actions.setItemArchived}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="archived" value="1" />
              <button
                type="submit"
                className={cn(
                  BUTTON_GHOST,
                  "h-9 hover:bg-red-50 hover:text-red-700",
                )}
              >
                <Archive className="size-3.5" />
                Remove
              </button>
            </form>
          }
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/item flex items-center gap-3 px-4 py-3 sm:px-5",
        ROW_HOVER,
      )}
    >
      <form action={actions.toggleItem} className="flex">
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="projectId" value={projectId} />
        <button
          type="submit"
          aria-label={
            item.done
              ? `Mark ${item.label} not done`
              : `Mark ${item.label} done`
          }
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-lg border transition duration-150 active:scale-90",
            FOCUS_RING,
            item.done
              ? "border-[#16a34a] bg-[#16a34a] text-white hover:border-[#128a3d] hover:bg-[#128a3d]"
              : "border-black/15 bg-white text-transparent hover:border-[#16a34a] hover:bg-[#2fe85c]/10 hover:text-[#16a34a]/40",
          )}
        >
          <Check className="size-3.5" />
        </button>
      </form>

      <p
        className={cn(
          "min-w-0 flex-1 text-sm transition-colors duration-150",
          item.done ? "text-black/35 line-through" : "text-black/75",
        )}
      >
        {item.label}
      </p>

      {item.assignee ? (
        <span className="shrink-0 rounded-full bg-black/[0.035] px-2 py-0.5 text-[10px] text-black/45">
          {item.assignee}
        </span>
      ) : null}

      {isOwner ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${item.label}`}
          className={cn(ICON_BUTTON, "shrink-0", REVEAL_ON_HOVER)}
        >
          <Pencil className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function ItemForm({
  projectId,
  weekId,
  itemId,
  members,
  defaultLabel = "",
  defaultAssignee = "",
  action,
  submitLabel,
  onDone,
  extra,
}: {
  projectId: string;
  weekId?: string;
  itemId?: string;
  members: Person[];
  defaultLabel?: string;
  defaultAssignee?: string;
  action: FormAction;
  submitLabel: string;
  onDone: () => void;
  extra?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="projectId" value={projectId} />
        {weekId ? <input type="hidden" name="weekId" value={weekId} /> : null}
        {itemId ? <input type="hidden" name="itemId" value={itemId} /> : null}
        <input
          name="label"
          defaultValue={defaultLabel}
          required
          maxLength={240}
          autoFocus
          placeholder="What should be done by the end of this week?"
          aria-label="Milestone item"
          className={cn(
            INPUT_SMALL,
            "h-9 min-w-0 flex-1 basis-full sm:basis-auto",
          )}
        />
        <select
          name="assignedTo"
          defaultValue={defaultAssignee}
          aria-label="Assign to"
          className={cn(INPUT_SMALL, "h-9 cursor-pointer px-2")}
        >
          <option value="">Unassigned</option>
          {members.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className={cn(BUTTON_PRIMARY, "h-9 px-3 text-xs")}
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : null}
          {submitLabel}
        </button>
        {extra}
        <button
          type="button"
          onClick={onDone}
          className={cn(BUTTON_GHOST, "h-9")}
        >
          Cancel
        </button>
      </form>
      <FormMessage state={state} />
    </div>
  );
}

function WeekForm({
  projectId,
  week,
  action,
  submitLabel,
  onDone,
  defaultWeekNumber,
}: {
  projectId: string;
  week?: MilestoneWeek;
  action: FormAction;
  submitLabel: string;
  onDone: () => void;
  defaultWeekNumber?: number;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);

  return (
    <div className="mt-3">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="projectId" value={projectId} />
        {week ? <input type="hidden" name="weekId" value={week.id} /> : null}
        <label className="space-y-1">
          <span className="text-[10px] font-medium text-black/50">Week</span>
          <input
            name="weekNumber"
            type="number"
            min={1}
            max={999}
            required
            defaultValue={week?.number ?? defaultWeekNumber}
            className={cn(INPUT_SMALL, "h-9 w-20")}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-medium text-black/50">Starts</span>
          <input
            name="startsOn"
            type="date"
            defaultValue={week?.startsOn ?? ""}
            className={cn(INPUT_SMALL, "h-9")}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-medium text-black/50">Due</span>
          <input
            name="dueOn"
            type="date"
            required
            defaultValue={week?.dueOn ?? ""}
            className={cn(INPUT_SMALL, "h-9")}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className={cn(BUTTON_PRIMARY, "h-9 px-3 text-xs")}
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : null}
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onDone}
          className={cn(BUTTON_GHOST, "h-9")}
        >
          Cancel
        </button>
      </form>
      <FormMessage state={state} />
    </div>
  );
}

function AddWeekForm({
  projectId,
  nextWeekNumber,
  addWeek,
}: {
  projectId: string;
  nextWeekNumber: number;
  addWeek: FormAction;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={DASHED_ACTION}
      >
        <CalendarPlus className="size-4" />
        Plan week {nextWeekNumber}
      </button>
    );
  }

  return (
    <div className="card-surface rounded-2xl border border-black/[0.06] px-4 py-3.5 sm:px-5">
      <h3 className="text-sm font-semibold">Plan a week</h3>
      <WeekForm
        projectId={projectId}
        action={addWeek}
        submitLabel="Add week"
        defaultWeekNumber={nextWeekNumber}
        onDone={() => setOpen(false)}
      />
    </div>
  );
}

function ArchivedWeeks({
  projectId,
  weeks,
  setWeekArchived,
}: {
  projectId: string;
  weeks: MilestoneWeek[];
  setWeekArchived: PlainAction;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[20px] border border-black/[0.07] bg-white/40 px-4 py-3.5 transition-colors duration-200 hover:border-black/[0.12] sm:px-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "rounded px-1 text-[11px] font-semibold text-black/45 transition-colors duration-150 hover:text-black",
          FOCUS_RING,
        )}
      >
        {open ? "Hide" : "Show"} {weeks.length} archived week
        {weeks.length === 1 ? "" : "s"}
      </button>
      {open ? (
        <ul className="mt-3 space-y-2">
          {weeks.map((week) => (
            <li
              key={week.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/[0.06] bg-black/[0.015] px-3 py-2 transition duration-150 hover:border-black/[0.14] hover:bg-white"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-black/55">
                  Week {week.number}
                </p>
                <p className="text-[10px] text-black/35">
                  Due {formatDate(week.dueOn)} · {week.items.length} item
                  {week.items.length === 1 ? "" : "s"}
                </p>
              </div>
              <form action={setWeekArchived}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="weekId" value={week.id} />
                <input type="hidden" name="archived" value="0" />
                <button
                  type="submit"
                  className={cn(BUTTON_SECONDARY, "h-8 px-2.5 text-[11px]")}
                >
                  <RotateCcw className="size-3" />
                  Restore
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FormMessage({ state }: { state: SimpleFormState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      className={cn(
        "mt-2 flex items-center gap-1.5 text-[11px]",
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
  );
}
