"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, Send } from "lucide-react";
import {
  sendInvite,
  type InviteDraft,
  type InviteState,
} from "@/app/(admin)/team/actions";
import { CopyButton } from "@/components/admin/projects/issued-access";
import { useCloseOnSuccess } from "@/components/admin/projects/use-close-on-success";
import { INVITE_LINK_HEADING } from "@/lib/invites/email";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

const IDLE: InviteState = { status: "idle", message: null };

export function InviteComposer({
  draft,
  onDone,
}: {
  draft: InviteDraft;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(sendInvite, IDLE);

  useCloseOnSuccess(state, onDone);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="profileId" value={draft.profileId} />

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white px-3.5 py-2.5">
        <span className="text-[11.5px] text-black/60">To</span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-black/80">
          {draft.email}
        </span>
      </div>

      <label className="block space-y-1.5">
        <span className="text-[12px] text-black/55">Subject</span>
        <input
          name="subject"
          required
          maxLength={200}
          defaultValue={draft.subject}
          className={cn(INPUT, "h-10")}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[12px] text-black/55">Message</span>
        <textarea
          name="body"
          required
          rows={10}
          defaultValue={draft.body}
          className={cn(INPUT, "resize-y py-2.5 leading-6")}
        />
      </label>

      <div className="rounded-xl border border-black/[0.07] bg-black/[0.025] px-3.5 py-3">
        <p className="font-mono text-[9px] tracking-[0.16em] text-black/55 uppercase">
          Added on send
        </p>
        <p className="mt-2 font-mono text-[11px] leading-5 text-black/55">
          {INVITE_LINK_HEADING}
          <br />
          {"https://…/set-password?token=…"}
        </p>
      </div>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="flex items-start gap-2 text-[12px] text-red-700"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {state.message}
        </p>
      ) : null}

      {state.link ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-black/[0.09] bg-white px-3 py-2">
          <span className="w-16 shrink-0 text-[11.5px] text-black/60">
            Link
          </span>
          <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-black/80">
            {state.link}
          </span>
          <CopyButton value={state.link} label="set-password link" />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className={cn(BUTTON_PRIMARY, "h-10 flex-1")}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          Send invitation
        </button>
        <button
          type="button"
          onClick={onDone}
          className={cn(BUTTON_SECONDARY, "h-10")}
        >
          Later
        </button>
      </div>
    </form>
  );
}
