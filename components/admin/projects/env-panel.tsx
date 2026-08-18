"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  Archive,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  FileWarning,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  Share2,
  Upload,
} from "lucide-react";
import type { ProjectCredential } from "@/data/credentials";
import type { CopyResult } from "@/app/(admin)/projects/credential-actions";
import type { EnvFile, EnvGroup } from "@/data/env";
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
import { EnvComposer } from "@/components/admin/projects/env-composer";
import { useCloseOnSuccess } from "@/components/admin/projects/use-close-on-success";
import { cn } from "@/lib/utils";

type FormAction = (
  state: SimpleFormState,
  formData: FormData,
) => Promise<SimpleFormState>;

export type EnvActions = {
  createGroup: FormAction;
  renameGroup: FormAction;
  setGroupArchived: (formData: FormData) => Promise<void>;
  saveVariables: FormAction;
  grantGroup: FormAction;
  uploadFile: FormAction;
  archiveFile: (formData: FormData) => Promise<void>;
  downloadFile: (
    state: SimpleFormState,
    formData: FormData,
  ) => Promise<SimpleFormState & { url?: string }>;
  copy: (credentialId: string) => Promise<CopyResult>;
};

export function EnvPanel({
  projectId,
  groups,
  variables,
  files,
  members,
  isOwner,
  vaultReady,
  actions,
}: {
  projectId: string;
  groups: EnvGroup[];
  variables: ProjectCredential[];
  files: EnvFile[];
  members: Array<{ id: string; name: string }>;
  isOwner: boolean;
  vaultReady: boolean;
  actions: EnvActions;
}) {
  const byGroup = new Map<string, ProjectCredential[]>();
  for (const variable of variables) {
    if (!variable.envGroupId) continue;
    const list = byGroup.get(variable.envGroupId) ?? [];
    list.push(variable);
    byGroup.set(variable.envGroupId, list);
  }

  return (
    <section className="card-surface rounded-2xl border border-black/[0.06] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#2fe85c]/12">
            <KeyRound className="size-4 text-[#08743d]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold tracking-[-0.025em]">
              Environment variables
            </h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-black/45">
              Each key is stored and encrypted on its own, so access is granted
              per variable rather than per file. Values are copied to the
              clipboard and never rendered on screen.
            </p>
          </div>
        </div>
      </div>

      {!vaultReady ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] leading-5 text-amber-900">
          <FileWarning className="mt-0.5 size-3.5 shrink-0" />
          No encryption key is configured, so the vault is closed. Variables can
          be read but not added until <code>CREDENTIAL_ENCRYPTION_KEYS</code> is
          set.
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            projectId={projectId}
            group={group}
            variables={byGroup.get(group.id) ?? []}
            members={members}
            isOwner={isOwner}
            vaultReady={vaultReady}
            actions={actions}
          />
        ))}

        {!groups.length ? (
          <p className="rounded-xl border border-dashed border-black/10 px-4 py-6 text-center text-[12px] text-black/40">
            No ENV containers yet. Most projects want one each for frontend,
            backend and root.
          </p>
        ) : null}

        {isOwner ? (
          <NewGroupForm projectId={projectId} action={actions.createGroup} />
        ) : null}
      </div>

      {isOwner ? (
        <EnvFiles
          projectId={projectId}
          files={files}
          groups={groups}
          actions={actions}
        />
      ) : null}
    </section>
  );
}

function GroupCard({
  projectId,
  group,
  variables,
  members,
  isOwner,
  vaultReady,
  actions,
}: {
  projectId: string;
  group: EnvGroup;
  variables: ProjectCredential[];
  members: Array<{ id: string; name: string }>;
  isOwner: boolean;
  vaultReady: boolean;
  actions: EnvActions;
}) {
  const [open, setOpen] = useState(true);
  const [panel, setPanel] = useState<"none" | "add" | "share">("none");

  const readable = variables.filter((variable) => variable.myAccess).length;

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.07] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 bg-black/[0.025] px-3.5 py-2.5 transition-colors hover:bg-black/[0.04]">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={cn("flex min-w-0 items-center gap-2 rounded", FOCUS_RING)}
        >
          <ChevronRight
            className={cn(
              "size-3.5 shrink-0 text-black/35 transition-transform duration-200",
              open && "rotate-90",
            )}
          />
          <span className="truncate text-[13px] font-semibold">
            {group.name}
          </span>
          <span className="font-mono text-[10px] text-black/35">
            {variables.length} key{variables.length === 1 ? "" : "s"}
          </span>
          {!isOwner && variables.length ? (
            <span className="text-[10px] text-black/35">
              · {readable} shared with you
            </span>
          ) : null}
        </button>

        {isOwner ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setPanel(panel === "add" ? "none" : "add")}
              disabled={!vaultReady}
              className={cn(BUTTON_GHOST, "h-7 disabled:opacity-40")}
            >
              <Plus className="size-3" />
              Add variables
            </button>
            <button
              type="button"
              onClick={() => setPanel(panel === "share" ? "none" : "share")}
              className={cn(BUTTON_GHOST, "h-7")}
            >
              <Share2 className="size-3" />
              Share
            </button>
            <form action={actions.setGroupArchived}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="groupId" value={group.id} />
              <input type="hidden" name="archived" value="1" />
              <button
                type="submit"
                aria-label={`Archive ${group.name}`}
                className={ICON_BUTTON}
              >
                <Archive className="size-3.5" />
              </button>
            </form>
          </div>
        ) : null}
      </header>

      {group.description ? (
        <p className="border-b border-black/[0.06] px-3.5 py-2 text-[11px] text-black/45">
          {group.description}
        </p>
      ) : null}

      {panel === "add" ? (
        <EnvComposer
          projectId={projectId}
          groupId={group.id}
          action={actions.saveVariables}
          onDone={() => setPanel("none")}
        />
      ) : null}

      {panel === "share" ? (
        <ShareGroupForm
          projectId={projectId}
          groupId={group.id}
          members={members}
          action={actions.grantGroup}
          onDone={() => setPanel("none")}
        />
      ) : null}

      {open ? (
        <ul className="divide-y divide-black/[0.05]">
          {variables.map((variable) => (
            <VariableRow
              key={variable.id}
              variable={variable}
              copy={actions.copy}
            />
          ))}
          {!variables.length ? (
            <li className="px-3.5 py-4 text-center text-[11px] text-black/35">
              No keys in this container yet.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

function VariableRow({
  variable,
  copy,
}: {
  variable: ProjectCredential;
  copy: EnvActions["copy"];
}) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const canCopy = Boolean(variable.myAccess);

  async function onCopy() {
    setState("working");
    const result = await copy(variable.id);

    if (!result.ok) {
      setState("error");
      setMessage(result.message);
      return;
    }

    try {
      await navigator.clipboard.writeText(result.value);
      setState("done");
      setMessage(null);
      window.setTimeout(() => setState("idle"), 1600);
    } catch {
      setState("error");
      setMessage("Your browser blocked the clipboard.");
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-2 px-3.5 py-2">
      <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-black/75">
        {variable.name}
      </code>

      {canCopy ? (
        <button
          type="button"
          onClick={onCopy}
          disabled={state === "working"}
          className={cn(BUTTON_GHOST, "h-7 shrink-0")}
        >
          {state === "working" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : state === "done" ? (
            <Check className="size-3 text-[#08743d]" />
          ) : (
            <Copy className="size-3" />
          )}
          {state === "done" ? "Copied" : "Copy"}
        </button>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-black/[0.04] px-2 py-1 text-[10px] font-medium text-black/35">
          <Lock className="size-2.5" />
          No access
        </span>
      )}

      {state === "error" && message ? (
        <p className="w-full text-[11px] font-medium text-red-700">{message}</p>
      ) : null}
    </li>
  );
}

function ShareGroupForm({
  projectId,
  groupId,
  members,
  action,
  onDone,
}: {
  projectId: string;
  groupId: string;
  members: Array<{ id: string; name: string }>;
  action: FormAction;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);

  useCloseOnSuccess(state, onDone);

  return (
    <form
      action={formAction}
      className="space-y-2 border-b border-black/[0.06] bg-black/[0.012] px-3.5 py-3"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="groupId" value={groupId} />
      <p className="text-[11px] leading-5 text-black/45">
        Shares every key in this container with one person. Each stays an
        individual grant, so any single key can be revoked on its own.
      </p>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <select name="profileId" required className={cn(INPUT_SMALL, "h-9")}>
          <option value="">Choose a person</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <select name="access" className={cn(INPUT_SMALL, "h-9")}>
          <option value="view">View and copy</option>
          <option value="edit">Edit and replace</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className={cn(BUTTON_SECONDARY, "h-9 text-xs")}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Share
        </button>
      </div>
      <FormFeedback state={state} />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onDone}
          className={cn(BUTTON_GHOST, "h-8")}
        >
          Close
        </button>
      </div>
    </form>
  );
}

function NewGroupForm({
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
        className={cn(DASHED_ACTION, "py-3 text-[12px]")}
      >
        <Plus className="size-3.5" />
        Add an ENV container
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-xl border border-black/[0.08] p-3"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="name"
          required
          autoFocus
          placeholder="Frontend ENV"
          className={cn(INPUT_SMALL, "h-9")}
        />
        <input
          name="description"
          placeholder="What runs with these? (optional)"
          className={cn(INPUT_SMALL, "h-9")}
        />
      </div>
      <FormFeedback state={state} />
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
          Add container
        </button>
      </div>
    </form>
  );
}

function EnvFiles({
  projectId,
  files,
  groups,
  actions,
}: {
  projectId: string;
  files: EnvFile[];
  groups: EnvGroup[];
  actions: EnvActions;
}) {
  const [state, formAction, pending] = useActionState(
    actions.uploadFile,
    IDLE_FORM,
  );

  return (
    <div className="mt-6 border-t border-black/[0.06] pt-5">
      <h3 className="text-[13px] font-semibold tracking-[-0.02em]">
        Uploaded ENV files
      </h3>
      <p className="mt-1 max-w-2xl text-[11px] leading-5 text-black/45">
        Optional, and owner-only in both directions. A whole file is every
        secret at once, so it cannot be shared per variable the way an
        individual key can — share the keys above instead.
      </p>

      <ul className="mt-3 space-y-1.5">
        {files.map((file) => (
          <EnvFileRow
            key={file.id}
            projectId={projectId}
            file={file}
            actions={actions}
          />
        ))}
        {!files.length ? (
          <li className="rounded-xl border border-dashed border-black/10 px-3 py-3 text-center text-[11px] text-black/35">
            No files uploaded.
          </li>
        ) : null}
      </ul>

      <form action={formAction} className="mt-3 space-y-2">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="file"
            name="file"
            required
            className="block w-full text-[11px] file:mr-3 file:rounded-lg file:border-0 file:bg-black/[0.06] file:px-3 file:py-1.5 file:text-[11px] file:font-medium"
          />
          <select name="groupId" className={cn(INPUT_SMALL, "h-8")}>
            <option value="">No container</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className={cn(BUTTON_SECONDARY, "h-8 text-xs")}
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            Upload
          </button>
        </div>
        <FormFeedback state={state} />
      </form>
    </div>
  );
}

function EnvFileRow({
  projectId,
  file,
  actions,
}: {
  projectId: string;
  file: EnvFile;
  actions: EnvActions;
}) {
  const [state, formAction, pending] = useActionState(
    actions.downloadFile,
    IDLE_FORM as SimpleFormState & { url?: string },
  );

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl border border-black/[0.07] px-3 py-2">
      <code className="min-w-0 flex-1 truncate font-mono text-[12px]">
        {file.fileName}
      </code>
      <span className="shrink-0 text-[10px] text-black/35">
        {Math.max(1, Math.round(file.byteSize / 1024))} KB ·{" "}
        {formatDate(file.createdAt.slice(0, 10))}
      </span>

      {state.url ? (
        <a
          href={state.url}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(BUTTON_SECONDARY, "h-7 shrink-0 text-[11px]")}
        >
          <Download className="size-3" />
          Open link
        </a>
      ) : (
        <form action={formAction} className="shrink-0">
          <input type="hidden" name="fileId" value={file.id} />
          <button
            type="submit"
            disabled={pending}
            className={cn(BUTTON_GHOST, "h-7")}
          >
            {pending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Download className="size-3" />
            )}
            Get link
          </button>
        </form>
      )}

      <form action={actions.archiveFile} className="shrink-0">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="fileId" value={file.id} />
        <button
          type="submit"
          aria-label={`Remove ${file.fileName}`}
          className={ICON_BUTTON}
        >
          <Archive className="size-3.5" />
        </button>
      </form>

      {state.status === "error" && state.message ? (
        <p className="w-full text-[11px] font-medium text-red-700">
          {state.message}
        </p>
      ) : null}
    </li>
  );
}

function FormFeedback({ state }: { state: SimpleFormState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
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
  );
}
