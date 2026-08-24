"use client";

import { useActionState, useState, useTransition } from "react";
import { Archive, ArchiveRestore, Loader2, Trash2 } from "lucide-react";
import {
  deleteClientAccount,
  setClientAccountArchived,
} from "@/app/(admin)/clients/actions";
import { ConfirmAction } from "@/components/admin/projects/modal";
import { ClientStateBadge } from "@/components/admin/clients/client-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClientAccount } from "@/data/clients";
import { formatDate } from "@/lib/projects/format";
import { IDLE_FORM } from "@/lib/projects/form-state";
import { BUTTON_SECONDARY, PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CONFIRM_WORD = "confirm";

export function AccountsPanel({
  clientId,
  accounts,
}: {
  clientId: string;
  accounts: ClientAccount[];
}) {
  return (
    <section className={cn(PANEL, "p-5")}>
      <h2 className="font-mono text-[9px] tracking-[0.16em] text-black/55 uppercase">
        Portal access
      </h2>

      {accounts.length ? (
        <ul className="mt-4 space-y-2">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              clientId={clientId}
              account={account}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[12px] text-black/55">
          Nobody has been invited to this client&rsquo;s projects yet.
        </p>
      )}
    </section>
  );
}

function AccountRow({
  clientId,
  account,
}: {
  clientId: string;
  account: ClientAccount;
}) {
  const [switching, startSwitching] = useTransition();
  const [removal, removeAction, removing] = useActionState(
    deleteClientAccount,
    IDLE_FORM,
  );
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const archived = account.state === "archived";
  const confirmed = typed.trim().toLowerCase() === CONFIRM_WORD;

  return (
    <li className="rounded-xl border border-black/[0.07] bg-white px-3.5 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-black/80">
            {account.fullName}
          </p>
          <p className="truncate text-[11px] text-black/60">{account.email}</p>
          <p className="mt-1 truncate text-[11px] text-black/55">
            {account.projects.map((project) => project.name).join(", ")}
          </p>
        </div>
        <ClientStateBadge state={account.state} />
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px]">
        <Pair label="Invited" value={stamp(account.invitedAt)} />
        <Pair label="Set password" value={stamp(account.activatedAt)} />
        <Pair label="Last sign-in" value={stamp(account.lastSignInAt)} />
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
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
              ? `Restore ${account.fullName}? They can sign in again.`
              : `Archive ${account.fullName}? They lose portal access immediately.`
          }
          pending={switching}
          className={cn(BUTTON_SECONDARY, "h-8 px-2.5 text-xs")}
          onConfirm={() => {
            const data = new FormData();
            data.set("clientUserId", account.id);
            data.set("clientId", clientId);
            data.set("archived", archived ? "0" : "1");
            startSwitching(() => setClientAccountArchived(data));
          }}
        />

        <Button
          variant="admin-danger"
          size="none"
          type="button"
          onClick={() => {
            setTyped("");
            setConfirming(true);
          }}
          className="h-8 px-2.5 text-xs"
        >
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      </div>

      {removal.status === "error" && removal.message ? (
        <p role="alert" className="mt-2 text-[12px] text-red-700">
          {removal.message}
        </p>
      ) : null}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="bg-gd-panel border-black/[0.08] text-black sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px] tracking-[-0.025em]">
              Delete {account.fullName}
            </DialogTitle>
          </DialogHeader>

          <form action={removeAction} className="space-y-4">
            <input type="hidden" name="clientUserId" value={account.id} />
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="force" value="1" />

            <p className="text-[13px] leading-6 text-black/60">
              Their portal account, every project they were invited to and their
              sign-in are erased. This cannot be undone.
            </p>

            {account.deleteBlocker ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] leading-5 text-amber-900">
                {account.deleteBlocker.charAt(0).toUpperCase() +
                  account.deleteBlocker.slice(1)}
                . What they wrote stays on the project without their name on it.
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
                className={cn("h-10")}
              />
            </label>

            <Button
              variant="admin-danger"
              size="none"
              type="submit"
              disabled={!confirmed || removing}
              className={cn(
                "h-10 w-full text-sm disabled:cursor-not-allowed disabled:bg-red-50 disabled:text-red-300 disabled:opacity-100 disabled:shadow-none",
              )}
            >
              {removing ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete permanently
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </li>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-black/55">{label}</dt>
      <dd className="text-black/70">{value}</dd>
    </div>
  );
}

function stamp(value: string | null) {
  if (!value) return "Not yet";
  return formatDate(value.slice(0, 10));
}
