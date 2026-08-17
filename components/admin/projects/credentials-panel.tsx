"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  History,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import type {
  CredentialAuditEntry,
  ProjectCredential,
} from "@/data/credentials";
import type { CopyResult } from "@/app/(admin)/projects/credential-actions";
import {
  type CredentialFormState,
  AUDIT_LABEL,
  CREDENTIAL_ENVIRONMENTS,
  ENVIRONMENT_CHIP,
  ENVIRONMENT_LABEL,
  IDLE_CREDENTIAL_FORM,
} from "@/lib/credentials/validation";
import {
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  DASHED_ACTION,
  FOCUS_RING,
  INPUT,
  PANEL,
} from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

type FormAction = (
  state: CredentialFormState,
  formData: FormData,
) => Promise<CredentialFormState>;
type PlainAction = (formData: FormData) => Promise<void>;

export type CredentialActions = {
  create: FormAction;
  updateMetadata: FormAction;
  replaceSecret: FormAction;
  grant: FormAction;
  setArchived: PlainAction;
  revoke: PlainAction;
  copy: (credentialId: string) => Promise<CopyResult>;
};

export function CredentialsPanel({
  projectId,
  credentials,
  members,
  audit,
  isOwner,
  vaultReady,
  projectArchived,
  actions,
}: {
  projectId: string;
  credentials: ProjectCredential[];
  members: Array<{ id: string; name: string }>;
  audit: CredentialAuditEntry[];
  isOwner: boolean;
  vaultReady: boolean;
  projectArchived: boolean;
  actions: CredentialActions;
}) {
  const [adding, setAdding] = useState(false);
  const live = credentials.filter((credential) => !credential.isArchived);
  const archived = credentials.filter((credential) => credential.isArchived);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        <section className={cn(PANEL, "p-5")}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-black/[0.045]">
                <KeyRound className="size-4 text-black/45" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
                  Credentials
                </h2>
                <p className="text-[11px] text-black/40">
                  {isOwner
                    ? "Encrypted. Shared one person at a time."
                    : "You can copy the ones shared with you."}
                </p>
              </div>
            </div>
            <span className="font-mono text-[10px] text-black/35">
              {live.length} stored
            </span>
          </div>

          {!vaultReady ? (
            <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[11px] leading-4 text-amber-800">
              <ShieldAlert className="mt-px size-3.5 shrink-0" />
              No encryption key is configured on this deployment, so the vault is
              closed. Nothing can be stored or read until{" "}
              <code className="font-mono">CREDENTIAL_ENCRYPTION_KEYS</code> is
              set.
            </p>
          ) : null}

          {live.length ? (
            <ul className="space-y-2.5">
              {live.map((credential) => (
                <CredentialRow
                  key={credential.id}
                  projectId={projectId}
                  credential={credential}
                  members={members}
                  isOwner={isOwner}
                  vaultReady={vaultReady}
                  actions={actions}
                />
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-black/10 px-4 py-6 text-center text-sm text-black/42">
              {isOwner
                ? "No credentials stored yet. Anything an engineer would otherwise paste into chat belongs here."
                : "No credentials have been stored for this project."}
            </p>
          )}

          {isOwner && !projectArchived ? (
            <div className="mt-4">
              {adding ? (
                <CreateCredentialForm
                  projectId={projectId}
                  create={actions.create}
                  disabled={!vaultReady}
                  onDone={() => setAdding(false)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className={DASHED_ACTION}
                >
                  <Plus className="size-4" />
                  Store a credential
                </button>
              )}
            </div>
          ) : null}

          {isOwner && archived.length ? (
            <div className="mt-6 border-t border-black/[0.06] pt-5">
              <h3 className="text-[13px] font-semibold tracking-[-0.02em]">
                Archived credentials
              </h3>
              <p className="mt-1.5 text-[11px] text-black/40">
                Kept, not deleted. Nobody can copy an archived credential.
              </p>
              <ul className="mt-3 space-y-2">
                {archived.map((credential) => (
                  <li
                    key={credential.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/[0.06] px-3 py-2"
                  >
                    <span className="truncate text-[13px] text-black/55">
                      {credential.name}
                    </span>
                    <form action={actions.setArchived}>
                      <input type="hidden" name="projectId" value={projectId} />
                      <input
                        type="hidden"
                        name="credentialId"
                        value={credential.id}
                      />
                      <input type="hidden" name="archived" value="false" />
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
            </div>
          ) : null}
        </section>
      </div>

      <div className="space-y-4">
        <section className={cn(PANEL, "p-5")}>
          <div className="mb-3 flex items-center gap-2.5">
            <ShieldCheck className="size-4 text-black/35" />
            <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
              How access works
            </h2>
          </div>
          <ul className="space-y-2.5 text-[12px] leading-5 text-black/55">
            <li>
              Being on this project does <strong>not</strong> give you a
              credential. An owner shares one credential with one person.
            </li>
            <li>
              Values are encrypted before they are stored, and the key is not in
              the database. A copy of the database is worth nothing.
            </li>
            <li>
              Nothing is ever shown on screen — it goes straight to your
              clipboard.
            </li>
            <li>
              Every copy, grant and refusal is recorded against your name.
            </li>
            <li>Revoking takes effect on the next request. There are no links.</li>
          </ul>
        </section>

        {isOwner ? (
          <section className={cn(PANEL, "p-5")}>
            <div className="mb-4 flex items-center gap-2.5">
              <History className="size-4 text-black/35" />
              <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
                Audit history
              </h2>
            </div>
            {audit.length ? (
              <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {audit.map((entry) => (
                  <li
                    key={entry.id}
                    className={cn(
                      "rounded-xl border px-3 py-2.5",
                      entry.action === "credential.access_denied"
                        ? "border-red-200 bg-red-50/60"
                        : "border-black/[0.06] bg-white/50",
                    )}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-1.5">
                      <span className="text-[12px] font-semibold text-black/70">
                        {AUDIT_LABEL[entry.action] ?? entry.action}
                      </span>
                      <span className="font-mono text-[10px] text-black/35">
                        {formatMoment(entry.occurredAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-black/45">
                      {entry.credentialName} · {entry.actor}
                      {entry.detail ? ` · ${entry.detail}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-black/40">
                Nothing recorded yet. Every credential action lands here.
              </p>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}

function CredentialRow({
  projectId,
  credential,
  members,
  isOwner,
  vaultReady,
  actions,
}: {
  projectId: string;
  credential: ProjectCredential;
  members: Array<{ id: string; name: string }>;
  isOwner: boolean;
  vaultReady: boolean;
  actions: CredentialActions;
}) {
  const [panel, setPanel] = useState<"none" | "share" | "replace" | "details">(
    "none",
  );
  const canCopy = credential.myAccess !== null && vaultReady;
  const canReplace =
    (credential.myAccess === "owner" || credential.myAccess === "edit") &&
    vaultReady;

  return (
    <li className="rounded-2xl border border-black/[0.065] bg-white/55 p-3.5 transition duration-200 hover:border-black/[0.14] hover:bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{credential.name}</p>
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                ENVIRONMENT_CHIP[credential.environment],
              )}
            >
              {ENVIRONMENT_LABEL[credential.environment]}
            </span>
            {credential.environment === "production" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700">
                <ShieldAlert className="size-3" />
                Client systems
              </span>
            ) : null}
          </div>
          {credential.service ? (
            <p className="mt-1 truncate text-[11px] text-black/45">
              {credential.service}
            </p>
          ) : null}
          {credential.description ? (
            <p className="mt-1 text-[12px] leading-5 text-black/50">
              {credential.description}
            </p>
          ) : null}
          {!isOwner ? (
            <p className="mt-1.5 text-[11px] text-black/40">
              {credential.myAccess
                ? `Shared with you — ${credential.myAccess} access.`
                : "Not shared with you. Ask an owner if you need it."}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {canCopy ? (
            <CopyValueButton credentialId={credential.id} copy={actions.copy} />
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-black/35">
              <Lock className="size-3" />
              No access
            </span>
          )}
          {canReplace ? (
            <button
              type="button"
              onClick={() => setPanel(panel === "replace" ? "none" : "replace")}
              className={cn(BUTTON_GHOST, "h-8")}
            >
              Replace
            </button>
          ) : null}
          {isOwner ? (
            <>
              <button
                type="button"
                onClick={() => setPanel(panel === "share" ? "none" : "share")}
                className={cn(BUTTON_GHOST, "h-8")}
              >
                Share
              </button>
              <button
                type="button"
                onClick={() => setPanel(panel === "details" ? "none" : "details")}
                className={cn(BUTTON_GHOST, "h-8")}
              >
                Edit
              </button>
              <form action={actions.setArchived}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="credentialId" value={credential.id} />
                <input type="hidden" name="archived" value="true" />
                <button
                  type="submit"
                  aria-label={`Archive ${credential.name}`}
                  className={cn(
                    "grid size-8 place-items-center rounded-lg text-black/35 transition hover:bg-red-50 hover:text-red-700",
                    FOCUS_RING,
                  )}
                >
                  <Archive className="size-3.5" />
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>

      {isOwner && credential.grants.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {credential.grants.map((grant) => (
            <li
              key={grant.profileId}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-[11px]"
            >
              <span className="text-black/65">{grant.name}</span>
              <span className="font-mono text-[9px] text-black/35 uppercase">
                {grant.access}
              </span>
              <form action={actions.revoke}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="credentialId" value={credential.id} />
                <input type="hidden" name="profileId" value={grant.profileId} />
                <button
                  type="submit"
                  aria-label={`Revoke ${grant.name}'s access to ${credential.name}`}
                  className={cn(
                    "grid size-4 place-items-center rounded text-black/30 transition hover:text-red-700",
                    FOCUS_RING,
                  )}
                >
                  <Trash2 className="size-3" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}

      {panel === "share" ? (
        <ShareForm
          projectId={projectId}
          credential={credential}
          members={members}
          grant={actions.grant}
          onDone={() => setPanel("none")}
        />
      ) : null}
      {panel === "replace" ? (
        <ReplaceForm
          projectId={projectId}
          credential={credential}
          replaceSecret={actions.replaceSecret}
          onDone={() => setPanel("none")}
        />
      ) : null}
      {panel === "details" ? (
        <DetailsForm
          projectId={projectId}
          credential={credential}
          updateMetadata={actions.updateMetadata}
          onDone={() => setPanel("none")}
        />
      ) : null}
    </li>
  );
}

// The value is handed to the clipboard and dropped. It is never put into
// state, never rendered, and never kept after this function returns.
function CopyValueButton({
  credentialId,
  copy,
}: {
  credentialId: string;
  copy: (credentialId: string) => Promise<CopyResult>;
}) {
  const [phase, setPhase] = useState<"idle" | "working" | "copied" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={phase === "working"}
        onClick={async () => {
          setPhase("working");
          setMessage(null);
          const result = await copy(credentialId);
          if (!result.ok) {
            setPhase("error");
            setMessage(result.message);
            return;
          }
          try {
            await navigator.clipboard.writeText(result.value);
            setPhase("copied");
            setTimeout(() => setPhase("idle"), 2500);
          } catch {
            setPhase("error");
            setMessage(
              "Your browser blocked the clipboard. Copying needs a secure page.",
            );
          }
        }}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#15181b] px-3 text-[11px] font-semibold text-white transition duration-200 hover:bg-black disabled:opacity-60",
          FOCUS_RING,
        )}
      >
        {phase === "working" ? (
          <Loader2 className="size-3 animate-spin" />
        ) : phase === "copied" ? (
          <ClipboardCheck className="size-3" />
        ) : (
          <Clipboard className="size-3" />
        )}
        {phase === "copied" ? "Copied" : "Copy value"}
      </button>
      {phase === "error" && message ? (
        <p role="alert" className="max-w-[240px] text-right text-[10px] text-red-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function CreateCredentialForm({
  projectId,
  create,
  disabled,
  onDone,
}: {
  projectId: string;
  create: FormAction;
  disabled: boolean;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    create,
    IDLE_CREDENTIAL_FORM,
  );

  useCloseOnSuccess(state, onDone);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-black/[0.08] bg-white/70 p-4"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <h3 className="text-[13px] font-semibold">Store a credential</h3>
      <p className="mt-1 text-[11px] text-black/45">
        The value is encrypted before it is written. Nobody but you can reach it
        until you share it.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field
          name="name"
          label="Name"
          placeholder="Supabase service key"
          error={state.fieldErrors.name}
          required
        />
        <Field
          name="service"
          label="Service"
          placeholder="Supabase, Stripe, Resend…"
          error={state.fieldErrors.service}
        />
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-black/55">Environment</span>
          <select
            name="environment"
            defaultValue="other"
            className={cn(INPUT, "h-10 cursor-pointer")}
          >
            {CREDENTIAL_ENVIRONMENTS.map((environment) => (
              <option key={environment} value={environment}>
                {ENVIRONMENT_LABEL[environment]}
              </option>
            ))}
          </select>
        </label>
        <Field
          name="description"
          label="What it is for"
          placeholder="Server-side only, rotates quarterly"
          error={state.fieldErrors.description}
        />
      </div>

      <label className="mt-3 block space-y-1.5">
        <span className="text-xs font-medium text-black/55">Value</span>
        <textarea
          name="secret"
          rows={3}
          required
          spellCheck={false}
          autoComplete="off"
          data-1p-ignore
          placeholder="Paste the key, token or connection string"
          className={cn(INPUT, "resize-y py-2.5 font-mono text-xs leading-5")}
        />
        {state.fieldErrors.secret ? (
          <span className="flex items-center gap-1.5 text-[11px] text-red-700">
            <AlertCircle className="size-3" />
            {state.fieldErrors.secret}
          </span>
        ) : null}
      </label>

      <FormFooter
        state={state}
        pending={pending}
        submitLabel="Encrypt and store"
        disabled={disabled}
        onCancel={onDone}
      />
    </form>
  );
}

function ShareForm({
  projectId,
  credential,
  members,
  grant,
  onDone,
}: {
  projectId: string;
  credential: ProjectCredential;
  members: Array<{ id: string; name: string }>;
  grant: FormAction;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    grant,
    IDLE_CREDENTIAL_FORM,
  );
  const held = new Set(credential.grants.map((entry) => entry.profileId));
  const shareable = members.filter((member) => !held.has(member.id));

  return (
    <form
      action={formAction}
      className="mt-3 rounded-xl border border-black/[0.08] bg-white/70 p-3.5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="credentialId" value={credential.id} />
      <div className="mb-3 flex items-center gap-2">
        <UserPlus className="size-3.5 text-black/40" />
        <h4 className="text-[12px] font-semibold">Share this credential</h4>
      </div>

      {shareable.length ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[160px] flex-1 space-y-1.5">
            <span className="text-[11px] font-medium text-black/55">Person</span>
            <select
              name="profileId"
              required
              className={cn(INPUT, "h-9 cursor-pointer text-xs")}
            >
              <option value="">Choose someone on this project</option>
              {shareable.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-medium text-black/55">Access</span>
            <select
              name="access"
              defaultValue="view"
              className={cn(INPUT, "h-9 w-28 cursor-pointer text-xs")}
            >
              <option value="view">View / copy</option>
              <option value="edit">Edit / replace</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={pending}
            className={cn(BUTTON_PRIMARY, "h-9 px-3 text-xs")}
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : null}
            Share
          </button>
          <button
            type="button"
            onClick={onDone}
            className={cn(BUTTON_GHOST, "h-9")}
          >
            Done
          </button>
        </div>
      ) : (
        <p className="text-[12px] text-black/45">
          Everyone on this project already holds this credential. Add someone to
          the Team tab first.
        </p>
      )}

      <StatusLine state={state} />
    </form>
  );
}

function ReplaceForm({
  projectId,
  credential,
  replaceSecret,
  onDone,
}: {
  projectId: string;
  credential: ProjectCredential;
  replaceSecret: FormAction;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    replaceSecret,
    IDLE_CREDENTIAL_FORM,
  );

  useCloseOnSuccess(state, onDone);

  return (
    <form
      action={formAction}
      className="mt-3 rounded-xl border border-black/[0.08] bg-white/70 p-3.5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="credentialId" value={credential.id} />
      <h4 className="text-[12px] font-semibold">Replace the value</h4>
      <p className="mt-1 text-[11px] text-black/45">
        The old value is overwritten. Everyone who already has access keeps it.
      </p>
      <textarea
        name="secret"
        rows={3}
        required
        spellCheck={false}
        autoComplete="off"
        data-1p-ignore
        placeholder="Paste the new value"
        className={cn(INPUT, "mt-2.5 resize-y py-2.5 font-mono text-xs leading-5")}
      />
      {state.fieldErrors.secret ? (
        <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-700">
          <AlertCircle className="size-3" />
          {state.fieldErrors.secret}
        </span>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className={cn(BUTTON_PRIMARY, "h-9 px-3 text-xs")}
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : null}
          Encrypt and replace
        </button>
        <button type="button" onClick={onDone} className={cn(BUTTON_GHOST, "h-9")}>
          Cancel
        </button>
      </div>
      <StatusLine state={state} />
    </form>
  );
}

function DetailsForm({
  projectId,
  credential,
  updateMetadata,
  onDone,
}: {
  projectId: string;
  credential: ProjectCredential;
  updateMetadata: FormAction;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateMetadata,
    IDLE_CREDENTIAL_FORM,
  );

  useCloseOnSuccess(state, onDone);

  return (
    <form
      action={formAction}
      className="mt-3 rounded-xl border border-black/[0.08] bg-white/70 p-3.5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="credentialId" value={credential.id} />
      <h4 className="mb-3 text-[12px] font-semibold">Edit details</h4>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          name="name"
          label="Name"
          defaultValue={credential.name}
          error={state.fieldErrors.name}
          required
        />
        <Field
          name="service"
          label="Service"
          defaultValue={credential.service ?? ""}
          error={state.fieldErrors.service}
        />
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-black/55">Environment</span>
          <select
            name="environment"
            defaultValue={credential.environment}
            className={cn(INPUT, "h-10 cursor-pointer")}
          >
            {CREDENTIAL_ENVIRONMENTS.map((environment) => (
              <option key={environment} value={environment}>
                {ENVIRONMENT_LABEL[environment]}
              </option>
            ))}
          </select>
        </label>
        <Field
          name="description"
          label="What it is for"
          defaultValue={credential.description ?? ""}
          error={state.fieldErrors.description}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className={cn(BUTTON_PRIMARY, "h-9 px-3 text-xs")}
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : null}
          Save details
        </button>
        <button type="button" onClick={onDone} className={cn(BUTTON_GHOST, "h-9")}>
          Cancel
        </button>
      </div>
      <StatusLine state={state} />
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  defaultValue,
  error,
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-black/55">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(INPUT, "h-10", error && "border-red-300")}
      />
      {error ? (
        <span className="flex items-center gap-1.5 text-[11px] text-red-700">
          <AlertCircle className="size-3" />
          {error}
        </span>
      ) : null}
    </label>
  );
}

function FormFooter({
  state,
  pending,
  submitLabel,
  disabled,
  onCancel,
}: {
  state: CredentialFormState;
  pending: boolean;
  submitLabel: string;
  disabled?: boolean;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending || disabled}
          className={cn(BUTTON_PRIMARY, "h-10 px-4 text-sm")}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={cn(BUTTON_SECONDARY, "h-10")}
        >
          <X className="size-3.5" />
          Cancel
        </button>
      </div>
      <StatusLine state={state} />
    </>
  );
}

function StatusLine({ state }: { state: CredentialFormState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "mt-3 flex items-start gap-1.5 text-[11px]",
        state.status === "success" ? "text-[#08743d]" : "text-red-700",
      )}
    >
      {state.status === "success" ? (
        <CheckCircle2 className="mt-px size-3 shrink-0" />
      ) : (
        <AlertCircle className="mt-px size-3 shrink-0" />
      )}
      {state.message}
    </p>
  );
}

// A save that worked closes its form. The list behind it already has the new
// state from revalidatePath.
function useCloseOnSuccess(state: CredentialFormState, onDone: () => void) {
  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);
}

function formatMoment(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
