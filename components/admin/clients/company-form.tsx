"use client";

import { useActionState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useCloseOnSuccess } from "@/components/admin/projects/use-close-on-success";
import { type SimpleFormState, IDLE_FORM } from "@/lib/projects/form-state";
import { BUTTON_PRIMARY, INPUT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export type CompanyAction = (
  state: SimpleFormState,
  formData: FormData,
) => Promise<SimpleFormState>;

export function CompanyForm({
  action,
  clientId,
  defaults,
  submitLabel,
  onSaved,
}: {
  action: CompanyAction;
  clientId?: string;
  defaults?: { name: string; website: string; notes: string };
  submitLabel: string;
  onSaved?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);

  useCloseOnSuccess(state, () => onSaved?.());

  return (
    <form action={formAction} className="space-y-4">
      {clientId ? (
        <input type="hidden" name="clientId" value={clientId} />
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-[12px] text-black/55">Company name</span>
        <input
          name="name"
          required
          maxLength={160}
          defaultValue={defaults?.name}
          placeholder="Northstar Labs"
          className={cn(INPUT, "h-10")}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[12px] text-black/55">Website</span>
        <input
          name="website"
          defaultValue={defaults?.website}
          placeholder="https://example.com"
          className={cn(INPUT, "h-10")}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[12px] text-black/55">Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaults?.notes}
          className={cn(INPUT, "resize-y py-2")}
        />
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={cn(BUTTON_PRIMARY, "h-10")}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </button>

        {state.status === "success" && state.message && !onSaved ? (
          <span className="flex items-center gap-1.5 text-[12px] text-[#0b5f2c]">
            <Check className="size-3.5" />
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
