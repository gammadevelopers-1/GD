"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Type,
  X,
} from "lucide-react";
import type { ProjectLink } from "@/data/project-links";
import { LINK_LABEL_MAX, linkDisplay, linkHref } from "@/lib/projects/links";
import { IDLE_FORM, type SimpleFormState } from "@/lib/projects/form-state";
import { FOCUS_RING, PANEL, REVEAL_ON_HOVER } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCloseOnSuccess } from "./use-close-on-success";

type FormAction = (
  state: SimpleFormState,
  formData: FormData,
) => Promise<SimpleFormState>;

export type LinkActions = {
  setLink: FormAction;
  renameLink: FormAction;
  clearLink: FormAction;
  addLink: FormAction;
  deleteLink: FormAction;
};

type Editing = { id: string; field: "value" | "label" } | null;

function useToastOnSettle(state: SimpleFormState) {
  useEffect(() => {
    if (state.status === "success" && state.message)
      toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);
}

export function WorkingLinks({
  projectId,
  links,
  canManage,
  actions,
}: {
  projectId: string;
  links: ProjectLink[];
  canManage: boolean;
  actions: LinkActions;
}) {
  const [editing, setEditing] = useState<Editing>(null);
  const [adding, setAdding] = useState(false);

  return (
    <section className={cn(PANEL, "px-5 py-5 sm:px-6")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link2 className="size-4 text-black/45" />
          <h2 className="text-[15.5px] font-semibold tracking-[-0.025em]">
            Working links
          </h2>
        </div>
        {canManage ? (
          <Button
            variant="admin-secondary"
            size="admin-sm"
            onClick={() => setAdding((open) => !open)}
          >
            <Plus className="size-4" />
            Add link
          </Button>
        ) : null}
      </div>

      {adding ? (
        <AddLinkForm
          projectId={projectId}
          action={actions.addLink}
          onDone={() => setAdding(false)}
        />
      ) : null}

      <div className="mt-1.5">
        {links.map((row) => (
          <LinkRow
            key={row.id}
            row={row}
            canManage={canManage}
            editing={editing}
            onEdit={setEditing}
            actions={actions}
          />
        ))}
      </div>
    </section>
  );
}

function LinkRow({
  row,
  canManage,
  editing,
  onEdit,
  actions,
}: {
  row: ProjectLink;
  canManage: boolean;
  editing: Editing;
  onEdit: (next: Editing) => void;
  actions: LinkActions;
}) {
  const editingThis = editing?.id === row.id;

  return (
    <div className="group grid grid-cols-1 items-center gap-3 border-b border-black/[0.06] px-1.5 py-3 last:border-b-0 sm:grid-cols-[230px_1fr_auto] sm:gap-4">
      {editingThis && editing.field === "label" ? (
        <LabelForm
          row={row}
          action={actions.renameLink}
          onDone={() => onEdit(null)}
        />
      ) : (
        <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-black/60">
          <span className="truncate">{row.label}</span>
          {!row.slug ? (
            <span className="bg-gd-green/12 text-gd-green-deep rounded-full px-1.5 py-0.5 font-mono text-[8px] tracking-[0.1em] uppercase">
              Custom
            </span>
          ) : null}
        </div>
      )}

      {editingThis && editing.field === "value" ? (
        <ValueForm
          row={row}
          action={actions.setLink}
          onDone={() => onEdit(null)}
        />
      ) : (
        <div className="flex min-w-0 items-center gap-2">
          {row.value ? (
            row.kind === "notes" ? (
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-black/70">
                {row.value}
              </p>
            ) : (
              <a
                href={linkHref(row.value)}
                target="_blank"
                rel="noreferrer noopener"
                className="text-gd-green-deep inline-flex min-w-0 items-center gap-1.5 text-[13px] font-semibold hover:underline"
              >
                <span className="truncate">{linkDisplay(row.value)}</span>
                <ExternalLink className="size-3.5 shrink-0" />
              </a>
            )
          ) : canManage ? (
            <Button
              variant="bare"
              size="none"
              onClick={() => onEdit({ id: row.id, field: "value" })}
              className={cn(
                "hover:border-brand/60 hover:bg-brand/[0.06] hover:text-gd-green-deep inline-flex h-[30px] items-center gap-1.5 rounded-lg border border-dashed border-black/20 px-2.5 text-xs text-black/50 transition duration-150",
                FOCUS_RING,
              )}
            >
              <Plus className="size-3.5" />
              {row.kind === "notes" ? "Add notes" : "Add URL"}
            </Button>
          ) : (
            <span className="font-mono text-[10.5px] text-black/40">
              Not added
            </span>
          )}
        </div>
      )}

      {!editingThis ? (
        <div
          className={cn(
            "flex items-center justify-end gap-1",
            canManage ? REVEAL_ON_HOVER : null,
          )}
        >
          {row.value && row.kind !== "notes" ? (
            <CopyLinkButton value={linkHref(row.value)} label={row.label} />
          ) : null}
          {canManage ? (
            <RowMenu
              row={row}
              onEdit={onEdit}
              onCopy={() => copyLink(row, () => undefined)}
              actions={actions}
            />
          ) : null}
        </div>
      ) : (
        <span />
      )}
    </div>
  );
}

async function copyLink(row: ProjectLink, onDone: () => void) {
  try {
    await navigator.clipboard.writeText(linkHref(row.value));
    toast.success("Link copied.");
    onDone();
  } catch {
    toast.error("That link could not be copied.");
  }
}

function CopyLinkButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);

  return (
    <Button
      variant="admin-icon"
      size="none"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          toast.success("Link copied.");
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("That link could not be copied.");
        }
      }}
    >
      {done ? (
        <Check className="text-gd-green-deep size-4" />
      ) : (
        <Copy className="size-4" />
      )}
    </Button>
  );
}

function RowMenu({
  row,
  onEdit,
  onCopy,
  actions,
}: {
  row: ProjectLink;
  onEdit: (next: Editing) => void;
  onCopy: () => void;
  actions: LinkActions;
}) {
  const [clearState, clearAction, clearing] = useActionState(
    actions.clearLink,
    IDLE_FORM,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    actions.deleteLink,
    IDLE_FORM,
  );
  useToastOnSettle(clearState);
  useToastOnSettle(deleteState);

  const clearFormId = `clear-link-${row.id}`;
  const deleteFormId = `delete-link-${row.id}`;

  return (
    <>
      <form id={clearFormId} action={clearAction} className="hidden">
        <input type="hidden" name="linkId" value={row.id} />
      </form>
      <form id={deleteFormId} action={deleteAction} className="hidden">
        <input type="hidden" name="linkId" value={row.id} />
      </form>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="admin-icon"
            size="none"
            title="More actions"
            aria-label={`More actions for ${row.label}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem
            onSelect={() => onEdit({ id: row.id, field: "value" })}
          >
            <Pencil className="size-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => onEdit({ id: row.id, field: "label" })}
          >
            <Type className="size-3.5" />
            Rename
          </DropdownMenuItem>
          {row.value && row.kind !== "notes" ? (
            <DropdownMenuItem onSelect={() => onCopy()}>
              <Copy className="size-3.5" />
              Copy
            </DropdownMenuItem>
          ) : null}
          {row.slug ? (
            <DropdownMenuItem
              variant="destructive"
              disabled={clearing || !row.value}
              asChild
            >
              <button type="submit" form={clearFormId} className="w-full">
                <Trash2 className="size-3.5" />
                Delete
              </button>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant="destructive" disabled={deleting} asChild>
              <button type="submit" form={deleteFormId} className="w-full">
                <Trash2 className="size-3.5" />
                Delete
              </button>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function ValueForm({
  row,
  action,
  onDone,
}: {
  row: ProjectLink;
  action: FormAction;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  useToastOnSettle(state);
  useCloseOnSuccess(state, onDone);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <input type="hidden" name="linkId" value={row.id} />
      {row.kind === "notes" ? (
        <Textarea
          name="value"
          variant="admin"
          autoFocus
          rows={3}
          defaultValue={row.value}
          onKeyDown={(event) => {
            if (event.key === "Escape") onDone();
          }}
          className="flex-1 py-2 text-[13px]"
        />
      ) : (
        <Input
          name="value"
          variant="admin"
          autoFocus
          placeholder="https://…"
          defaultValue={row.value}
          onKeyDown={(event) => {
            if (event.key === "Escape") onDone();
          }}
          className="h-9 flex-1 text-[13px]"
        />
      )}
      <Button
        type="button"
        variant="admin-ghost"
        size="admin-sm"
        onClick={onDone}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="admin-cta"
        size="admin-sm"
        disabled={pending}
        data-button-fill
      >
        <Check className="size-3.5" />
        <span className="button-fill-fx__label">Save</span>
      </Button>
    </form>
  );
}

function LabelForm({
  row,
  action,
  onDone,
}: {
  row: ProjectLink;
  action: FormAction;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  useToastOnSettle(state);
  useCloseOnSuccess(state, onDone);

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="linkId" value={row.id} />
      <Input
        name="label"
        variant="admin-sm"
        autoFocus
        maxLength={LINK_LABEL_MAX}
        defaultValue={row.label}
        onKeyDown={(event) => {
          if (event.key === "Escape") onDone();
        }}
        className="h-8 flex-1 text-[13px] font-medium"
      />
      <Button
        type="submit"
        variant="admin-icon"
        size="none"
        disabled={pending}
        aria-label="Save label"
      >
        <Check className="size-4" />
      </Button>
      <Button
        type="button"
        variant="admin-icon"
        size="none"
        onClick={onDone}
        aria-label="Cancel rename"
      >
        <X className="size-4" />
      </Button>
    </form>
  );
}

function AddLinkForm({
  projectId,
  action,
  onDone,
}: {
  projectId: string;
  action: FormAction;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  useToastOnSettle(state);
  useCloseOnSuccess(state, onDone);

  return (
    <form
      action={formAction}
      className="mt-3.5 flex flex-wrap items-end gap-2.5 rounded-2xl border border-black/[0.07] bg-white p-3.5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <label className="flex min-w-50 flex-[1_1_200px] flex-col gap-1.5">
        <span className="text-xs font-medium text-black/70">Link name</span>
        <Input
          name="label"
          variant="admin"
          autoFocus
          required
          maxLength={LINK_LABEL_MAX}
          placeholder="Analytics dashboard"
          className="h-9 text-[13px]"
        />
      </label>
      <label className="flex min-w-60 flex-[2_1_280px] flex-col gap-1.5">
        <span className="text-xs font-medium text-black/70">URL</span>
        <Input
          name="value"
          variant="admin"
          placeholder="https://…"
          className="h-9 text-[13px]"
        />
      </label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="admin-ghost"
          size="admin-sm"
          onClick={onDone}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="admin-cta"
          size="admin-sm"
          disabled={pending}
          data-button-fill
        >
          <Plus className="size-3.5" />
          <span className="button-fill-fx__label">Add</span>
        </Button>
      </div>
    </form>
  );
}
