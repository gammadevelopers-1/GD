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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ProjectInviteContext } from "@/data/clients";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT } from "@/lib/admin-ui";
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
  const [addingNew, setAddingNew] = useState(
    context.contacts.length === 0 && context.accounts.length === 0,
  );

  useCloseOnSuccess(state, () => setOpen(false));

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

      <DialogContent className="max-h-[85vh] overflow-y-auto border-black/[0.08] bg-[#f8f8f3] text-black sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px] tracking-[-0.025em]">
            Invite to this project
          </DialogTitle>
          <DialogDescription className="text-[12px] text-black/45">
            Anyone already signed in is sent straight to the project. Everyone
            else sets a password first.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          {context.clientId ? (
            <input type="hidden" name="clientId" value={context.clientId} />
          ) : null}

          {context.accounts.length ? (
            <fieldset className="space-y-2">
              <legend className="mb-2 text-[12px] text-black/55">
                Already on this project
              </legend>
              {context.accounts.map((account) => (
                <label
                  key={account.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/[0.09] bg-white px-3.5 py-3 transition hover:border-black/20"
                >
                  <input
                    type="checkbox"
                    name="accountId"
                    value={account.id}
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
            </fieldset>
          ) : null}

          {context.contacts.length ? (
            <fieldset className="space-y-2">
              <legend className="mb-2 text-[12px] text-black/55">
                Contacts at this client
              </legend>
              {context.contacts.map((contact) => (
                <label
                  key={contact.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-black/[0.09] bg-white px-3.5 py-3 transition",
                    contact.onThisProject
                      ? "opacity-55"
                      : "cursor-pointer hover:border-black/20",
                  )}
                >
                  <input
                    type="checkbox"
                    name="contact"
                    value={`${contact.email}|${contact.fullName}`}
                    disabled={contact.onThisProject}
                    className="size-4 shrink-0 accent-[#16a34a]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-black/80">
                      {contact.fullName}
                      {contact.jobTitle ? (
                        <span className="ml-2 text-[11px] font-normal text-black/40">
                          {contact.jobTitle}
                        </span>
                      ) : null}
                    </span>
                    <span className="block truncate text-[11px] text-black/45">
                      {contact.email}
                    </span>
                  </span>
                  {contact.onThisProject ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-black/10 bg-black/[0.04] font-semibold text-black/55"
                    >
                      Invited
                    </Badge>
                  ) : contact.hasAccount ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-blue-800/25 bg-blue-600/12 font-semibold text-blue-900"
                    >
                      Has account
                    </Badge>
                  ) : null}
                </label>
              ))}
            </fieldset>
          ) : null}

          {addingNew ? (
            <fieldset className="space-y-3 rounded-xl border border-black/[0.09] bg-white p-3.5">
              <legend className="px-1 text-[12px] text-black/55">
                Someone else
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-[12px] text-black/55">Their name</span>
                  <input
                    name="fullName"
                    maxLength={120}
                    className={cn(INPUT, "h-10")}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[12px] text-black/55">Their email</span>
                  <input
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    className={cn(INPUT, "h-10")}
                  />
                </label>
              </div>

              {context.clientId ? (
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="saveAsContact"
                    defaultChecked
                    className="size-4 shrink-0 accent-[#16a34a]"
                  />
                  <span className="text-[12.5px] text-black/70">
                    Save them as a contact on this client
                  </span>
                </label>
              ) : null}
            </fieldset>
          ) : (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className={cn(BUTTON_SECONDARY, "h-9 w-full text-xs")}
            >
              <UserPlus className="size-3.5" />
              Invite someone else
            </button>
          )}

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
            Send invitations
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
