"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { updateTeamMember } from "@/app/(admin)/team/actions";
import { MemberFields } from "@/components/admin/team/member-fields";
import type { TeamPerson } from "@/data/team";
import { IDLE_TEAM_FORM } from "@/lib/team/records";
import { PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PersonEditor({ person }: { person: TeamPerson }) {
  const [state, action, pending] = useActionState(
    updateTeamMember,
    IDLE_TEAM_FORM,
  );
  const [edited, setEdited] = useState(false);
  const [settled, setSettled] = useState(state);

  if (settled !== state) {
    setSettled(state);
    setEdited(false);
  }

  const defaults = state.values ?? {
    fullName: person.fullName,
    email: person.email ?? "",
    role: person.role,
    jobTitle: person.jobTitle ?? "",
    phone: person.phone ?? "",
    employmentType: person.employment.employmentType ?? "",
    startDate: person.employment.startDate ?? "",
    salaryAmount:
      person.employment.salaryAmount === null
        ? ""
        : String(person.employment.salaryAmount),
    cnic: person.employment.cnic ?? "",
    bankAccountTitle: person.employment.bankAccountTitle ?? "",
    bankAccountNumber: person.employment.bankAccountNumber ?? "",
    bankName: person.employment.bankName ?? "",
  };

  return (
    <form
      action={action}
      onInput={() => setEdited(true)}
      className={cn(PANEL, "p-5")}
    >
      <input type="hidden" name="profileId" value={person.id} />

      <MemberFields defaults={defaults} errors={state.fieldErrors} lockEmail />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="admin-primary"
          size="none"
          type="submit"
          disabled={pending}
          className="h-10"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Save changes
        </Button>

        {state.status === "success" && state.message && !edited ? (
          <span className="flex items-center gap-1.5 text-[12px] text-[#0b5f2c]">
            <Check className="size-3.5" />
            {state.message}
          </span>
        ) : null}

        {state.status === "error" && state.message ? (
          <span
            role="alert"
            className="flex items-start gap-1.5 text-[12px] text-red-700"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
