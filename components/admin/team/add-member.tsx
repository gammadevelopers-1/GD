"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import {
  createTeamMember,
  type CreateTeamState,
} from "@/app/(admin)/team/actions";
import { Modal } from "@/components/admin/projects/modal";
import { MemberFields } from "@/components/admin/team/member-fields";
import { InviteComposer } from "@/components/admin/team/invite-composer";
import { IDLE_TEAM_FORM } from "@/lib/team/records";
import { Button } from "@/components/ui/button";

const IDLE: CreateTeamState = IDLE_TEAM_FORM;

export function AddMember() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createTeamMember, IDLE);
  const [settled, setSettled] = useState(state);
  const [stage, setStage] = useState<"form" | "invite">("form");

  if (settled !== state) {
    setSettled(state);
    if (state.draft) setStage("invite");
  }

  const draft = stage === "invite" ? state.draft : undefined;

  return (
    <>
      <Button
        variant="admin-primary"
        size="none"
        type="button"
        onClick={() => {
          setStage("form");
          setOpen(true);
        }}
        className="h-10"
      >
        <UserPlus className="size-4" />
        Add team member
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={draft ? `Invite ${draft.fullName}` : "Add a team member"}
      >
        {draft ? (
          <InviteComposer draft={draft} onDone={() => setOpen(false)} />
        ) : (
          <form action={action} className="space-y-5">
            <MemberFields
              defaults={state.values ?? {}}
              errors={state.fieldErrors}
            />

            {state.status === "error" && state.message ? (
              <p
                role="alert"
                className="flex items-start gap-2 text-[12px] text-red-700"
              >
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {state.message}
              </p>
            ) : null}

            <Button
              variant="admin-primary"
              size="none"
              type="submit"
              disabled={pending}
              className="h-10 w-full"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Create account
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
