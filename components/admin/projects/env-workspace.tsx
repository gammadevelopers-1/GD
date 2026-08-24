"use client";

import { useState } from "react";
import {
  Check,
  ChevronRight,
  Copy,
  FolderPlus,
  KeyRound,
  Lock,
  MoreHorizontal,
  Move,
  Pencil,
  Plus,
  Share2,
  Shield,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import type {
  EnvCandidate,
  EnvGroupRow,
  EnvVersion,
  EnvWorkspace as Workspace,
  MainEntryRow,
  SharedEntry,
} from "@/data/env-workspace";
import type { CopyResult } from "@/app/(admin)/projects/env-actions";
import { FOCUS_RING, PANEL, TONE_SOFT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/admin/empty-state";
import {
  ConfirmDialog,
  type FormAction,
  GroupDialog,
  MoveDialog,
  ShareDialog,
  SourceDialog,
  UploadDialog,
  VariableDialog,
} from "./env-dialogs";

export type EnvWorkspaceActions = {
  addVariable: FormAction;
  deleteVariable: FormAction;
  moveVariable: FormAction;
  createMainGroup: FormAction;
  renameMainGroup: FormAction;
  createVersionGroup: FormAction;
  renameVersionGroup: FormAction;
  deleteVersionGroup: FormAction;
  upload: FormAction;
  adopt: FormAction;
  share: FormAction;
  deleteVersion: FormAction;
  copy: (credentialId: string) => Promise<CopyResult>;
};

type Dialog =
  | { kind: "variable"; groupId: string | null; groups: EnvGroupRow[] }
  | { kind: "group"; scope: "main" | "version"; group?: EnvGroupRow }
  | { kind: "move"; credentialId: string; key: string; groups: EnvGroupRow[] }
  | { kind: "upload"; groupId: string; keys: string[] }
  | { kind: "source"; entry?: MainEntryRow; candidate?: EnvCandidate }
  | { kind: "share"; entry: MainEntryRow | null }
  | {
      kind: "confirm";
      title: string;
      description: string;
      confirm: string;
      hidden: Record<string, string>;
      action: FormAction;
    }
  | null;

export function EnvWorkspace({
  projectId,
  workspace,
  members,
  isOwner,
  viewerId,
  actions,
}: {
  projectId: string;
  workspace: Workspace;
  members: { id: string; name: string }[];
  isOwner: boolean;
  viewerId: string;
  actions: EnvWorkspaceActions;
}) {
  const myVersion = workspace.versions.find((version) => version.isViewer);
  const [view, setView] = useState<string>(isOwner ? "main" : viewerId);
  const [dialog, setDialog] = useState<Dialog>(null);

  const mainGroupId = workspace.mainGroups[0]?.id ?? null;
  const active = workspace.versions.find(
    (version) => version.profileId === view,
  );
  const isMain = view === "main";

  return (
    <>
      <section className={cn(PANEL, "px-5 py-5 sm:px-6")}>
        <div className="flex items-center gap-2.5">
          <KeyRound className="size-4 text-black/45" />
          <h2 className="text-[15.5px] font-semibold tracking-[-0.025em]">
            Environment variables
          </h2>
        </div>

        {isOwner ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <VersionChip
              active={isMain}
              onClick={() => setView("main")}
              count={workspace.mainTotal}
              label="Main"
              badge={
                <span className="grid size-5 place-items-center rounded-md bg-gd-green/18 text-gd-green-deep">
                  <Shield className="size-3" />
                </span>
              }
            />
            {workspace.versions.map((version) => (
              <VersionChip
                key={version.profileId}
                active={view === version.profileId}
                onClick={() => setView(version.profileId)}
                count={version.total}
                label={`${version.name.split(" ")[0]}${version.isViewer ? " · you" : ""}`}
                badge={
                  <span className="grid size-5 place-items-center rounded-md bg-gd-panel-dark font-mono text-[8.5px] font-semibold text-gd-primary">
                    {version.initials}
                  </span>
                }
              />
            ))}
          </div>
        ) : null}

        <div className="my-4 h-px bg-black/[0.07]" />

        {isMain ? (
          <MainPane
            workspace={workspace}
            onDialog={setDialog}
            actions={actions}
          />
        ) : active ? (
          <VersionPane
            version={active}
            canEdit={active.profileId === viewerId}
            isOwner={isOwner}
            projectId={projectId}
            onDialog={setDialog}
            actions={actions}
          />
        ) : (
          <EmptyState
            icon={KeyRound}
            title="No version yet"
            description="Nothing has been added to this version."
          />
        )}
      </section>

      {!isOwner && myVersion ? null : null}

      {!isOwner ? (
        <SharedWithMe entries={workspace.sharedWithMe} copy={actions.copy} />
      ) : null}

      {dialog?.kind === "variable" ? (
        <VariableDialog
          groupId={dialog.groupId}
          groups={dialog.groups}
          action={actions.addVariable}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog?.kind === "group" ? (
        <GroupDialog
          projectId={projectId}
          group={dialog.group}
          action={
            dialog.scope === "main"
              ? dialog.group
                ? actions.renameMainGroup
                : actions.createMainGroup
              : dialog.group
                ? actions.renameVersionGroup
                : actions.createVersionGroup
          }
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog?.kind === "move" ? (
        <MoveDialog
          credentialId={dialog.credentialId}
          variableKey={dialog.key}
          groups={dialog.groups}
          action={actions.moveVariable}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog?.kind === "upload" ? (
        <UploadDialog
          groupId={dialog.groupId}
          existingKeys={dialog.keys}
          action={actions.upload}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog?.kind === "source" ? (
        <SourceDialog
          entry={dialog.entry}
          candidate={dialog.candidate}
          mainGroupId={mainGroupId}
          mainGroups={workspace.mainGroups}
          action={actions.adopt}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog?.kind === "share" ? (
        <ShareDialog
          projectId={projectId}
          entry={dialog.entry}
          members={members}
          action={actions.share}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog?.kind === "confirm" ? (
        <ConfirmDialog
          title={dialog.title}
          description={dialog.description}
          confirm={dialog.confirm}
          hidden={dialog.hidden}
          action={dialog.action}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </>
  );
}

function VersionChip({
  active,
  onClick,
  label,
  count,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  badge: React.ReactNode;
}) {
  return (
    <Button
      variant="bare"
      size="none"
      onClick={onClick}
      className={cn(
        "inline-flex h-8.5 items-center gap-2 rounded-xl border px-2.75 text-[12.5px] font-medium transition duration-150",
        active
          ? "border-gd-green/55 bg-gd-green/[0.08] text-gd-green-ink"
          : "border-black/10 bg-white text-black/70 hover:border-black/20",
        FOCUS_RING,
      )}
    >
      {badge}
      {label}
      <span className="font-mono text-[9px] text-black/40 tabular-nums">
        {count}
      </span>
    </Button>
  );
}

function PaneHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-[14.5px] font-semibold tracking-[-0.02em]">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-black/55">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function MainPane({
  workspace,
  onDialog,
  actions,
}: {
  workspace: Workspace;
  onDialog: (dialog: Dialog) => void;
  actions: EnvWorkspaceActions;
}) {
  return (
    <div>
      <PaneHeader
        title="Main environment"
        subtitle="The shared, resolved env that gets deployed."
      >
        <Button
          variant="admin-secondary"
          size="admin-sm"
          onClick={() => onDialog({ kind: "share", entry: null })}
        >
          <Share2 className="size-4" />
          Share with a member
        </Button>
        <Button
          variant="admin-secondary"
          size="admin-sm"
          onClick={() => onDialog({ kind: "group", scope: "main" })}
        >
          <FolderPlus className="size-4" />
          New group
        </Button>
      </PaneHeader>

      <div className="mt-4">
        {workspace.mainGroups.map((group) => (
          <div
            key={group.id}
            className="mb-3 overflow-hidden rounded-2xl border border-black/[0.07] bg-white"
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-[13.5px] font-semibold tracking-[-0.015em]">
                  {group.name}
                </span>
                <span className="rounded-full bg-black/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-black/40 tabular-nums">
                  {group.entries.length}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="admin-icon"
                    size="none"
                    aria-label={`Actions for ${group.name}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  <DropdownMenuLabel>{group.name}</DropdownMenuLabel>
                  <DropdownMenuItem
                    onSelect={() =>
                      onDialog({
                        kind: "group",
                        scope: "main",
                        group: { id: group.id, name: group.name, variables: [] },
                      })
                    }
                  >
                    <Pencil className="size-3.5" />
                    Rename group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {group.entries.length ? (
              <ul className="border-t border-black/[0.06]">
                {group.entries.map((entry) => (
                  <MainRow
                    key={entry.credentialId}
                    entry={entry}
                    onDialog={onDialog}
                    copy={actions.copy}
                  />
                ))}
              </ul>
            ) : (
              <p className="px-3.5 py-3.5 text-xs text-black/45">
                No keys here yet — pull one from a version below.
              </p>
            )}
          </div>
        ))}
      </div>

      {workspace.candidates.length ? (
        <div className="mt-2">
          <p className="mb-2.5 font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
            In member versions · not in main yet
          </p>
          <ul className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
            {workspace.candidates.map((candidate) => (
              <li
                key={candidate.key}
                className="flex items-center gap-3 border-b border-black/[0.05] px-3.5 py-2.5 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <code className="block font-mono text-xs break-all text-black/85">
                    {candidate.key}
                  </code>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {candidate.holders.map((holder) => (
                      <span
                        key={holder.credentialId}
                        title={holder.name}
                        className="grid size-4.5 place-items-center rounded bg-gd-panel-dark font-mono text-[7.5px] font-semibold text-gd-primary"
                      >
                        {holder.initials}
                      </span>
                    ))}
                    {candidate.holders.length > 1 ? (
                      <AgreementChip
                        count={candidate.holders.length}
                        agree={candidate.agree}
                      />
                    ) : null}
                  </div>
                </div>
                <Button
                  variant="admin-secondary"
                  size="admin-sm"
                  onClick={() => onDialog({ kind: "source", candidate })}
                >
                  <Plus className="size-4" />
                  Add to main
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!workspace.mainGroups.length && !workspace.candidates.length ? (
        <EmptyState
          icon={Shield}
          title="Main is empty"
          description="When members add variables to their versions, they appear here to pull into main."
        />
      ) : null}
    </div>
  );
}

function AgreementChip({ count, agree }: { count: number; agree: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-[0.04em]",
        agree ? TONE_SOFT.ok : TONE_SOFT.warning,
      )}
    >
      <Users className="size-2.5" />
      {count} copies · {agree ? "identical" : "differ"}
    </span>
  );
}

function CopyValueButton({
  credentialId,
  copy,
}: {
  credentialId: string;
  copy: (id: string) => Promise<CopyResult>;
}) {
  const [done, setDone] = useState(false);

  return (
    <Button
      variant="admin-secondary"
      size="admin-xs"
      onClick={async () => {
        const result = await copy(credentialId);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        try {
          await navigator.clipboard.writeText(result.value);
          setDone(true);
          toast.success("Copied · access logged.");
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("That value could not be copied.");
        }
      }}
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {done ? "Copied" : "Copy"}
    </Button>
  );
}

function MainRow({
  entry,
  onDialog,
  copy,
}: {
  entry: MainEntryRow;
  onDialog: (dialog: Dialog) => void;
  copy: (id: string) => Promise<CopyResult>;
}) {
  return (
    <li className="flex items-center gap-3 border-b border-black/[0.05] px-3.5 py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <code className="block font-mono text-xs break-all text-black/85">
          {entry.key}
        </code>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {entry.sourceName ? (
            <span className="inline-flex items-center gap-1.5 text-[10.5px] text-black/50">
              <span className="grid size-4.5 place-items-center rounded bg-gd-panel-dark font-mono text-[7.5px] font-semibold text-gd-primary">
                {entry.sourceInitials}
              </span>
              from <b className="font-semibold text-black/70">
                {entry.sourceName.split(" ")[0]}
              </b>
              &apos;s version
            </span>
          ) : (
            <span className="font-mono text-[10px] text-black/40">
              no source recorded
            </span>
          )}
          <span className="font-mono text-[10px] text-black/35">
            {entry.fingerprint}
          </span>
          {entry.holders.length > 1 ? (
            <Button
              variant="bare"
              size="none"
              onClick={() => onDialog({ kind: "source", entry })}
              className={cn("cursor-pointer rounded-full", FOCUS_RING)}
            >
              <AgreementChip
                count={entry.holders.length}
                agree={entry.agree}
              />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <CopyValueButton credentialId={entry.credentialId} copy={copy} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="admin-icon"
              size="none"
              aria-label={`Actions for ${entry.key}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuLabel>{entry.key}</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => onDialog({ kind: "source", entry })}
            >
              <Move className="size-3.5" />
              Change source…
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDialog({ kind: "share", entry })}>
              <Share2 className="size-3.5" />
              Share with a member…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

function VersionPane({
  version,
  canEdit,
  isOwner,
  projectId,
  onDialog,
  actions,
}: {
  version: EnvVersion;
  canEdit: boolean;
  isOwner: boolean;
  projectId: string;
  onDialog: (dialog: Dialog) => void;
  actions: EnvWorkspaceActions;
}) {
  const firstGroup = version.groups[0]?.id ?? null;

  return (
    <div>
      <PaneHeader
        title={canEdit ? "My version" : `${version.name}'s version`}
        subtitle={
          canEdit
            ? "Your private working copy. Only you and project owners can see it."
            : `Read-only. Pull values into main, or delete the version.`
        }
      >
        {canEdit ? (
          <>
            <Button
              variant="admin-cta"
              size="admin-sm"
              data-button-fill
              onClick={() =>
                onDialog({
                  kind: "variable",
                  groupId: firstGroup,
                  groups: version.groups,
                })
              }
            >
              <Plus className="size-4" />
              Add variable
            </Button>
            {firstGroup ? (
              <Button
                variant="admin-secondary"
                size="admin-sm"
                onClick={() =>
                  onDialog({
                    kind: "upload",
                    groupId: firstGroup,
                    keys: version.groups.flatMap((group) =>
                      group.variables.map((variable) => variable.key),
                    ),
                  })
                }
              >
                <Upload className="size-4" />
                Upload .env
              </Button>
            ) : null}
            <Button
              variant="admin-secondary"
              size="admin-sm"
              onClick={() => onDialog({ kind: "group", scope: "version" })}
            >
              <FolderPlus className="size-4" />
              New group
            </Button>
          </>
        ) : isOwner ? (
          <Button
            variant="admin-danger"
            size="admin-sm"
            onClick={() =>
              onDialog({
                kind: "confirm",
                title: "Delete this version?",
                description: `${version.name}'s entire version (${version.total} variables) is removed. Main keeps its own values but loses the provenance for any key sourced here.`,
                confirm: "Delete version",
                hidden: { projectId, profileId: version.profileId },
                action: actions.deleteVersion,
              })
            }
          >
            <Trash2 className="size-4" />
            Delete version
          </Button>
        ) : null}
      </PaneHeader>

      {canEdit ? (
        <p className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-gd-green-edge/22 bg-gd-green/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-gd-green-ink">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <b className="font-semibold">Private to you.</b> Owners compare
            everyone&apos;s versions and choose which value the shared main uses
            — your copy is never edited for you.
          </span>
        </p>
      ) : null}

      <div className="mt-4">
        {version.groups.length ? (
          version.groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              version={version}
              canEdit={canEdit}
              projectId={projectId}
              onDialog={onDialog}
              actions={actions}
            />
          ))
        ) : (
          <EmptyState
            icon={KeyRound}
            title="This version is empty"
            description={
              canEdit
                ? "Add a variable or paste an .env block to import several at once."
                : "Nothing has been added to this version yet."
            }
          />
        )}
      </div>
    </div>
  );
}

function GroupCard({
  group,
  version,
  canEdit,
  projectId,
  onDialog,
  actions,
}: {
  group: EnvGroupRow;
  version: EnvVersion;
  canEdit: boolean;
  projectId: string;
  onDialog: (dialog: Dialog) => void;
  actions: EnvWorkspaceActions;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <Button
          variant="bare"
          size="none"
          onClick={() => setOpen((was) => !was)}
          className={cn("flex min-w-0 cursor-pointer items-center gap-2", FOCUS_RING)}
        >
          <ChevronRight
            className={cn(
              "size-3.5 text-black/45 transition-transform duration-200",
              open && "rotate-90",
            )}
          />
          <span className="text-[13.5px] font-semibold tracking-[-0.015em]">
            {group.name}
          </span>
          <span className="rounded-full bg-black/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-black/40 tabular-nums">
            {group.variables.length}
          </span>
        </Button>

        {canEdit ? (
          <div className="flex items-center gap-1">
            <Button
              variant="admin-ghost"
              size="admin-sm"
              onClick={() =>
                onDialog({
                  kind: "variable",
                  groupId: group.id,
                  groups: version.groups,
                })
              }
            >
              <Plus className="size-4" />
              Add
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="admin-icon"
                  size="none"
                  aria-label={`Actions for ${group.name}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuLabel>{group.name}</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() =>
                    onDialog({
                      kind: "upload",
                      groupId: group.id,
                      keys: group.variables.map((variable) => variable.key),
                    })
                  }
                >
                  <Upload className="size-3.5" />
                  Upload .env to group
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    onDialog({ kind: "group", scope: "version", group })
                  }
                >
                  <Pencil className="size-3.5" />
                  Rename group
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() =>
                    onDialog({
                      kind: "confirm",
                      title: "Delete group?",
                      description: `“${group.name}” and its ${group.variables.length} variable(s) are removed from your version.`,
                      confirm: "Delete group",
                      hidden: { projectId, groupId: group.id },
                      action: actions.deleteVersionGroup,
                    })
                  }
                >
                  <Trash2 className="size-3.5" />
                  Delete group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>

      {open ? (
        group.variables.length ? (
          <ul className="border-t border-black/[0.06]">
            {group.variables.map((variable) => (
              <li
                key={variable.id}
                className="flex items-center gap-3 border-b border-black/[0.05] px-3.5 py-2.5 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <code className="block font-mono text-xs break-all text-black/85">
                    {variable.key}
                  </code>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-black/35">
                      {variable.fingerprint}
                    </span>
                    {variable.note ? (
                      <span className="text-[11px] text-black/45">
                        {variable.note}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <CopyValueButton
                    credentialId={variable.id}
                    copy={actions.copy}
                  />
                  {canEdit ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="admin-icon"
                          size="none"
                          aria-label={`Actions for ${variable.key}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-52">
                        <DropdownMenuLabel>{variable.key}</DropdownMenuLabel>
                        <DropdownMenuItem
                          disabled={version.groups.length < 2}
                          onSelect={() =>
                            onDialog({
                              kind: "move",
                              credentialId: variable.id,
                              key: variable.key,
                              groups: version.groups.filter(
                                (row) => row.id !== group.id,
                              ),
                            })
                          }
                        >
                          <Move className="size-3.5" />
                          Move to group…
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() =>
                            onDialog({
                              kind: "confirm",
                              title: "Delete variable?",
                              description: `${variable.key} is removed from your version.`,
                              confirm: "Delete",
                              hidden: {
                                projectId,
                                credentialId: variable.id,
                              },
                              action: actions.deleteVariable,
                            })
                          }
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-black/[0.06] px-3.5 py-3.5 text-xs text-black/45">
            No variables in this group yet.
          </p>
        )
      ) : null}
    </div>
  );
}

function SharedWithMe({
  entries,
  copy,
}: {
  entries: SharedEntry[];
  copy: (id: string) => Promise<CopyResult>;
}) {
  return (
    <section className={cn(PANEL, "px-5 py-5 sm:px-6")}>
      <div className="flex items-center gap-2.5">
        <Share2 className="size-4 text-black/45" />
        <h2 className="text-[15.5px] font-semibold tracking-[-0.025em]">
          Shared with me
        </h2>
        <span className="rounded-full bg-black/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-black/40 tabular-nums">
          {entries.length}
        </span>
      </div>

      {entries.length ? (
        <ul className="mt-4 overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
          {entries.map((entry) => (
            <li
              key={entry.credentialId}
              className="flex items-center gap-3 border-b border-black/[0.05] px-3.5 py-2.5 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <code className="block font-mono text-xs break-all text-black/85">
                  {entry.key}
                </code>
                {entry.sourceName ? (
                  <span className="mt-1 inline-flex items-center gap-1.5 text-[10.5px] text-black/50">
                    <Shield className="size-3" />
                    shared from{" "}
                    <b className="font-semibold text-black/70">
                      {entry.sourceName.split(" ")[0]}
                    </b>
                    &apos;s copy
                  </span>
                ) : null}
              </div>
              <CopyValueButton credentialId={entry.credentialId} copy={copy} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3">
          <EmptyState
            icon={Shield}
            title="Nothing shared with you yet"
            description="When an owner shares a main value with you, it appears here to copy — never as visible text."
          />
        </div>
      )}
    </section>
  );
}
