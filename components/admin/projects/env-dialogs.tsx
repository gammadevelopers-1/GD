"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, Move, Plus, Share2, Trash2, Upload } from "lucide-react";
import type { EnvCandidate, EnvGroupRow, EnvHolder, MainEntryRow } from "@/data/env-workspace";
import { IDLE_FORM, type SimpleFormState } from "@/lib/projects/form-state";
import { ENV_GROUP_NAME_MAX, maskValue, parseEnvBlob } from "@/lib/projects/env";
import { TONE_SOFT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PasswordInput } from "@/components/ui/password-input";
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
  submit,
  onClose,
  tone = "cta",
  icon,
}: {
  pending: boolean;
  submit: string;
  onClose: () => void;
  tone?: "cta" | "danger";
  icon?: React.ReactNode;
}) {
  return (
    <div className="mt-5 flex items-center justify-end gap-2">
      <Button type="button" variant="admin-ghost" size="admin" onClick={onClose}>
        Cancel
      </Button>
      <Button
        type="submit"
        variant={tone === "danger" ? "admin-danger" : "admin-cta"}
        size="admin"
        disabled={pending}
        {...(tone === "cta" ? { "data-button-fill": true } : {})}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : icon}
        {submit}
      </Button>
    </div>
  );
}

export function VariableDialog({
  groupId,
  groups,
  action,
  onClose,
}: {
  groupId: string | null;
  groups: EnvGroupRow[];
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [target, setTarget] = useState(groupId ?? groups[0]?.id ?? "");
  useCloseOnSuccess(state, onClose);

  return (
    <Modal open title="Add variable" description="Added to this version only." onClose={onClose}>
      <form action={formAction} className="px-5 py-4">
        <input type="hidden" name="groupId" value={target} />

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-black/70">Key</span>
          <Input
            name="key"
            variant="admin"
            autoFocus
            required
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
    <Modal
      open
      title={group ? "Rename group" : "New group"}
      onClose={onClose}
    >
      <form action={formAction} className="px-5 py-4">
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
    <Modal
      open
      title="Move variable"
      description={`Move ${variableKey} to another group in this version.`}
      onClose={onClose}
    >
      <form action={formAction} className="px-5 py-4">
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
          pending={pending || !groups.length}
          submit="Move"
          onClose={onClose}
          icon={<Move className="size-4" />}
        />
      </form>
    </Modal>
  );
}

export function UploadDialog({
  groupId,
  existingKeys,
  action,
  onClose,
}: {
  groupId: string;
  existingKeys: string[];
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [text, setText] = useState("");
  useCloseOnSuccess(state, onClose);

  const known = new Set(existingKeys);
  const parsed = parseEnvBlob(text);
  const fresh = parsed.pairs.filter((pair) => !known.has(pair.key));

  return (
    <Modal
      open
      size="lg"
      title="Upload .env"
      description="Paste an .env block or choose a file. Each line becomes its own variable, and a key that already exists is skipped."
      onClose={onClose}
    >
      <form action={formAction} className="px-5 py-4">
        <input type="hidden" name="groupId" value={groupId} />
        <input type="hidden" name="blob" value={text} />

        <Textarea
          variant="admin"
          value={text}
          onChange={(event) => setText(event.target.value)}
          spellCheck={false}
          rows={8}
          placeholder={"STRIPE_WEBHOOK_SECRET=whsec_…\nRESEND_API_KEY=re_…"}
          className="min-h-38 py-2.5 font-mono text-xs leading-relaxed"
        />

        <label className="mt-2.5 inline-flex cursor-pointer items-center gap-2 text-xs text-black/55">
          <Upload className="size-3.5" />
          Choose a file
          <input
            type="file"
            accept=".env,.txt,text/plain"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setText(String(reader.result ?? ""));
              reader.readAsText(file);
            }}
          />
        </label>

        {parsed.pairs.length ? (
          <ul className="mt-3.5 max-h-52 overflow-auto rounded-xl border border-black/[0.09]">
            {parsed.pairs.map((pair) => {
              const exists = known.has(pair.key);
              return (
                <li
                  key={pair.key}
                  className="flex items-center gap-2.5 border-b border-black/[0.05] px-3 py-2 last:border-b-0"
                >
                  <code className="min-w-0 flex-1 truncate font-mono text-xs font-semibold text-black/80">
                    {pair.key}
                  </code>
                  <span className="font-mono text-[11px] text-black/40">
                    {maskValue(pair.value)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-1.75 py-0.5 font-mono text-[8.5px] tracking-[0.08em] uppercase",
                      exists ? TONE_SOFT.warning : TONE_SOFT.ok,
                    )}
                  >
                    {exists ? "exists" : "new"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}

        <p className="mt-2.5 font-mono text-[10.5px] text-black/45">
          {parsed.pairs.length
            ? `${parsed.pairs.length} parsed · ${fresh.length} new · ${parsed.pairs.length - fresh.length} already exist`
            : "Nothing to import yet."}
        </p>

        <Problem state={state} />
        <Footer
          pending={pending || !fresh.length}
          submit={`Import ${fresh.length} new`}
          onClose={onClose}
          icon={<Check className="size-4" />}
        />
      </form>
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
  const agree = entry?.agree ?? candidate?.agree ?? true;
  const [pick, setPick] = useState(
    holders.find((holder) => holder.profileId === entry?.sourceProfileId)
      ?.credentialId ??
      holders[0]?.credentialId ??
      "",
  );
  const [group, setGroup] = useState(mainGroupId ?? mainGroups[0]?.id ?? "");
  useCloseOnSuccess(state, onClose);

  return (
    <Modal
      open
      title={key}
      description={
        agree
          ? "Every version holds the same value here, so any source is equivalent."
          : "Versions differ. Choose which value becomes the shared main."
      }
      onClose={onClose}
    >
      <form action={formAction} className="px-5 py-4">
        <input type="hidden" name="key" value={key} />
        <input type="hidden" name="mainGroupId" value={group} />
        <input type="hidden" name="sourceCredentialId" value={pick} />

        {!entry && mainGroups.length > 1 ? (
          <div className="mb-3.5 space-y-1.5">
            <span className="text-xs font-medium text-black/70">Main group</span>
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
                  className="size-3.5 accent-gd-green"
                />
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gd-panel-dark font-mono text-[10px] font-semibold text-gd-primary">
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
          pending={pending || !pick}
          submit={entry ? "Use this value" : "Add to main"}
          onClose={onClose}
          icon={entry ? <Check className="size-4" /> : <Plus className="size-4" />}
        />
      </form>
    </Modal>
  );
}

export function ShareDialog({
  projectId,
  entry,
  members,
  action,
  onClose,
}: {
  projectId: string;
  entry: MainEntryRow | null;
  members: { id: string; name: string }[];
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [pick, setPick] = useState(members[0]?.id ?? "");
  const shared = new Set((entry?.sharedWith ?? []).map((row) => row.profileId));

  return (
    <Modal
      open
      title={entry ? `Share ${entry.key}` : "Share main with a member"}
      description="They can copy the value; it is never shown to them as text."
      onClose={onClose}
    >
      <form action={formAction} className="px-5 py-4">
        <input type="hidden" name="projectId" value={projectId} />
        {entry ? (
          <input type="hidden" name="credentialId" value={entry.credentialId} />
        ) : null}
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
                className="size-3.5 accent-gd-green"
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
          pending={pending || !pick}
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
      <form action={formAction} className="px-5 py-4">
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
