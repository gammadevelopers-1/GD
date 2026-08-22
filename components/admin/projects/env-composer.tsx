"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  FileUp,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { type SimpleFormState, IDLE_FORM } from "@/lib/projects/form-state";
import {
  ENV_NOTE_MAX,
  describeDrafts,
  isEnvKey,
  parseEnvBlob,
} from "@/lib/projects/env";
import {
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  FOCUS_RING,
  ICON_BUTTON,
  INPUT,
  INPUT_SMALL,
} from "@/lib/admin-ui";
import { Modal } from "@/components/admin/projects/modal";
import { useCloseOnSuccess } from "@/components/admin/projects/use-close-on-success";
import { FormSelect } from "@/components/common/form-select";
import { cn } from "@/lib/utils";

export type GroupOption = { id: string; name: string; keys: string[] };

type FormAction = (
  state: SimpleFormState,
  formData: FormData,
) => Promise<SimpleFormState>;

type Draft = {
  key: string;
  value: string;
  note: string;
  include: boolean;
  replace: boolean;
};

const EMPTY: Draft = {
  key: "",
  value: "",
  note: "",
  include: true,
  replace: false,
};

function serialise(drafts: Draft[], conflicts: Set<string>) {
  return JSON.stringify(
    drafts
      .filter((draft) => draft.include && (draft.key.trim() || draft.value))
      .filter((draft) => !conflicts.has(draft.key.trim()) || draft.replace)
      .map((draft) => ({
        key: draft.key.trim(),
        value: draft.value,
        note: draft.note.trim(),
        replace: draft.replace,
      })),
  );
}

export function ImportDialog({
  projectId,
  groups,
  defaultGroupId,
  action,
  onClose,
}: {
  projectId: string;
  groups: GroupOption[];
  defaultGroupId: string;
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [groupId, setGroupId] = useState(defaultGroupId);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [pasted, setPasted] = useState("");
  const [reveal, setReveal] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useCloseOnSuccess(state, onClose);

  const conflicts = useMemo(() => {
    const keys = new Set(
      groups.find((group) => group.id === groupId)?.keys ?? [],
    );
    return new Set(
      drafts.map((draft) => draft.key.trim()).filter((key) => keys.has(key)),
    );
  }, [drafts, groups, groupId]);

  const chosen = drafts.filter(
    (draft) =>
      draft.include && (!conflicts.has(draft.key.trim()) || draft.replace),
  );

  function absorb(text: string, source: string) {
    const { pairs, skipped } = parseEnvBlob(text);
    if (!pairs.length) {
      setNote(`Nothing readable in ${source}.`);
      return;
    }
    setDrafts(
      pairs.map((pair) => ({
        key: pair.key,
        value: pair.value,
        note: "",
        include: true,
        replace: false,
      })),
    );
    setNote(
      skipped.length
        ? `${skipped.length} line${skipped.length === 1 ? "" : "s"} in ${source} could not be read.`
        : null,
    );
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setNote("That file is too large to be a .env file.");
      return;
    }
    absorb(await file.text(), file.name);
  }

  function update(index: number, patch: Partial<Draft>) {
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)),
    );
  }

  const summary = describeDrafts(
    drafts.map((draft) => ({
      key: draft.key,
      value: draft.value,
      note: draft.note,
      include: draft.include,
      conflict: conflicts.has(draft.key.trim()),
    })),
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Upload a .env file"
      description="Nothing is stored until you save."
    >
      {!drafts.length ? (
        <div className="space-y-4">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void readFile(event.dataTransfer.files?.[0]);
            }}
            className={cn(
              "rounded-2xl border border-dashed px-5 py-10 text-center transition-colors",
              dragging
                ? "border-[#2fe85c]/60 bg-[#2fe85c]/[0.07]"
                : "border-black/12 bg-white/40",
            )}
          >
            <FileUp className="mx-auto size-5 text-black/55" />
            <p className="mt-3 text-[13px] text-black/55">
              Drop a .env file here
            </p>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className={cn(BUTTON_SECONDARY, "mt-3 h-9 text-xs")}
            >
              Browse
            </button>
            <input
              ref={fileInput}
              type="file"
              className="sr-only"
              onChange={(event) => {
                void readFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>

          <div>
            <label htmlFor="env-paste" className="text-[13px] text-black/55">
              Or paste the contents
            </label>
            <textarea
              id="env-paste"
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
              rows={6}
              spellCheck={false}
              placeholder={"DATABASE_URL=postgres://…\nSTRIPE_KEY=sk_live_…"}
              className={cn(INPUT, "mt-1.5 resize-y py-2.5 font-mono text-xs")}
            />
            <button
              type="button"
              disabled={!pasted.trim()}
              onClick={() => absorb(pasted, "the pasted text")}
              className={cn(BUTTON_SECONDARY, "mt-2 h-9 text-xs")}
            >
              Read it
            </button>
          </div>

          {note ? <p className="text-[12px] text-black/60">{note}</p> : null}
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="groupId" value={groupId} />
          <input
            type="hidden"
            name="rows"
            value={serialise(drafts, conflicts)}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-black/60">{summary}</p>
            <label className="flex items-center gap-2 text-[12px] text-black/60">
              Group
              <FormSelect
                value={groupId}
                onValueChange={setGroupId}
                triggerClassName={cn(INPUT_SMALL, "h-9")}
                options={groups.map((group) => ({
                  value: group.id,
                  label: group.name,
                }))}
              />
            </label>
          </div>

          <ul className="divide-y divide-black/[0.06] rounded-xl border border-black/[0.07] bg-white">
            {drafts.map((draft, index) => {
              const key = draft.key.trim();
              const clash = conflicts.has(key);
              const badKey = key !== "" && !isEnvKey(key);
              return (
                <li key={index} className="space-y-2 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={draft.include}
                      onChange={(event) =>
                        update(index, { include: event.target.checked })
                      }
                      aria-label={`Include ${key || `row ${index + 1}`}`}
                      className={cn(
                        "size-3.5 shrink-0 accent-[#16a34a]",
                        FOCUS_RING,
                      )}
                    />
                    <code
                      className={cn(
                        "min-w-0 flex-1 truncate font-mono text-[12px]",
                        draft.include ? "text-black/75" : "text-black/55",
                        badKey && "text-red-700",
                      )}
                    >
                      {key || "(no key)"}
                    </code>
                    <div className="relative w-40 shrink-0 sm:w-56">
                      <input
                        value={draft.value}
                        onChange={(event) =>
                          update(index, { value: event.target.value })
                        }
                        type={reveal === index ? "text" : "password"}
                        autoComplete="off"
                        spellCheck={false}
                        aria-label={`Value for ${key || `row ${index + 1}`}`}
                        className={cn(INPUT_SMALL, "h-8 w-full pr-8 font-mono")}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setReveal(reveal === index ? null : index)
                        }
                        aria-label={
                          reveal === index ? "Hide value" : "Show value"
                        }
                        className={cn(
                          "absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-black/55 transition hover:text-black/70",
                          FOCUS_RING,
                        )}
                      >
                        {reveal === index ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDrafts((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      aria-label={`Remove ${key || `row ${index + 1}`}`}
                      className={cn(ICON_BUTTON, "shrink-0")}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  {clash && draft.include ? (
                    <div className="flex flex-wrap items-center gap-2 pl-6 text-[11px]">
                      <span className="text-amber-800">
                        Already in this group.
                      </span>
                      <span className="flex overflow-hidden rounded-lg border border-black/[0.09]">
                        <button
                          type="button"
                          onClick={() => update(index, { replace: false })}
                          className={cn(
                            "px-2 py-0.5 font-medium transition",
                            draft.replace
                              ? "text-black/60 hover:bg-black/[0.04]"
                              : "bg-black/[0.06] text-black",
                          )}
                        >
                          Skip
                        </button>
                        <button
                          type="button"
                          onClick={() => update(index, { replace: true })}
                          className={cn(
                            "px-2 py-0.5 font-medium transition",
                            draft.replace
                              ? "bg-black/[0.06] text-black"
                              : "text-black/60 hover:bg-black/[0.04]",
                          )}
                        >
                          Replace
                        </button>
                      </span>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {note ? <p className="text-[12px] text-black/60">{note}</p> : null}
          <Feedback state={state} />

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-black/[0.07] pt-3">
            <button
              type="button"
              onClick={() => {
                setDrafts([]);
                setNote(null);
              }}
              className={cn(BUTTON_GHOST, "mr-auto h-9")}
            >
              Start over
            </button>
            <button
              type="button"
              onClick={onClose}
              className={cn(BUTTON_SECONDARY, "h-9 text-xs")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || !chosen.length}
              className={cn(BUTTON_PRIMARY, "h-9 text-xs")}
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save {chosen.length || ""}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function ManualDialog({
  projectId,
  groups,
  defaultGroupId,
  action,
  onClose,
}: {
  projectId: string;
  groups: GroupOption[];
  defaultGroupId: string;
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [groupId, setGroupId] = useState(defaultGroupId);
  const [drafts, setDrafts] = useState<Draft[]>([{ ...EMPTY }]);
  const [reveal, setReveal] = useState<number | null>(0);

  useCloseOnSuccess(state, onClose);

  const conflicts = useMemo(() => {
    const keys = new Set(
      groups.find((group) => group.id === groupId)?.keys ?? [],
    );
    return new Set(
      drafts.map((draft) => draft.key.trim()).filter((key) => keys.has(key)),
    );
  }, [drafts, groups, groupId]);

  const filled = drafts.filter((draft) => draft.key.trim() && draft.value);

  function update(index: number, patch: Partial<Draft>) {
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)),
    );
  }

  return (
    <Modal open onClose={onClose} size="lg" title="Add a variable">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="groupId" value={groupId} />
        <input type="hidden" name="rows" value={serialise(drafts, conflicts)} />

        <label className="flex items-center gap-2 text-[12px] text-black/60">
          Group
          <FormSelect
            value={groupId}
            onValueChange={setGroupId}
            triggerClassName={cn(INPUT_SMALL, "h-9")}
            options={groups.map((group) => ({
              value: group.id,
              label: group.name,
            }))}
          />
        </label>

        <div className="space-y-4">
          {drafts.map((draft, index) => {
            const key = draft.key.trim();
            const badKey = key !== "" && !isEnvKey(key);
            const clash = conflicts.has(key);
            return (
              <div
                key={index}
                className="space-y-2 rounded-xl border border-black/[0.07] bg-white p-3"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-[11px] text-black/60">Key</span>
                    <input
                      value={draft.key}
                      onChange={(event) =>
                        update(index, { key: event.target.value })
                      }
                      autoFocus={index === 0}
                      placeholder="STRIPE_SECRET_KEY"
                      spellCheck={false}
                      aria-invalid={badKey || undefined}
                      className={cn(
                        INPUT,
                        "h-9 font-mono text-xs",
                        badKey && "border-red-300",
                      )}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] text-black/60">Value</span>
                    <span className="relative block">
                      <input
                        value={draft.value}
                        onChange={(event) =>
                          update(index, { value: event.target.value })
                        }
                        type={reveal === index ? "text" : "password"}
                        autoComplete="off"
                        spellCheck={false}
                        className={cn(INPUT, "h-9 pr-9 font-mono text-xs")}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setReveal(reveal === index ? null : index)
                        }
                        aria-label={
                          reveal === index ? "Hide value" : "Show value"
                        }
                        className={cn(
                          "absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-black/55 transition hover:text-black/70",
                          FOCUS_RING,
                        )}
                      >
                        {reveal === index ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </span>
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-[11px] text-black/60">
                    Note <span className="text-black/55">(optional)</span>
                  </span>
                  <input
                    value={draft.note}
                    onChange={(event) =>
                      update(index, { note: event.target.value })
                    }
                    maxLength={ENV_NOTE_MAX}
                    placeholder="Where to rotate this, or who to contact"
                    className={cn(INPUT, "h-9 text-xs")}
                  />
                </label>

                <div className="flex items-center justify-between gap-2">
                  {badKey ? (
                    <p className="text-[11px] text-red-700">
                      Letters, numbers and underscores only.
                    </p>
                  ) : clash ? (
                    <label className="flex items-center gap-1.5 text-[11px] text-amber-800">
                      <input
                        type="checkbox"
                        checked={draft.replace}
                        onChange={(event) =>
                          update(index, { replace: event.target.checked })
                        }
                        className={cn("size-3.5 accent-[#16a34a]", FOCUS_RING)}
                      />
                      {key} already exists here — replace it
                    </label>
                  ) : (
                    <span />
                  )}
                  {drafts.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setDrafts((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      className={cn(BUTTON_GHOST, "h-7")}
                    >
                      <Trash2 className="size-3" />
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setDrafts((current) => [...current, { ...EMPTY }])}
          className={cn(BUTTON_GHOST, "h-9")}
        >
          <Plus className="size-3.5" />
          Add another
        </button>

        <Feedback state={state} />

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-black/[0.07] pt-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(BUTTON_SECONDARY, "h-9 text-xs")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || !filled.length}
            className={cn(BUTTON_PRIMARY, "h-9 text-xs")}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Feedback({ state }: { state: SimpleFormState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "flex items-center gap-1.5 text-[12px] font-medium",
        state.status === "success" ? "text-[#08743d]" : "text-red-700",
      )}
    >
      {state.status === "success" ? (
        <CheckCircle2 className="size-3.5" />
      ) : (
        <AlertCircle className="size-3.5" />
      )}
      {state.message}
    </p>
  );
}
