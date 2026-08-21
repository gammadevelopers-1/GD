"use client";

import { useActionState, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import type { CredentialGrant, ProjectCredential } from "@/data/credentials";
import type { CopyResult } from "@/app/(admin)/projects/env-actions";
import type { EnvFile, EnvGroup } from "@/data/env";
import {
  ShareContainers,
  type ShareTarget,
} from "@/components/admin/projects/share-containers";
import { FormSelect } from "@/components/common/form-select";
import { type SimpleFormState, IDLE_FORM } from "@/lib/projects/form-state";
import { formatDate } from "@/lib/projects/format";
import {
  type CredentialAccess,
  ACCESS_HINT,
  ACCESS_LABEL,
  ACCESS_CHIP,
  CREDENTIAL_ACCESS,
  canCopyValue,
  canManageVariable,
} from "@/lib/credentials/validation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ENV_NOTE_MAX } from "@/lib/projects/env";
import {
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  DASHED_ACTION,
  FOCUS_RING,
  ICON_BUTTON,
  INPUT,
  INPUT_SMALL,
  PANEL,
} from "@/lib/admin-ui";
import {
  type GroupOption,
  ImportDialog,
  ManualDialog,
} from "@/components/admin/projects/env-composer";
import { ConfirmAction, Modal } from "@/components/admin/projects/modal";
import { useCloseOnSuccess } from "@/components/admin/projects/use-close-on-success";
import { cn } from "@/lib/utils";

type FormAction = (
  state: SimpleFormState,
  formData: FormData,
) => Promise<SimpleFormState>;

export type EnvActions = {
  createGroup: FormAction;
  shareGroups: FormAction;
  renameGroup: FormAction;
  deleteGroup: FormAction;
  saveVariables: FormAction;
  updateVariable: FormAction;
  deleteVariable: FormAction;
  grantAccess: FormAction;
  revokeAccess: (formData: FormData) => Promise<void>;
  uploadFile: FormAction;
  deleteFile: FormAction;
  downloadFile: (
    state: SimpleFormState,
    formData: FormData,
  ) => Promise<SimpleFormState & { url?: string }>;
  copy: (credentialId: string) => Promise<CopyResult>;
};

type Member = { id: string; name: string };

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
  members: Member[];
  isOwner: boolean;
  vaultReady: boolean;
  actions: EnvActions;
}) {
  const [adding, setAdding] = useState<"none" | "import" | "manual">("none");
  const [targetGroup, setTargetGroup] = useState<string | null>(null);
  const [sharing, setSharing] = useState<string[] | null>(null);

  const byGroup = new Map<string, ProjectCredential[]>();
  for (const variable of variables) {
    if (!variable.envGroupId) continue;
    const list = byGroup.get(variable.envGroupId) ?? [];
    list.push(variable);
    byGroup.set(variable.envGroupId, list);
  }

  const options: GroupOption[] = groups.map((group) => ({
    id: group.id,
    name: group.name,
    keys: (byGroup.get(group.id) ?? []).map((variable) => variable.name),
  }));

  const defaultGroupId = targetGroup ?? options[0]?.id ?? "";

  const shareTargets: ShareTarget[] = groups
    .map((group) => ({
      id: group.id,
      name: group.name,
      count: (byGroup.get(group.id) ?? []).length,
    }))
    .filter((target) => target.count > 0);

  function openAdd(mode: "import" | "manual", groupId?: string) {
    setTargetGroup(groupId ?? null);
    setAdding(mode);
  }

  return (
    <section className={cn(PANEL, "p-6 sm:p-7")}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-[16px] font-semibold tracking-[-0.025em]">
          Environment variables
        </h2>
        {isOwner && options.length ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openAdd("import")}
              disabled={!vaultReady}
              className={cn(BUTTON_SECONDARY, "h-9 text-xs")}
            >
              <Upload className="size-3.5" />
              Upload .env
            </button>
            <button
              type="button"
              onClick={() => setSharing([])}
              className={cn(BUTTON_SECONDARY, "h-9 text-xs")}
            >
              <Share2 className="size-3.5" />
              Share containers
            </button>
            <button
              type="button"
              onClick={() => openAdd("manual")}
              disabled={!vaultReady}
              className={cn(BUTTON_SECONDARY, "h-9 text-xs")}
            >
              <Plus className="size-3.5" />
              Add variable
            </button>
          </div>
        ) : null}
      </header>

      {!vaultReady && isOwner ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] leading-5 text-amber-900">
          No encryption key is configured, so values cannot be added. Set{" "}
          <code>CREDENTIAL_ENCRYPTION_KEYS</code> first.
        </p>
      ) : null}

      {isOwner && sharing !== null ? (
        <ShareContainers
          projectId={projectId}
          containers={shareTargets}
          members={members}
          action={actions.shareGroups}
          preselected={sharing}
          open
          onClose={() => setSharing(null)}
        />
      ) : null}

      <div className="mt-6 space-y-4">
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
            onShare={() => setSharing([group.id])}
            onAdd={(mode) => openAdd(mode, group.id)}
          />
        ))}

        {!groups.length ? (
          <EmptyLine
            text="No groups yet."
            action={isOwner ? "Create the first one below." : null}
          />
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

      {isOwner && defaultGroupId && adding === "import" ? (
        <ImportDialog
          projectId={projectId}
          groups={options}
          defaultGroupId={defaultGroupId}
          action={actions.saveVariables}
          onClose={() => setAdding("none")}
        />
      ) : null}

      {isOwner && defaultGroupId && adding === "manual" ? (
        <ManualDialog
          projectId={projectId}
          groups={options}
          defaultGroupId={defaultGroupId}
          action={actions.saveVariables}
          onClose={() => setAdding("none")}
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
  onAdd,
  onShare,
}: {
  projectId: string;
  group: EnvGroup;
  variables: ProjectCredential[];
  members: Member[];
  isOwner: boolean;
  vaultReady: boolean;
  actions: EnvActions;
  onAdd: (mode: "import" | "manual") => void;
  onShare: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={cn(
            "flex min-w-0 items-center gap-2.5 rounded py-0.5",
            FOCUS_RING,
          )}
        >
          <ChevronRight
            className={cn(
              "size-4 shrink-0 text-black/30 transition-transform duration-200",
              open && "rotate-90",
            )}
          />
          <span className="truncate text-[14px] font-semibold tracking-[-0.02em]">
            {group.name}
          </span>
          <span className="shrink-0 text-[12px] text-black/35">
            {variables.length}
          </span>
        </button>

        {isOwner ? (
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => onAdd("manual")}
              disabled={!vaultReady}
              className={cn(BUTTON_GHOST, "h-8 disabled:opacity-40")}
            >
              <Plus className="size-3" />
              Add
            </button>
            <button
              type="button"
              onClick={() => onAdd("import")}
              disabled={!vaultReady}
              className={cn(BUTTON_GHOST, "h-8 disabled:opacity-40")}
            >
              <Upload className="size-3" />
              Upload
            </button>
            {variables.length ? (
              <button
                type="button"
                onClick={onShare}
                aria-label={`Share everything in ${group.name}`}
                className={ICON_BUTTON}
              >
                <Share2 className="size-3.5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setRenaming(true)}
              aria-label={`Rename ${group.name}`}
              className={ICON_BUTTON}
            >
              <Pencil className="size-3.5" />
            </button>
            <DeleteGroupButton
              projectId={projectId}
              group={group}
              action={actions.deleteGroup}
            />
          </div>
        ) : null}
      </header>

      {renaming ? (
        <RenameGroupForm
          projectId={projectId}
          group={group}
          action={actions.renameGroup}
          onDone={() => setRenaming(false)}
        />
      ) : null}

      {open ? (
        <ul className="divide-y divide-black/[0.05] border-t border-black/[0.06]">
          {variables.map((variable) => (
            <VariableRow
              key={variable.id}
              projectId={projectId}
              variable={variable}
              members={members}
              isOwner={isOwner}
              actions={actions}
            />
          ))}
          {!variables.length ? (
            <li className="px-4 py-5 text-[12px] text-black/35">
              No variables in this group.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

function VariableRow({
  projectId,
  variable,
  members,
  isOwner,
  actions,
}: {
  projectId: string;
  variable: ProjectCredential;
  members: Member[];
  isOwner: boolean;
  actions: EnvActions;
}) {
  const [copying, setCopying] = useState<"idle" | "working" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<"none" | "edit" | "share" | "delete">(
    "none",
  );

  const mayCopy = canCopyValue(variable.myAccess);
  const mayManage = canManageVariable(variable.myAccess);

  async function onCopy() {
    setCopying("working");
    setError(null);
    const result = await actions.copy(variable.id);

    if (!result.ok) {
      setCopying("idle");
      setError(result.message);
      return;
    }

    try {
      await navigator.clipboard.writeText(result.value);
      setCopying("done");
      window.setTimeout(() => setCopying("idle"), 1600);
    } catch {
      setCopying("idle");
      setError("Your browser blocked the clipboard.");
    }
  }

  return (
    <li className="px-4 py-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <code className="block truncate font-mono text-[12.5px] text-black/80">
            {variable.name}
          </code>
          {variable.description ? (
            <p className="mt-0.5 truncate text-[11.5px] text-black/40">
              {variable.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {isOwner && variable.grants.length ? (
            <span
              title={`Shared with ${variable.grants.length} ${variable.grants.length === 1 ? "person" : "people"}`}
              className="mr-1 inline-flex shrink-0 items-center gap-1 text-[11px] text-black/35"
            >
              <Users className="size-3" />
              {variable.grants.length}
            </span>
          ) : null}

          {mayCopy ? (
            <button
              type="button"
              onClick={onCopy}
              disabled={copying === "working"}
              className={cn(BUTTON_GHOST, "h-8")}
            >
              {copying === "working" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : copying === "done" ? (
                <Check className="size-3 text-[#08743d]" />
              ) : (
                <Copy className="size-3" />
              )}
              {copying === "done" ? "Copied" : "Copy value"}
            </button>
          ) : (
            <span className="px-2 text-[11px] text-black/30">
              No access to the value
            </span>
          )}

          {isOwner || mayManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Actions for ${variable.name}`}
                className={cn(ICON_BUTTON, "size-8")}
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {mayCopy ? (
                  <DropdownMenuItem onSelect={() => void onCopy()}>
                    <Copy />
                  </DropdownMenuItem>
                ) : null}
                {isOwner ? (
                  <DropdownMenuItem onSelect={() => setPanel("share")}>
                    <Share2 />
                    Share
                  </DropdownMenuItem>
                ) : null}
                {mayManage ? (
                  <DropdownMenuItem onSelect={() => setPanel("edit")}>
                    <Pencil />
                    Edit
                  </DropdownMenuItem>
                ) : null}
                {mayManage ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setPanel("delete")}
                    >
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-[11.5px] font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {panel === "edit" ? (
        <EditVariableDialog
          projectId={projectId}
          variable={variable}
          action={actions.updateVariable}
          onClose={() => setPanel("none")}
        />
      ) : null}

      {panel === "share" ? (
        <ShareDialog
          projectId={projectId}
          variable={variable}
          members={members}
          actions={actions}
          onClose={() => setPanel("none")}
        />
      ) : null}

      {panel === "delete" ? (
        <DeleteVariableDialog
          projectId={projectId}
          variable={variable}
          action={actions.deleteVariable}
          onClose={() => setPanel("none")}
        />
      ) : null}
    </li>
  );
}

function EditVariableDialog({
  projectId,
  variable,
  action,
  onClose,
}: {
  projectId: string;
  variable: ProjectCredential;
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [reveal, setReveal] = useState(false);

  useCloseOnSuccess(state, onClose);

  return (
    <Modal open onClose={onClose} title={`Edit ${variable.name}`}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="credentialId" value={variable.id} />

        <label className="block space-y-1.5">
          <span className="text-[12px] text-black/50">Key</span>
          <input
            name="key"
            defaultValue={variable.name}
            autoFocus
            spellCheck={false}
            className={cn(INPUT, "h-10 font-mono text-xs")}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-[12px] text-black/50">
            New value <span className="text-black/30">(optional)</span>
          </span>
          <span className="relative block">
            <input
              name="value"
              type={reveal ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              placeholder="Leave empty to keep the current value"
              className={cn(INPUT, "h-10 pr-10 font-mono text-xs")}
            />
            <button
              type="button"
              onClick={() => setReveal((value) => !value)}
              aria-label={reveal ? "Hide value" : "Show value"}
              className={cn(
                "absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-black/30 transition hover:text-black/70",
                FOCUS_RING,
              )}
            >
              {reveal ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </button>
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[12px] text-black/50">
            Note <span className="text-black/30">(optional)</span>
          </span>
          <input
            name="note"
            defaultValue={variable.description ?? ""}
            maxLength={ENV_NOTE_MAX}
            placeholder="Where to rotate this, or who to contact"
            className={cn(INPUT, "h-10 text-xs")}
          />
        </label>

        <Feedback state={state} />

        <div className="flex justify-end gap-2 border-t border-black/[0.07] pt-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(BUTTON_SECONDARY, "h-9 text-xs")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
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

function ShareDialog({
  projectId,
  variable,
  members,
  actions,
  onClose,
}: {
  projectId: string;
  variable: ProjectCredential;
  members: Member[];
  actions: EnvActions;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    actions.grantAccess,
    IDLE_FORM,
  );
  const [access, setAccess] = useState<CredentialAccess>("use");

  const granted = new Map(
    variable.grants.map((grant) => [grant.profileId, grant]),
  );
  const available = members.filter((member) => !granted.has(member.id));

  return (
    <Modal
      open
      onClose={onClose}
      title={`Share ${variable.name}`}
      description="Access is given to a person, never to a link."
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="credentialId" value={variable.id} />
        <input type="hidden" name="access" value={access} />

        <label className="block space-y-1.5">
          <span className="text-[12px] text-black/50">Person</span>
          <FormSelect
            name="profileId"
            required
            defaultValue=""
            triggerClassName={cn(INPUT, "h-10 text-xs")}
            options={[
              {
                value: "",
                label: "Choose someone on this project",
                disabled: true,
              },
              ...available.map((member) => ({
                value: member.id,
                label: member.name,
              })),
            ]}
          />
          {!available.length ? (
            <span className="text-[11.5px] text-black/40">
              Everyone on this project already has access.
            </span>
          ) : null}
        </label>

        <fieldset className="space-y-1.5">
          <legend className="text-[12px] text-black/50">Access</legend>
          <div className="space-y-1.5">
            {CREDENTIAL_ACCESS.map((level) => (
              <label
                key={level}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition",
                  access === level
                    ? "border-[#16a34a]/40 bg-[#16a34a]/[0.06]"
                    : "border-black/[0.08] bg-white hover:border-black/20",
                )}
              >
                <input
                  type="radio"
                  name="accessChoice"
                  checked={access === level}
                  onChange={() => setAccess(level)}
                  className={cn("mt-0.5 size-3.5 accent-[#16a34a]", FOCUS_RING)}
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium">
                    {ACCESS_LABEL[level]}
                  </span>
                  <span className="block text-[11.5px] text-black/45">
                    {ACCESS_HINT[level]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Feedback state={state} />

        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={pending || !available.length}
            className={cn(BUTTON_PRIMARY, "h-9 text-xs")}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Share
          </button>
        </div>
      </form>

      <div className="mt-5 border-t border-black/[0.07] pt-4">
        <h3 className="text-[12px] font-semibold text-black/50">
          Who has access
        </h3>
        {variable.grants.length ? (
          <ul className="mt-2 space-y-1">
            {variable.grants.map((grant) => (
              <GrantRow
                key={grant.profileId}
                projectId={projectId}
                credentialId={variable.id}
                grant={grant}
                revoke={actions.revokeAccess}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[12px] text-black/35">
            Nobody yet. Only owners can reach it.
          </p>
        )}
      </div>
    </Modal>
  );
}

function GrantRow({
  projectId,
  credentialId,
  grant,
  revoke,
}: {
  projectId: string;
  credentialId: string;
  grant: CredentialGrant;
  revoke: (formData: FormData) => Promise<void>;
}) {
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl border border-black/[0.07] bg-white px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-[12.5px] text-black/70">
        {grant.name}
      </span>
      <span
        className={cn(
          "shrink-0 rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium",
          ACCESS_CHIP[grant.access],
        )}
      >
        {ACCESS_LABEL[grant.access]}
      </span>
      <form action={revoke} className="shrink-0">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="credentialId" value={credentialId} />
        <input type="hidden" name="profileId" value={grant.profileId} />
        <button
          type="submit"
          className={cn(BUTTON_GHOST, "h-7 hover:text-red-700")}
        >
          Remove
        </button>
      </form>
    </li>
  );
}

function DeleteVariableDialog({
  projectId,
  variable,
  action,
  onClose,
}: {
  projectId: string;
  variable: ProjectCredential;
  action: FormAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  useCloseOnSuccess(state, onClose);

  return (
    <Modal
      open
      title={`Delete ${variable.name}?`}
      description="The value is destroyed with it. Anyone this variable was shared with loses it too."
      onClose={onClose}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="credentialId" value={variable.id} />

        <Feedback state={state} />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={cn(BUTTON_SECONDARY, "h-9")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition duration-200 hover:bg-red-700 disabled:pointer-events-none disabled:opacity-60",
              FOCUS_RING,
            )}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Delete
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteGroupButton({
  projectId,
  group,
  action,
}: {
  projectId: string;
  group: EnvGroup;
  action: FormAction;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={formAction} ref={formRef} className="contents">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="groupId" value={group.id} />
      <ConfirmAction
        label={<Trash2 className="size-3.5" />}
        question={`Delete the ${group.name} group?`}
        confirmLabel="Delete"
        pending={pending}
        onConfirm={() => formRef.current?.requestSubmit()}
        className={cn(ICON_BUTTON, "hover:text-red-700")}
      />
      {state.status === "error" && state.message ? (
        <p role="alert" className="w-full text-[11.5px] text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function RenameGroupForm({
  projectId,
  group,
  action,
  onDone,
}: {
  projectId: string;
  group: EnvGroup;
  action: FormAction;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  useCloseOnSuccess(state, onDone);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2 border-t border-black/[0.06] bg-black/[0.012] px-4 py-2.5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="groupId" value={group.id} />
      <input
        name="name"
        defaultValue={group.name}
        required
        autoFocus
        aria-label="Group name"
        className={cn(INPUT_SMALL, "h-8 flex-1")}
      />
      <button
        type="submit"
        disabled={pending}
        className={cn(BUTTON_SECONDARY, "h-8 text-xs")}
      >
        {pending ? <Loader2 className="size-3 animate-spin" /> : null}
        Rename
      </button>
      <button
        type="button"
        onClick={onDone}
        className={cn(BUTTON_GHOST, "h-8")}
      >
        Cancel
      </button>
      {state.status === "error" && state.message ? (
        <p role="alert" className="w-full text-[11.5px] text-red-700">
          {state.message}
        </p>
      ) : null}
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
        New group
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/[0.08] bg-white p-3"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input
        name="name"
        required
        autoFocus
        placeholder="Frontend"
        aria-label="Group name"
        className={cn(INPUT_SMALL, "h-9 flex-1")}
      />
      <button
        type="submit"
        disabled={pending}
        className={cn(BUTTON_PRIMARY, "h-9 text-xs")}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Create
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className={cn(BUTTON_GHOST, "h-9")}
      >
        Cancel
      </button>
      {state.status === "error" && state.message ? (
        <p role="alert" className="w-full text-[11.5px] text-red-700">
          {state.message}
        </p>
      ) : null}
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
    <div className="mt-8 border-t border-black/[0.07] pt-6">
      <h3 className="text-[14px] font-semibold tracking-[-0.02em]">
        Stored .env files
      </h3>

      <ul className="mt-4 space-y-1.5">
        {files.map((file) => (
          <EnvFileRow
            key={file.id}
            projectId={projectId}
            file={file}
            actions={actions}
          />
        ))}
        {!files.length ? (
          <li className="text-[12px] text-black/35">No files stored.</li>
        ) : null}
      </ul>

      <form action={formAction} className="mt-4 space-y-2">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="file"
            name="file"
            required
            aria-label="File to store"
            className="block w-full text-[11px] file:mr-3 file:rounded-lg file:border-0 file:bg-black/[0.06] file:px-3 file:py-1.5 file:text-[11px] file:font-medium"
          />
          <FormSelect
            name="groupId"
            ariaLabel="Group"
            triggerClassName={cn(INPUT_SMALL, "h-9")}
            options={[
              { value: "", label: "No group" },
              ...groups.map((group) => ({
                value: group.id,
                label: group.name,
              })),
            ]}
          />
          <button
            type="submit"
            disabled={pending}
            className={cn(BUTTON_SECONDARY, "h-9 text-xs")}
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            Store
          </button>
        </div>
        <p className="text-[11.5px] text-black/40">
          A whole file is every secret at once, so it stays owner only and
          cannot be shared per variable.
        </p>
        <Feedback state={state} />
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
  const [deleteState, deleteAction, deleting] = useActionState(
    actions.deleteFile,
    IDLE_FORM,
  );
  const deleteRef = useRef<HTMLFormElement>(null);

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl border border-black/[0.07] bg-white px-3 py-2">
      <code className="min-w-0 flex-1 truncate font-mono text-[12px]">
        {file.fileName}
      </code>
      <span className="shrink-0 text-[10.5px] text-black/35">
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
          Open
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

      <form action={deleteAction} ref={deleteRef} className="shrink-0">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="fileId" value={file.id} />
        <ConfirmAction
          label={<Trash2 className="size-3.5" />}
          question={`Delete ${file.fileName}?`}
          confirmLabel="Delete"
          pending={deleting}
          onConfirm={() => deleteRef.current?.requestSubmit()}
          className={cn(ICON_BUTTON, "hover:text-red-700")}
        />
      </form>

      {state.status === "error" && state.message ? (
        <p role="alert" className="w-full text-[11.5px] text-red-700">
          {state.message}
        </p>
      ) : null}
      {deleteState.status === "error" && deleteState.message ? (
        <p role="alert" className="w-full text-[11.5px] text-red-700">
          {deleteState.message}
        </p>
      ) : null}
    </li>
  );
}

function EmptyLine({ text, action }: { text: string; action: string | null }) {
  return (
    <p className="text-[12.5px] text-black/40">
      {text}
      {action ? ` ${action}` : ""}
    </p>
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
