"use client";

import { useActionState, useState, useTransition } from "react";
import { Archive, ArchiveRestore, Loader2, Send, Trash2 } from "lucide-react";
import {
  deleteTeamMember,
  setTeamMemberArchived,
  type InviteDraft,
} from "@/app/(admin)/team/actions";
import { ConfirmAction, Modal } from "@/components/admin/projects/modal";
import { InviteComposer } from "@/components/admin/team/invite-composer";
import { StateBadge } from "@/components/admin/team/team-list";
import type { TeamPerson } from "@/data/team";
import { formatDate } from "@/lib/projects/format";
import { IDLE_FORM } from "@/lib/projects/form-state";
import { BUTTON_SECONDARY, PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CONFIRM_WORD = "confirm";

export function AccountPanel({
  person,
  draft,
  isSelf,
}: {
  person: TeamPerson;
  draft: InviteDraft;
  isSelf: boolean;
}) {
  const [inviting, setInviting] = useState(false);
  const [switching, startSwitching] = useTransition();
  const [removal, removeAction, removing] = useActionState(
    deleteTeamMember,
    IDLE_FORM,
  );
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const archived = person.state === "archived";
  const confirmed = typed.trim().toLowerCase() === CONFIRM_WORD;

  return (
    <section className={cn(PANEL, "p-5")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[9px] tracking-[0.16em] text-black/55 uppercase">
          Account
        </h2>
        <StateBadge state={person.state} />
      </div>

      <dl className="mt-4 space-y-2.5">
        <Row label="Email" value={person.email ?? "Not recorded"} />
        <Row label="Invited" value={stamp(person.invitedAt)} />
        <Row label="First signed in" value={stamp(person.activatedAt)} />
        <Row label="Projects" value={String(person.projectCount)} />
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {person.email && !archived ? (
          <Button
            variant="admin-secondary"
            size="none"
            type="button"
            onClick={() => setInviting(true)}
            className="h-9 text-xs"
          >
            <Send className="size-3.5" />
            {person.activatedAt
              ? "Send a new password link"
              : person.invitedAt
                ? "Send the invitation again"
                : "Send invitation"}
          </Button>
        ) : null}

        {isSelf ? null : (
          <ConfirmAction
            label={
              <span className="inline-flex items-center gap-1.5">
                {archived ? (
                  <ArchiveRestore className="size-3.5" />
                ) : (
                  <Archive className="size-3.5" />
                )}
                {archived ? "Restore" : "Archive"}
              </span>
            }
            confirmLabel={archived ? "Restore" : "Archive"}
            question={
              archived
                ? `Restore ${person.fullName}? They can sign in again.`
                : `Archive ${person.fullName}? They lose access immediately.`
            }
            pending={switching}
            className={cn(BUTTON_SECONDARY, "h-9 px-3 text-xs")}
            onConfirm={() => {
              const data = new FormData();
              data.set("profileId", person.id);
              data.set("archived", archived ? "0" : "1");
              startSwitching(() => setTeamMemberArchived(data));
            }}
          />
        )}

        {isSelf ? null : (
          <Button
            variant="admin-danger"
            size="none"
            type="button"
            onClick={() => {
              setTyped("");
              setConfirming(true);
            }}
            className="h-9 px-3 text-xs"
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        )}
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Delete ${person.fullName}`}
      >
        <form action={removeAction} className="space-y-4">
          <input type="hidden" name="profileId" value={person.id} />
          <input type="hidden" name="force" value="1" />

          <p className="text-[13px] leading-6 text-black/60">
            Their record, employment details, documents and sign-in are erased.
            This cannot be undone.
          </p>

          {person.deleteBlocker ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] leading-5 text-amber-900">
              {person.deleteBlocker.charAt(0).toUpperCase() +
                person.deleteBlocker.slice(1)}
              . That work stays on the platform and moves to your name.
            </p>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-[12px] text-black/55">
              Type{" "}
              <span className="font-mono font-semibold text-black/75">
                {CONFIRM_WORD}
              </span>{" "}
              to continue
            </span>
            <Input
              variant="admin"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoFocus
              className={cn("h-10")}
            />
          </label>

          {removal.status === "error" && removal.message ? (
            <p role="alert" className="text-[12px] text-red-700">
              {removal.message}
            </p>
          ) : null}

          <Button
            variant="admin-danger"
            size="none"
            type="submit"
            disabled={!confirmed || removing}
            className={cn(
              "h-10 w-full text-sm transition-colors",
              "disabled:cursor-not-allowed",
              "disabled:border-red-200/80",
              "disabled:bg-red-50",
              "disabled:text-red-300",
              "disabled:opacity-100",
              "disabled:shadow-none",
              "disabled:hover:bg-red-50",
              "disabled:hover:text-red-300",
              "disabled:hover:border-red-200/80",
              "disabled:hover:shadow-none",
            )}
          >
            {removing ? <Loader2 className="size-4 animate-spin" /> : null}
            Delete permanently
          </Button>
        </form>
      </Modal>

      <Modal
        open={inviting}
        onClose={() => setInviting(false)}
        title={`Email ${person.fullName}`}
      >
        <InviteComposer draft={draft} onDone={() => setInviting(false)} />
      </Modal>
    </section>
  );
}

function stamp(value: string | null) {
  if (!value) return "Not yet";
  return formatDate(value.slice(0, 10));
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11.5px] text-black/60">{label}</dt>
      <dd className="min-w-0 truncate text-[12.5px] text-black/75">{value}</dd>
    </div>
  );
}
