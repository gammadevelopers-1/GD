"use client";

import { useActionState, useRef, useState } from "react";
import {
  Check,
  FileUp,
  Loader2,
  Move,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import type {
  EnvCandidate,
  EnvGroupRow,
  EnvHolder,
  MainEntryRow,
} from "@/data/env-workspace";
import { IDLE_FORM, type SimpleFormState } from "@/lib/projects/form-state";
import {
  ENV_GROUP_NAME_MAX,
  type EnvPair,
  isEnvKey,
  parseEnvBlob,
} from "@/lib/projects/env";
import { TONE_SOFT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PasswordInput } from "@/components/ui/password-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormSelect } from "@/components/common/form-select";
import { Modal } from "./modal";
import { useCloseOnSuccess } from "./use-close-on-success";

export type FormAction = (
  state: SimpleFormState,
  formData: FormData,
) => Promise<SimpleFormState>;

function Problem({ state }: { state: SimpleFormState }) {
  if (state.status !== "error" || !state.message) return null;
  return (
    <p role="alert" className="mt-3 text-xs text-red-700">
      {state.message}
    </p>
  );
}

function Footer({
  pending,
  disabled,
  submit,
  onClose,
  tone = "cta",
  icon,
}: {
  pending: boolean;
  disabled?: boolean;
  submit: string;
  onClose: () => void;
  tone?: "cta" | "danger";
  icon?: React.ReactNode;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant="admin-ghost"
        size="admin"
        onClick={onClose}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant={tone === "danger" ? "admin-danger" : "admin-cta"}
        size="admin"
        disabled={pending || disabled}
        {...(tone === "cta" ? { "data-button-fill": true } : {})}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : icon}
        <span className="button-fill-fx__label">{submit}</span>
      </Button>
    </div>
  );
}

export function VariableDialog({
  scope,
  projectId,
  groupId,
  groups,
  action,
  onClose,
}: {
  scope: "main" | "version";
  projectId: string;
  groupId: string | null;
  groups: EnvGroupRow[];
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [target, setTarget] = useState(groupId ?? groups[0]?.id ?? "");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  useCloseOnSuccess(state, onClose);

  if (!groups.length) {
    return (
      <Modal open title="Add variable" onClose={onClose}>
        <div>
          <p className="text-xs leading-relaxed text-black/60">
            There is no group to put it in yet. Create a group first, then add
            variables to it.
          </p>
          <div className="mt-5 flex justify-end">
            <Button variant="admin-secondary" size="admin" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open title="Add variable" onClose={onClose}>
      <form action={formAction}>
        <input type="hidden" name="groupId" value={target} />
        {scope === "main" ? (
          <>
            <input type="hidden" name="projectId" value={projectId} />
            <input
              type="hidden"
              name="rows"
              value={JSON.stringify([{ key: key.trim(), value }])}
            />
          </>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-black/70">Key</span>
          <Input
            name="key"
            variant="admin"
            autoFocus
            required
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="STRIPE_SECRET_KEY"
            className="h-9 font-mono text-xs"
          />
        </label>

        <label className="mt-3.5 block space-y-1.5">
          <span className="text-xs font-medium text-black/70">Value</span>
          <PasswordInput
            name="value"
            variant="admin"
            revealNoun="value"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="sk_live_…"
            className="h-9 font-mono text-xs"
          />
        </label>

        {groups.length > 1 ? (
          <div className="mt-3.5 space-y-1.5">
            <span className="text-xs font-medium text-black/70">Group</span>
            <FormSelect
              value={target}
              onValueChange={setTarget}
              ariaLabel="Group"
              triggerClassName="h-9 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-sm"
              options={groups.map((group) => ({
                value: group.id,
                label: group.name,
              }))}
            />
          </div>
        ) : null}

        <Problem state={state} />
        <Footer
          pending={pending}
          submit="Add variable"
          onClose={onClose}
          icon={<Check className="size-4" />}
        />
      </form>
    </Modal>
  );
}

export function EditVariableDialog({
  projectId,
  credentialId,
  variableKey,
  note,
  action,
  onClose,
}: {
  projectId: string;
  credentialId: string;
  variableKey: string;
  note: string | null;
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  useCloseOnSuccess(state, onClose);

  return (
    <Modal open title="Edit variable" onClose={onClose}>
      <form action={formAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="credentialId" value={credentialId} />

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-black/70">Key</span>
          <Input
            name="key"
            variant="admin"
            autoFocus
            required
            defaultValue={variableKey}
            className="h-9 font-mono text-xs"
          />
        </label>

        <label className="mt-3.5 block space-y-1.5">
          <span className="text-xs font-medium text-black/70">
            New value{" "}
            <span className="font-mono text-[10px] text-black/40">
              leave empty to keep
            </span>
          </span>
          <PasswordInput
            name="value"
            variant="admin"
            revealNoun="value"
            autoComplete="off"
            spellCheck={false}
            className="h-9 font-mono text-xs"
          />
        </label>

        <label className="mt-3.5 block space-y-1.5">
          <span className="text-xs font-medium text-black/70">Note</span>
          <Input
            name="note"
            variant="admin"
            defaultValue={note ?? ""}
            className="h-9 text-sm"
          />
        </label>

        <Problem state={state} />
        <Footer
          pending={pending}
          submit="Save"
          onClose={onClose}
          icon={<Check className="size-4" />}
        />
      </form>
    </Modal>
  );
}

export function GroupDialog({
  projectId,
  group,
  action,
  onClose,
}: {
  projectId: string;
  group?: EnvGroupRow;
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  useCloseOnSuccess(state, onClose);

  return (
    <Modal open title={group ? "Rename group" : "New group"} onClose={onClose}>
      <form action={formAction}>
        <input type="hidden" name="projectId" value={projectId} />
        {group ? <input type="hidden" name="groupId" value={group.id} /> : null}

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-black/70">Group name</span>
          <Input
            name="name"
            variant="admin"
            autoFocus
            required
            maxLength={ENV_GROUP_NAME_MAX}
            defaultValue={group?.name ?? ""}
            placeholder="Payments"
            className="h-9 text-sm"
          />
        </label>

        <Problem state={state} />
        <Footer
          pending={pending}
          submit={group ? "Rename" : "Create group"}
          onClose={onClose}
          icon={<Check className="size-4" />}
        />
      </form>
    </Modal>
  );
}

export function MoveDialog({
  credentialId,
  variableKey,
  groups,
  action,
  onClose,
}: {
  credentialId: string;
  variableKey: string;
  groups: EnvGroupRow[];
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [target, setTarget] = useState(groups[0]?.id ?? "");
  useCloseOnSuccess(state, onClose);

  return (
    <Modal open title={`Move ${variableKey}`} onClose={onClose}>
      <form action={formAction}>
        <input type="hidden" name="credentialId" value={credentialId} />
        <input type="hidden" name="groupId" value={target} />

        {groups.length ? (
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-black/70">
              Destination group
            </span>
            <FormSelect
              value={target}
              onValueChange={setTarget}
              ariaLabel="Destination group"
              triggerClassName="h-9 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-sm"
              options={groups.map((group) => ({
                value: group.id,
                label: group.name,
              }))}
            />
          </div>
        ) : (
          <p className="font-mono text-[10.5px] text-black/45">
            No other group to move to. Create one first.
          </p>
        )}

        <Problem state={state} />
        <Footer
          pending={pending}
          disabled={!groups.length}
          submit="Move"
          onClose={onClose}
          icon={<Move className="size-4" />}
        />
      </form>
    </Modal>
  );
}

type Draft = {
  id: number;
  key: string;
  value: string;
  include: boolean;
  replace: boolean;
};

function blobLine({ key, value }: EnvPair) {
  const risky = /\n/.test(value) || /\s#/.test(value) || value !== value.trim();
  if (!risky) return `${key}=${value}`;
  const escaped = value.replace(/"/g, '\\"').replace(/\n/g, "\\n");
  return `${key}="${escaped}"`;
}

export function UploadDialog({
  scope,
  projectId,
  groupId,
  existingKeys,
  action,
  onClose,
}: {
  scope: "main" | "version";
  projectId: string;
  groupId: string;
  existingKeys: string[];
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [pasted, setPasted] = useState("");
  const [reveal, setReveal] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  useCloseOnSuccess(state, onClose);

  const known = new Set(existingKeys);
  const readable = pasted.trim() ? parseEnvBlob(pasted).pairs.length : 0;
  const conflicts = new Set(
    drafts
      .map((draft) => draft.key.trim())
      .filter((key) => key && known.has(key)),
  );

  const touched = drafts.filter((draft) => draft.key.trim() || draft.value);
  const broken = touched.filter(
    (draft) => draft.include && (!isEnvKey(draft.key.trim()) || !draft.value),
  );
  const chosen = touched.filter(
    (draft) =>
      draft.include &&
      draft.value &&
      isEnvKey(draft.key.trim()) &&
      (!conflicts.has(draft.key.trim()) || draft.replace),
  );
  const held = touched.filter(
    (draft) =>
      draft.include && conflicts.has(draft.key.trim()) && !draft.replace,
  ).length;

  const summary = broken.length
    ? `${broken.length} ${broken.length === 1 ? "row needs" : "rows need"} a key and a value`
    : [
        `${chosen.length} ready to save`,
        held ? `${held} kept as they are` : null,
      ]
        .filter(Boolean)
        .join(" · ");

  function absorb(text: string, source: string) {
    const { pairs, skipped } = parseEnvBlob(text);
    if (!pairs.length) {
      setNote(`Nothing readable in ${source}.`);
      return;
    }

    const already = new Set(
      drafts.map((draft) => draft.key.trim()).filter(Boolean),
    );
    const fresh = pairs.filter((pair) => !already.has(pair.key));
    const seed = nextId.current;
    nextId.current += fresh.length;

    setDrafts((current) => [
      ...current.filter((draft) => draft.key.trim() || draft.value),
      ...fresh.map((pair, index) => ({
        id: seed + index,
        key: pair.key,
        value: pair.value,
        include: true,
        replace: false,
      })),
    ]);
    setReveal(null);

    const notes = [
      skipped.length
        ? `${skipped.length} line${skipped.length === 1 ? "" : "s"} in ${source} could not be read.`
        : null,
      pairs.length - fresh.length
        ? `${pairs.length - fresh.length} already on this list.`
        : null,
    ].filter(Boolean);
    setNote(notes.length ? notes.join(" ") : null);
  }

  function addRow() {
    const id = nextId.current++;
    setDrafts((current) => [
      ...current,
      { id, key: "", value: "", include: true, replace: false },
    ]);
    setReveal(id);
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setNote("That file is too large to be a .env file.");
      return;
    }
    absorb(await file.text(), file.name);
  }

  function update(id: number, patch: Partial<Draft>) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, ...patch } : draft,
      ),
    );
  }

  return (
    <Modal
      open
      size="xl"
      title="Import environment variables"
      onClose={onClose}
    >
      <input
        ref={fileInput}
        type="file"
        className="sr-only"
        onChange={(event) => {
          void readFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {!drafts.length ? (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex min-h-80 min-w-0 flex-col rounded-2xl border border-black/[0.08] bg-white p-3.5 transition-colors duration-150 focus-within:border-black/25">
              <span className="font-mono text-[9px] tracking-[0.12em] text-black/40 uppercase">
                Paste
              </span>
              <Textarea
                id="env-paste"
                variant="bare"
                value={pasted}
                onChange={(event) => setPasted(event.target.value)}
                spellCheck={false}
                aria-label="Paste .env contents"
                placeholder={"DATABASE_URL=postgres://…\nSTRIPE_KEY=sk_live_…"}
                className="mt-2 min-h-0 w-full flex-1 resize-none bg-transparent font-mono text-xs leading-relaxed placeholder:text-black/25"
              />
              <Button
                type="button"
                variant="admin-secondary"
                size="admin"
                className="mt-3 self-start text-xs"
                disabled={!pasted.trim()}
                onClick={() => absorb(pasted, "the pasted text")}
              >
                {readable === 1
                  ? "Read 1 variable"
                  : readable
                    ? `Read ${readable} variables`
                    : "Read variables"}
              </Button>
            </div>

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
                "flex min-h-80 min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed p-3.5 text-center transition-colors duration-150",
                dragging
                  ? "border-gd-green/60 bg-gd-green/[0.07]"
                  : "border-black/15 bg-white/50",
              )}
            >
              <FileUp className="size-6 text-black/25" />
              <p className="mt-3 text-[13px] font-medium text-black/70">
                Drop a .env file here
              </p>
              <Button
                type="button"
                variant="admin-secondary"
                size="admin"
                className="mt-3 text-xs"
                onClick={() => fileInput.current?.click()}
              >
                Browse
              </Button>
              <p className="mt-2.5 font-mono text-[9.5px] tracking-[0.1em] text-black/35 uppercase">
                Any file, up to 1 MB
              </p>
            </div>
          </div>

          <p className="min-h-4 text-xs text-black/50">{note}</p>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="groupId" value={groupId} />
          {scope === "main" ? (
            <>
              <input type="hidden" name="projectId" value={projectId} />
              <input
                type="hidden"
                name="rows"
                value={JSON.stringify(
                  chosen.map((draft) => ({
                    key: draft.key,
                    value: draft.value,
                    note: "",
                    replace: draft.replace,
                  })),
                )}
              />
            </>
          ) : (
            <input
              type="hidden"
              name="blob"
              value={chosen.map(blobLine).join("\n")}
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] text-black/60">{summary}</p>
            <Button
              type="button"
              variant="admin-ghost"
              size="admin-sm"
              onClick={() => {
                setDrafts([]);
                setNote(null);
                setPasted("");
              }}
            >
              Start over
            </Button>
          </div>

          <ScrollArea
            className="rounded-xl border border-black/[0.07] bg-white"
            viewportClassName="max-h-96"
          >
            <ul className="divide-y divide-black/[0.06]">
              {drafts.map((draft) => {
                const key = draft.key.trim();
                const clash = conflicts.has(key);
                const badKey = Boolean(key) && !isEnvKey(key);
                const noValue = Boolean(key) && !draft.value;
                return (
                  <li key={draft.id} className="space-y-2 px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                      <Checkbox
                        checked={draft.include}
                        onCheckedChange={(next) =>
                          update(draft.id, { include: next === true })
                        }
                        aria-label={`Include ${key || "this row"}`}
                        className="data-checked:border-gd-green-edge data-checked:bg-gd-green-edge shrink-0 border-black/20 data-checked:text-white"
                      />
                      <Input
                        variant="admin-sm"
                        value={draft.key}
                        onChange={(event) =>
                          update(draft.id, { key: event.target.value })
                        }
                        spellCheck={false}
                        autoComplete="off"
                        aria-label="Key"
                        aria-invalid={badKey || undefined}
                        placeholder="CLIENT_KEY"
                        className={cn(
                          "h-8 min-w-0 flex-1 font-mono",
                          draft.include ? "text-black/80" : "text-black/35",
                          badKey && "border-red-400 focus:border-red-500",
                        )}
                      />
                      <div className="w-full pl-6.5 sm:w-72 sm:pl-0">
                        <PasswordInput
                          variant="admin-sm"
                          toggleSize="sm"
                          revealNoun="value"
                          visible={reveal === draft.id}
                          onVisibleChange={(shown) =>
                            setReveal(shown ? draft.id : null)
                          }
                          value={draft.value}
                          onChange={(event) =>
                            update(draft.id, { value: event.target.value })
                          }
                          autoComplete="off"
                          spellCheck={false}
                          aria-label="Value"
                          placeholder="Enter a value"
                          className="h-8 w-full font-mono"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="admin-icon-danger"
                        size="none"
                        className="shrink-0"
                        aria-label={`Remove ${key || "this row"}`}
                        onClick={() =>
                          setDrafts((current) =>
                            current.filter((row) => row.id !== draft.id),
                          )
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    {badKey && draft.include ? (
                      <p className="pl-6.5 text-[11px] text-red-700">
                        Letters, numbers and underscores only.
                      </p>
                    ) : noValue && draft.include ? (
                      <p className="pl-6.5 text-[11px] text-amber-800">
                        Needs a value.
                      </p>
                    ) : null}

                    {clash && draft.include && !badKey ? (
                      <div className="flex flex-wrap items-center gap-2 pl-6.5 text-[11px]">
                        <span className="text-amber-800">
                          Already in this group.
                        </span>
                        <span className="flex overflow-hidden rounded-lg border border-black/[0.09]">
                          <Button
                            type="button"
                            variant="bare"
                            size="none"
                            className={cn(
                              "px-2 py-0.5 text-[11px] font-medium",
                              draft.replace
                                ? "text-black/45 hover:bg-black/[0.04]"
                                : "bg-black/[0.06] text-black",
                            )}
                            onClick={() => update(draft.id, { replace: false })}
                          >
                            Skip
                          </Button>
                          <Button
                            type="button"
                            variant="bare"
                            size="none"
                            className={cn(
                              "px-2 py-0.5 text-[11px] font-medium",
                              draft.replace
                                ? "bg-black/[0.06] text-black"
                                : "text-black/45 hover:bg-black/[0.04]",
                            )}
                            onClick={() => update(draft.id, { replace: true })}
                          >
                            Replace
                          </Button>
                        </span>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="admin-dashed"
              size="none"
              className="min-w-0 flex-1 py-2.5 text-xs"
              onClick={addRow}
            >
              <Plus className="size-3.5" />
              Add another variable
            </Button>
            <Button
              type="button"
              variant="admin-secondary"
              size="admin"
              className="text-xs"
              onClick={() => fileInput.current?.click()}
            >
              <FileUp className="size-3.5" />
              Add from a file
            </Button>
          </div>

          {note ? <p className="text-xs text-black/50">{note}</p> : null}

          <Problem state={state} />
          <Footer
            pending={pending}
            disabled={!chosen.length || broken.length > 0}
            submit={
              chosen.length === 1
                ? "Save 1 variable"
                : chosen.length
                  ? `Save ${chosen.length} variables`
                  : "Save"
            }
            onClose={onClose}
            icon={<Check className="size-4" />}
          />
        </form>
      )}
    </Modal>
  );
}

export function SourceDialog({
  entry,
  candidate,
  mainGroupId,
  mainGroups,
  action,
  onClose,
}: {
  entry?: MainEntryRow;
  candidate?: EnvCandidate;
  mainGroupId: string | null;
  mainGroups: { id: string; name: string }[];
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const holders: EnvHolder[] = entry?.holders ?? candidate?.holders ?? [];
  const key = entry?.key ?? candidate?.key ?? "";
  const [pick, setPick] = useState(
    holders.find((holder) => holder.profileId === entry?.sourceProfileId)
      ?.credentialId ??
      holders[0]?.credentialId ??
      "",
  );
  const [group, setGroup] = useState(mainGroupId ?? mainGroups[0]?.id ?? "");
  useCloseOnSuccess(state, onClose);

  if (!mainGroups.length) {
    return (
      <Modal open title={key} onClose={onClose}>
        <div>
          <p className="text-xs leading-relaxed text-black/60">
            Main has no group to put this in yet. Create a group in main first,
            then pull values into it.
          </p>
          <div className="mt-5 flex justify-end">
            <Button variant="admin-secondary" size="admin" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open title={key} onClose={onClose}>
      <form action={formAction}>
        <input type="hidden" name="key" value={key} />
        <input type="hidden" name="mainGroupId" value={group} />
        <input type="hidden" name="sourceCredentialId" value={pick} />

        {!entry && mainGroups.length > 1 ? (
          <div className="mb-3.5 space-y-1.5">
            <span className="text-xs font-medium text-black/70">
              Main group
            </span>
            <FormSelect
              value={group}
              onValueChange={setGroup}
              ariaLabel="Main group"
              triggerClassName="h-9 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-sm"
              options={mainGroups.map((row) => ({
                value: row.id,
                label: row.name,
              }))}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {holders.map((holder) => {
            const chosen = pick === holder.credentialId;
            return (
              <label
                key={holder.credentialId}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5 transition duration-150",
                  chosen
                    ? "border-gd-green/50 bg-gd-green/[0.06]"
                    : "border-black/10 hover:border-black/20",
                )}
              >
                <input
                  type="radio"
                  name="pick"
                  checked={chosen}
                  onChange={() => setPick(holder.credentialId)}
                  className="accent-gd-green size-3.5"
                />
                <span className="bg-gd-panel-dark text-gd-primary grid size-7 shrink-0 place-items-center rounded-lg font-mono text-[10px] font-semibold">
                  {holder.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold">
                    {holder.name}
                  </span>
                  <span className="block font-mono text-[10.5px] text-black/50">
                    fingerprint {holder.fingerprint}
                  </span>
                </span>
                {entry?.sourceProfileId === holder.profileId ? (
                  <span
                    className={cn(
                      "rounded-full border px-1.75 py-0.5 font-mono text-[8.5px] tracking-[0.08em] uppercase",
                      TONE_SOFT.ok,
                    )}
                  >
                    current
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>

        <Problem state={state} />
        <Footer
          pending={pending}
          disabled={!pick}
          submit={entry ? "Use this value" : "Add to main"}
          onClose={onClose}
          icon={
            entry ? <Check className="size-4" /> : <Plus className="size-4" />
          }
        />
      </form>
    </Modal>
  );
}

export function ShareDialog({
  projectId,
  entry,
  mainGroupIds,
  members,
  action,
  onClose,
}: {
  projectId: string;
  entry: MainEntryRow | null;
  mainGroupIds: string[];
  members: { id: string; name: string }[];
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [pick, setPick] = useState(members[0]?.id ?? "");
  const shared = new Set((entry?.sharedWith ?? []).map((row) => row.profileId));
  useCloseOnSuccess(state, onClose);

  return (
    <Modal
      open
      title={entry ? `Share ${entry.key}` : "Share main"}
      onClose={onClose}
    >
      <form action={formAction}>
        <input type="hidden" name="projectId" value={projectId} />
        {entry ? (
          <input type="hidden" name="credentialId" value={entry.credentialId} />
        ) : (
          mainGroupIds.map((id) => (
            <input key={id} type="hidden" name="groupId" value={id} />
          ))
        )}
        <input type="hidden" name="profileId" value={pick} />
        <input type="hidden" name="access" value="use" />

        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <label
              key={member.id}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5 transition duration-150",
                pick === member.id
                  ? "border-gd-green/50 bg-gd-green/[0.06]"
                  : "border-black/10 hover:border-black/20",
              )}
            >
              <input
                type="radio"
                name="member"
                checked={pick === member.id}
                onChange={() => setPick(member.id)}
                className="accent-gd-green size-3.5"
              />
              <span className="min-w-0 flex-1 text-[13px] font-semibold">
                {member.name}
              </span>
              {shared.has(member.id) ? (
                <span
                  className={cn(
                    "rounded-full border px-1.75 py-0.5 font-mono text-[8.5px] tracking-[0.08em] uppercase",
                    TONE_SOFT.ok,
                  )}
                >
                  shared
                </span>
              ) : null}
            </label>
          ))}
        </div>

        <Problem state={state} />
        <Footer
          pending={pending}
          disabled={!pick || (!entry && !mainGroupIds.length)}
          submit="Share"
          onClose={onClose}
          icon={<Share2 className="size-4" />}
        />
      </form>
    </Modal>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirm,
  hidden,
  action,
  onClose,
}: {
  title: string;
  description: string;
  confirm: string;
  hidden: Record<string, string>;
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  useCloseOnSuccess(state, onClose);

  return (
    <Modal open title={title} description={description} onClose={onClose}>
      <form action={formAction}>
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <Problem state={state} />
        <Footer
          pending={pending}
          submit={confirm}
          onClose={onClose}
          tone="danger"
          icon={<Trash2 className="size-4" />}
        />
      </form>
    </Modal>
  );
}
