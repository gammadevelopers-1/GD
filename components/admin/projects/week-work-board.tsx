"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import {
  IdeaEditor,
  type IdeaEditorHandle,
} from "@/components/admin/projects/idea-editor";
import { EMPTY_DOC, type IdeaDoc } from "@/lib/projects/idea-doc";
import type { SimpleFormState } from "@/lib/projects/form-state";
import type { MilestoneCard } from "@/data/project-detail";
import { formatDate } from "@/lib/projects/format";
import { cn } from "@/lib/utils";

export type Person = { id: string; name: string };

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
    assignedTo: string | null;
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
      assignedTo: string | null;
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
  people,
  canManage,
  canTick,
  hasNotes,
  updatedAt,
  updatedBy,
  open,
  onClose,
  onTaskDone,
  actions,
}: {
  projectId: string;
  weekId: string;
  weekNumber: number;
  tasks: MilestoneCard[];
  people: Person[];
  canManage: boolean;
  canTick: boolean;
  hasNotes: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
  open: boolean;
  onClose: () => void;
  onTaskDone: (cardId: string, done: boolean) => void;
  actions: WorkBoardActions;
}) {
  const [editing, setEditing] = useState<MilestoneCard | "new" | null>(null);
  const [proposals, setProposals] = useState<ProposedTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

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
        aria-hidden
        onClick={onClose}
        className={cn(
          "absolute inset-0 z-20 bg-black/15 transition-opacity duration-200 ease-in-out supports-backdrop-filter:backdrop-blur-[1px] motion-reduce:transition-none",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        inert={!open}
        aria-label={`Week ${weekNumber} work board`}
        className={cn(
          "absolute inset-y-0 right-0 left-0 z-30 flex flex-col overflow-hidden rounded-l-xl border-l border-black/[0.09] bg-white shadow-[-18px_0_44px_rgba(20,23,26,0.16)] transition-transform duration-200 ease-in-out will-change-transform motion-reduce:transition-none sm:left-10",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <header className="flex shrink-0 items-center gap-2 bg-[#15181b] px-3 py-2 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close work board"
            className="grid size-7 place-items-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
          <span className="font-mono text-[10px] tracking-[0.14em] text-[#2fe85c] uppercase">
            Work Board
          </span>
          <span className="ml-auto min-w-0 truncate text-right text-[10px] text-white/45">
            {updatedAt
              ? `${updatedBy ? `${updatedBy} · ` : ""}${formatDate(updatedAt.slice(0, 10))}`
              : `Week ${weekNumber}`}
          </span>
        </header>

        {canManage ? (
          <div className="flex shrink-0 items-center gap-2 border-b border-black/[0.07] bg-[#f8f8f3] px-3 py-2">
            <button
              type="button"
              onClick={suggest}
              disabled={busy || !hasNotes}
              title={
                hasNotes
                  ? "Read the idea board and suggest tasks"
                  : "Write something on the idea board first"
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#15181b] px-3 text-[11px] font-semibold text-[#2fe85c] transition hover:bg-black disabled:opacity-45"
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Organize with AI
            </button>
            {!hasNotes ? (
              <span className="text-[10px] text-black/35">
                Nothing on the idea board yet.
              </span>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="flex shrink-0 items-start gap-1.5 border-b border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700"
          >
            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="font-semibold underline underline-offset-2"
            >
              Dismiss
            </button>
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {tasks.length ? (
            <ul className="space-y-1">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  canTick={canTick}
                  canManage={canManage}
                  onOpen={() => setEditing(task)}
                  onDone={onTaskDone}
                  setDone={actions.setTaskDone}
                />
              ))}
            </ul>
          ) : (
            <p className="px-1 py-8 text-center text-[12px] text-black/35">
              No tasks yet.
            </p>
          )}
        </div>

        {canManage ? (
          <div className="shrink-0 border-t border-black/[0.07] bg-[#f8f8f3] px-3 py-2">
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-black/15 text-[11px] font-medium text-black/55 transition hover:border-black/30 hover:text-black"
            >
              <Plus className="size-3.5" />
              Add task
            </button>
          </div>
        ) : null}
      </aside>

      {editing ? (
        <TaskEditor
          projectId={projectId}
          weekId={weekId}
          task={editing === "new" ? null : editing}
          people={people}
          onClose={() => setEditing(null)}
          save={actions.saveTask}
        />
      ) : null}

      {proposals ? (
        <ProposalReview
          projectId={projectId}
          weekId={weekId}
          proposals={proposals}
          people={people}
          onClose={() => setProposals(null)}
          accept={actions.accept}
        />
      ) : null}
    </>
  );
}

function TaskRow({
  task,
  canTick,
  canManage,
  onOpen,
  onDone,
  setDone,
}: {
  task: MilestoneCard;
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
        "group flex items-center gap-2.5 rounded-lg border border-transparent px-2 py-2 transition",
        failed
          ? "border-red-200 bg-red-50"
          : "hover:border-black/[0.07] hover:bg-black/[0.02]",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={!canTick}
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Untick ${task.title}` : `Tick ${task.title}`}
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded border transition disabled:opacity-40",
          done
            ? "border-[#16a34a] bg-[#16a34a] text-white"
            : "border-black/20 hover:border-black/45",
        )}
      >
        {done ? <Check className="size-3" /> : null}
      </button>

      <button
        type="button"
        onClick={onOpen}
        disabled={!canManage}
        className={cn(
          "min-w-0 flex-1 truncate text-left text-[12.5px] transition",
          done ? "text-black/35 line-through" : "text-black/80",
          canManage && "hover:text-black",
        )}
      >
        {task.title}
      </button>

      {task.assignedName ? (
        <span
          title={task.assignedName}
          className="shrink-0 rounded-full bg-[#2fe85c]/12 px-2 py-0.5 text-[9px] font-semibold text-[#08743d]"
        >
          {task.assignedName.split(/\s+/)[0]}
        </span>
      ) : null}

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
  people,
  onClose,
  save,
}: {
  projectId: string;
  weekId: string;
  task: MilestoneCard | null;
  people: Person[];
  onClose: () => void;
  save: WorkBoardActions["saveTask"];
}) {
  const initial = seedDoc(task);
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startSaving] = useTransition();
  const doc = useRef<IdeaDoc>(initial);
  const editor = useRef<IdeaEditorHandle>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        assignedTo: assignedTo || null,
      });
      if (result.status === "error") setError(result.message);
      else onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-60 grid place-items-center bg-black/30 p-3">
      <div
        role="dialog"
        aria-label={task ? "Edit task" : "New task"}
        className="flex h-[min(80vh,640px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-black/[0.09] bg-white shadow-lg"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-black/[0.07] bg-[#f8f8f3] px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-7 place-items-center rounded-lg text-black/45 transition hover:bg-black/[0.06] hover:text-black"
          >
            <ArrowLeft className="size-4" />
          </button>
          <span className="font-mono text-[10px] tracking-[0.14em] text-black/35 uppercase">
            {task ? "Edit task" : "New task"}
          </span>

          <select
            value={assignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
            aria-label="Assign to"
            className="ml-auto h-7 rounded-lg border border-black/[0.12] bg-white px-2 text-[11px] text-black/70 outline-none focus:border-black/35"
          >
            <option value="">Unassigned</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <IdeaEditor
            ref={editor}
            initialDoc={initial}
            editable
            placeholder="First line is the task. Everything under it is the detail."
            onChange={(next) => {
              doc.current = next as IdeaDoc;
            }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-black/[0.07] px-3 py-2">
          {error ? (
            <span role="alert" className="text-[11px] text-red-600">
              {error}
            </span>
          ) : (
            <span className="text-[10px] text-black/35">
              The first line becomes the task title.
            </span>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#15181b] px-3 text-[11px] font-semibold text-white transition hover:bg-black disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposalReview({
  projectId,
  weekId,
  proposals,
  people,
  onClose,
  accept,
}: {
  projectId: string;
  weekId: string;
  proposals: ProposedTask[];
  people: Person[];
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
      assignedTo: "",
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
          assignedTo: row.assignedTo || null,
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
          <Sparkles className="size-3.5 text-[#08743d]" />
          <span className="text-[12px] font-semibold">Suggested tasks</span>
          <span className="font-mono text-[10px] text-black/35">
            {chosen.length} of {rows.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto grid size-7 place-items-center rounded-lg text-black/45 transition hover:bg-black/[0.06] hover:text-black"
          >
            <X className="size-4" />
          </button>
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
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={row.keep}
                  aria-label={`Keep ${row.title}`}
                  onClick={() => update(index, { keep: !row.keep })}
                  className={cn(
                    "mt-1 grid size-4 shrink-0 place-items-center rounded border transition",
                    row.keep
                      ? "border-[#16a34a] bg-[#16a34a] text-white"
                      : "border-black/20 hover:border-black/45",
                  )}
                >
                  {row.keep ? <Check className="size-3" /> : null}
                </button>

                <div className="min-w-0 flex-1">
                  <input
                    value={row.title}
                    onChange={(event) =>
                      update(index, { title: event.target.value.slice(0, 240) })
                    }
                    aria-label="Task title"
                    className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[12px] text-black/80 outline-none hover:border-black/[0.09] focus:border-black/30 focus:bg-white"
                  />
                  {row.existingTitle ? (
                    <p className="px-1 text-[11px] leading-4 text-black/40">
                      was{" "}
                      <span className="line-through">{row.existingTitle}</span>
                    </p>
                  ) : null}
                  {row.detail ? (
                    <p className="px-1 text-[11px] leading-4 text-black/45">
                      {row.detail}
                    </p>
                  ) : null}
                  {row.references.length ? (
                    <p className="px-1 text-[10px] leading-4 text-black/35">
                      refs: {row.references.join(", ")}
                    </p>
                  ) : null}
                </div>

                <span
                  className={cn(
                    "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                    row.existingId
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-[#2fe85c]/40 bg-[#2fe85c]/10 text-[#08743d]",
                  )}
                >
                  {row.existingId ? "Tidy" : "New"}
                </span>

                <select
                  value={row.assignedTo}
                  onChange={(event) =>
                    update(index, { assignedTo: event.target.value })
                  }
                  aria-label={`Assign ${row.title}`}
                  className="h-7 shrink-0 rounded-lg border border-black/[0.12] bg-white px-1.5 text-[11px] text-black/65 outline-none focus:border-black/35"
                >
                  <option value="">Unassigned</option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
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
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-8 items-center rounded-lg px-2.5 text-[11px] font-medium text-black/50 transition hover:text-black"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !chosen.length}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#15181b] px-3 text-[11px] font-semibold text-white transition hover:bg-black disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : null}
            Apply {chosen.length || ""}
          </button>
        </div>
      </div>
    </div>
  );
}
