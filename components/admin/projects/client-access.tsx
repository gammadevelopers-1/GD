"use client";

import { useActionState, useState, useTransition } from "react";
import { AlertCircle, KeyRound, Loader2, Trash2 } from "lucide-react";
import type { ClientGrant } from "@/data/client-access";
import type { ShareState } from "@/app/(admin)/projects/client-actions";
import { Issued } from "@/components/admin/projects/issued-access";
import { ConfirmAction } from "@/components/admin/projects/modal";
import { initials } from "@/lib/projects/format";
import { absoluteTime, timeAgo } from "@/lib/portal/format";
import { FOCUS_RING, ICON_BUTTON_DANGER } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const IDLE: ShareState = { status: "idle", message: null };

export type ClientAccessActions = {
  regenerate: (state: ShareState, formData: FormData) => Promise<ShareState>;
  setEditing: (formData: FormData) => Promise<void>;
  revoke: (formData: FormData) => Promise<void>;
};

export function ClientAccessPanel({
  publicId,
  grants,
  actions,
}: {
  publicId: string;
  grants: ClientGrant[];
  actions: ClientAccessActions;
}) {
  if (!grants.length) return null;

  return (
    <section className="overflow-hidden rounded-[20px] border border-black/[0.07] bg-white/70">
      <header className="flex items-baseline gap-2 px-5 pt-4 pb-3">
        <h2 className="text-[11px] font-semibold tracking-[0.06em] uppercase">
          Client access
        </h2>
      </header>

      <ul className="divide-y divide-black/[0.05] border-t border-black/[0.05]">
        {grants.map((grant) => (
          <GrantRow
            key={grant.id}
            grant={grant}
            publicId={publicId}
            actions={actions}
          />
        ))}
      </ul>
    </section>
  );
}

function GrantRow({
  grant,
  publicId,
  actions,
}: {
  grant: ClientGrant;
  publicId: string;
  actions: ClientAccessActions;
}) {
  const [state, regenerate, regenerating] = useActionState(
    actions.regenerate,
    IDLE,
  );
  const [dismissed, setDismissed] = useState(false);
  const [pending, startTransition] = useTransition();

  const issued = dismissed ? undefined : state.issued;

  function toggleEditing(enabled: boolean) {
    const data = new FormData();
    data.set("accessId", grant.id);
    data.set("enabled", enabled ? "1" : "0");
    startTransition(() => actions.setEditing(data));
  }

  function revoke() {
    const data = new FormData();
    data.set("accessId", grant.id);
    startTransition(() => actions.revoke(data));
  }

  return (
    <li className="px-5 py-3.5 transition-colors duration-150 hover:bg-white">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full bg-black/[0.05] text-[11px] font-semibold text-black/60"
        >
          {initials(grant.name)}
        </span>

        <div className="min-w-0 flex-1 basis-48">
          <p className="truncate text-[13px] font-medium text-black/80">
            {grant.name}
          </p>
          <p className="truncate text-[11.5px] text-black/55">{grant.email}</p>
        </div>

        <Activity grant={grant} />

        <label className="flex shrink-0 cursor-pointer items-center gap-2.5 select-none">
          <span className="relative inline-flex">
            <input
              type="checkbox"
              checked={grant.canEditMilestones}
              disabled={pending}
              onChange={(event) => toggleEditing(event.target.checked)}
              className={cn("peer sr-only", FOCUS_RING)}
            />
            <span
              aria-hidden
              className="peer-checked:bg-gd-green peer-focus-visible:ring-gd-green/30 h-[18px] w-8 rounded-full bg-black/[0.13] transition-colors duration-200 peer-focus-visible:ring-2 peer-disabled:opacity-50"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-3.5"
            />
          </span>
          <span className="text-[11.5px] whitespace-nowrap text-black/55">
            Milestone editing
          </span>
        </label>

        <div className="flex shrink-0 items-center gap-1">
          <form action={regenerate}>
            <input
              type="hidden"
              name="clientUserId"
              value={grant.clientUserId}
            />
            <input type="hidden" name="publicId" value={publicId} />
            <Button
              variant="admin-ghost"
              size="none"
              type="submit"
              disabled={regenerating}
              onClick={() => setDismissed(false)}
              title="Issue a new password and invalidate the old one"
              className="h-7"
            >
              {regenerating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <KeyRound className="size-3.5" />
              )}
              New password
            </Button>
          </form>

          <ConfirmAction
            label={<Trash2 className="size-3.5" />}
            confirmLabel="Revoke"
            question={`Revoke access for ${grant.name}? They lose this project on their next request.`}
            pending={pending}
            className={cn(ICON_BUTTON_DANGER, "shrink-0")}
            onConfirm={revoke}
          />
        </div>
      </div>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="mt-2.5 flex items-start gap-2 text-[12px] text-red-700"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {state.message}
        </p>
      ) : null}

      {issued ? (
        <div className="mt-3.5">
          <Issued issued={issued} onClose={() => setDismissed(true)} />
        </div>
      ) : null}
    </li>
  );
}

// Three states worth telling apart: the password was issued and never used, it
// was used once and not since, and they were here recently. An owner chasing a
// quiet client needs to know which of the three they are looking at.
function Activity({ grant }: { grant: ClientGrant }) {
  if (!grant.activatedAt) {
    return (
      <span
        title={`Shared ${absoluteTime(grant.grantedAt)}`}
        className="shrink-0 rounded-full bg-amber-400/[0.16] px-2.5 py-1 text-[11px] font-medium text-amber-800"
      >
        Not signed in yet
      </span>
    );
  }

  const seen = timeAgo(grant.lastSeenAt);

  return (
    <span
      title={
        grant.lastSeenAt
          ? `Last opened ${absoluteTime(grant.lastSeenAt)}`
          : undefined
      }
      suppressHydrationWarning
      className="shrink-0 text-[11.5px] whitespace-nowrap text-black/55"
    >
      {seen ? `Opened ${seen}` : "Signed in, not opened since"}
    </span>
  );
}
