"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Loader2, Send, UserPlus } from "lucide-react";
import {
  inviteClientToProject,
  type ClientInviteState,
} from "@/app/(admin)/clients/actions";
import { CopyButton } from "@/components/admin/projects/issued-access";
import { useCloseOnSuccess } from "@/components/admin/projects/use-close-on-success";
import { ClientStateBadge } from "@/components/admin/clients/client-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ProjectInviteContext } from "@/data/clients";
import { BUTTON_PRIMARY, INPUT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

const IDLE: ClientInviteState = { status: "idle", message: null };

export function InviteClient({
  projectId,
  context,
}: {
  projectId: string;
  context: ProjectInviteContext;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(inviteClientToProject, IDLE);
  const [chosen, setChosen] = useState<string>(
    context.accounts[0]?.id ?? "new",
  );

  useCloseOnSuccess(state, () => setOpen(false));

  const addingNew = chosen === "new";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-xs font-semibold text-white transition duration-200 hover:bg-white/[0.16] hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)] focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none active:scale-[0.97]"
        >
          <UserPlus className="size-3.5" />
          Invite client
        </button>
      </DialogTrigger>

      <DialogContent className="border-black/[0.08] bg-[#f8f8f3] text-black sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px] tracking-[-0.025em]">
            Invite a client
          </DialogTitle>
         
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />

          {context.accounts.length ? (
            <div className="space-y-2">
              {context.accounts.map((account) => (
                <label
                  key={account.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition",
                    chosen === account.id
                      ? "border-[#16a34a]/50 bg-[#16a34a]/[0.06]"
                      : "border-black/[0.09] bg-white hover:border-black/20",
                  )}
                >
                  <input
                    type="radio"
                    name="clientUserId"
                    value={account.id}
                    checked={chosen === account.id}
                    onChange={() => setChosen(account.id)}
                    className="size-4 shrink-0 accent-[#16a34a]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-black/80">
                      {account.fullName}
                    </span>
                    <span className="block truncate text-[11px] text-black/45">
                      {account.email}
                    </span>
                  </span>
                  <ClientStateBadge state={account.state} />
                </label>
              ))}

              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition",
                  addingNew
                    ? "border-[#16a34a]/50 bg-[#16a34a]/[0.06]"
                    : "border-black/[0.09] bg-white hover:border-black/20",
                )}
              >
                <input
                  type="radio"
                  name="clientUserId"
                  value="new"
                  checked={addingNew}
                  onChange={() => setChosen("new")}
                  className="size-4 shrink-0 accent-[#16a34a]"
                />
                <span className="text-[13px] font-medium text-black/80">
                  Someone else
                </span>
              </label>
            </div>
          ) : null}

          {addingNew ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-[12px] text-black/55">Their name</span>
                <input
                  name="fullName"
                  required
                  maxLength={120}
                  defaultValue={context.suggestion?.fullName}
                  className={cn(INPUT, "h-10")}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[12px] text-black/55">Their email</span>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={context.suggestion?.email}
                  placeholder="name@company.com"
                  className={cn(INPUT, "h-10")}
                />
              </label>
            </div>
          ) : null}

          <label className="flex items-start gap-3 rounded-xl border border-black/[0.09] bg-white px-3.5 py-3">
            <input
              type="checkbox"
              name="canEditMilestones"
              className="mt-0.5 size-4 shrink-0 accent-[#16a34a]"
            />
            <span className="text-[13px] text-black/75">
              Let them tick milestone items
            </span>
          </label>

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
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2">
              <span className="w-12 shrink-0 text-[11.5px] text-black/45">
                Link
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-black/80">
                {state.link}
              </span>
              <CopyButton value={state.link} label="invitation link" />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={cn(BUTTON_PRIMARY, "h-10 w-full")}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Send invitation
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
