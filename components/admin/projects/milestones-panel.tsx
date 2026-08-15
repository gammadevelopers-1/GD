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

  return (
    <div className="space-y-3">
      {weeks.length ? (
        weeks.map((week) => (
          <WeekCard
            key={week.id}
            projectId={projectId}
            week={week}
            members={members}
            isOwner={isOwner}
            actions={actions}
          />
        ))
      ) : (
        <div className="rounded-[20px] border border-dashed border-black/10 bg-white/35 px-6 py-10 text-center">
          <h2 className="text-sm font-semibold">No weeks planned yet</h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-black/45">
            Work is laid out as a sequence of weeks, each holding a handful of
            things that should be done by the end of it. Every item is simply
            done or not done.
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

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[20px] border bg-[#f8f8f3]",
        week.isCurrent ? "border-[#2fe85c]/45" : "border-black/[0.07]",
      )}
    >
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
            <span className="font-mono text-[9px] text-black/35">
              {week.done}/{week.total} done
            </span>
            {isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditingWeek((open) => !open)}
                  aria-label={`Edit week ${week.number}`}
                  className="rounded-lg p-1.5 text-black/35 transition hover:bg-black/[0.04] hover:text-black"
                >
                  <Pencil className="size-3.5" />
                </button>
                <form action={actions.setWeekArchived}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="weekId" value={week.id} />
                  <input type="hidden" name="archived" value="1" />
                  <button
                    type="submit"
                    aria-label={`Archive week ${week.number}`}
                    className="rounded-lg p-1.5 text-black/35 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <Archive className="size-3.5" />
                  </button>
                </form>
              </>
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
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#08743d] transition hover:underline"
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
                className="text-[10px] font-medium text-black/40 transition hover:text-black"
              >
                {showArchived ? "Hide" : "Show"} {week.archivedItems.length}{" "}
                removed item{week.archivedItems.length === 1 ? "" : "s"}
              </button>
              {showArchived ? (
                <ul className="mt-2 space-y-1.5">
                  {week.archivedItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/[0.03] px-2.5 py-1.5"
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
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#08743d] hover:underline"
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
      <div className="px-4 py-3 sm:px-5">
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
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-black/45 transition hover:bg-red-50 hover:text-red-700"
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
    <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <form action={actions.toggleItem} className="flex">
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="projectId" value={projectId} />
        <button
          type="submit"
          aria-label={
            item.done ? `Mark ${item.label} not done` : `Mark ${item.label} done`
          }
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-lg border transition",
            item.done
              ? "border-[#16a34a] bg-[#16a34a] text-white"
              : "border-black/15 bg-white text-transparent hover:border-[#16a34a]",
          )}
        >
          <Check className="size-3.5" />
        </button>
      </form>

      <p
        className={cn(
          "min-w-0 flex-1 text-sm",
          item.done && "text-black/35 line-through",
        )}
      >
        {item.label}
      </p>

      {item.assignee ? (
        <span className="shrink-0 text-[10px] text-black/35">
          {item.assignee}
        </span>
      ) : null}

      {isOwner ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${item.label}`}
          className="shrink-0 rounded-lg p-1.5 text-black/30 transition hover:bg-black/[0.04] hover:text-black"
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
          className="h-9 min-w-0 flex-1 basis-full rounded-lg border border-black/[0.09] bg-white px-2.5 text-xs outline-none focus:border-[#16a34a] sm:basis-auto"
        />
        <select
          name="assignedTo"
          defaultValue={defaultAssignee}
          aria-label="Assign to"
          className="h-9 rounded-lg border border-black/[0.09] bg-white px-2 text-xs outline-none focus:border-[#16a34a]"
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
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#15181b] px-3 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : null}
          {submitLabel}
        </button>
        {extra}
        <button
          type="button"
          onClick={onDone}
          className="inline-flex h-9 items-center rounded-lg px-2 text-xs text-black/45 hover:text-black"
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
            className="h-9 w-20 rounded-lg border border-black/[0.09] bg-white px-2.5 text-xs outline-none focus:border-[#16a34a]"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-medium text-black/50">Starts</span>
          <input
            name="startsOn"
            type="date"
            defaultValue={week?.startsOn ?? ""}
            className="h-9 rounded-lg border border-black/[0.09] bg-white px-2.5 text-xs outline-none focus:border-[#16a34a]"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-medium text-black/50">Due</span>
          <input
            name="dueOn"
            type="date"
            required
            defaultValue={week?.dueOn ?? ""}
            className="h-9 rounded-lg border border-black/[0.09] bg-white px-2.5 text-xs outline-none focus:border-[#16a34a]"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#15181b] px-3 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : null}
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex h-9 items-center rounded-lg px-2 text-xs text-black/45 hover:text-black"
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
        className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-dashed border-black/12 bg-white/40 px-4 py-4 text-xs font-semibold text-black/50 transition hover:border-[#2fe85c]/50 hover:text-[#08743d]"
      >
        <CalendarPlus className="size-4" />
        Plan week {nextWeekNumber}
      </button>
    );
  }

  return (
    <div className="rounded-[20px] border border-black/[0.07] bg-[#f8f8f3] px-4 py-3.5 sm:px-5">
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
    <div className="rounded-[20px] border border-black/[0.07] bg-white/40 px-4 py-3.5 sm:px-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="text-[11px] font-semibold text-black/45 transition hover:text-black"
      >
        {open ? "Hide" : "Show"} {weeks.length} archived week
        {weeks.length === 1 ? "" : "s"}
      </button>
      {open ? (
        <ul className="mt-3 space-y-2">
          {weeks.map((week) => (
            <li
              key={week.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/[0.06] bg-white/60 px-3 py-2"
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.1] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-black/60 transition hover:border-black/25 hover:text-black"
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
