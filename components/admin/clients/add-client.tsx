"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Building2, Loader2, Plus, X } from "lucide-react";
import { createClientCompany } from "@/app/(admin)/clients/actions";
import { useCloseOnSuccess } from "@/components/admin/projects/use-close-on-success";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IDLE_FORM } from "@/lib/projects/form-state";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  ICON_BUTTON,
  INPUT,
} from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

const MAX_CONTACTS = 12;

export function AddClient() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    createClientCompany,
    IDLE_FORM,
  );
  const [rows, setRows] = useState<number[]>([0]);

  useCloseOnSuccess(state, () => {
    setOpen(false);
    setRows([0]);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={cn(BUTTON_PRIMARY, "h-10")}>
          <Building2 className="size-4" />
          Add client
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto border-black/[0.08] bg-[#f8f8f3] text-black sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[15px] tracking-[-0.025em]">
            Add a client
          </DialogTitle>
          <DialogDescription className="text-[12px] text-black/60">
            The company and the people you speak to there.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-[12px] text-black/55">Company name</span>
              <input
                name="name"
                required
                maxLength={160}
                placeholder="Northstar Labs"
                className={cn(INPUT, "h-10")}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[12px] text-black/55">Website</span>
              <input
                name="website"
                placeholder="https://example.com"
                className={cn(INPUT, "h-10")}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[12px] text-black/55">Notes</span>
            <textarea
              name="notes"
              rows={2}
              className={cn(INPUT, "resize-y py-2")}
            />
          </label>

          <fieldset className="space-y-3">
            <legend className="text-[12px] text-black/55">Contacts</legend>

            {rows.map((row, position) => (
              <div
                key={row}
                className="rounded-xl border border-black/[0.09] bg-white p-3.5"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-black/55">
                    {position === 0
                      ? "Primary contact"
                      : `Contact ${position + 1}`}
                  </span>
                  {rows.length > 1 ? (
                    <button
                      type="button"
                      aria-label="Remove this contact"
                      onClick={() =>
                        setRows((was) => was.filter((value) => value !== row))
                      }
                      className={ICON_BUTTON}
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name" name={`contactName${row}`} />
                  <Field label="Job title" name={`contactTitle${row}`} />
                  <Field
                    label="Email"
                    name={`contactEmail${row}`}
                    type="email"
                  />
                  <Field label="Phone" name={`contactPhone${row}`} />
                </div>
              </div>
            ))}

            {rows.length < MAX_CONTACTS ? (
              <button
                type="button"
                onClick={() =>
                  setRows((was) => [...was, (was[was.length - 1] ?? 0) + 1])
                }
                className={cn(BUTTON_SECONDARY, "h-9 w-full text-xs")}
              >
                <Plus className="size-3.5" />
                Add another contact
              </button>
            ) : null}
          </fieldset>

          {state.status === "error" && state.message ? (
            <p
              role="alert"
              className="flex items-start gap-2 text-[12px] text-red-700"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={cn(BUTTON_PRIMARY, "h-10 w-full")}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Add client
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  type = "text",
}: {
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] text-black/55">{label}</span>
      <input name={name} type={type} className={cn(INPUT, "h-10")} />
    </label>
  );
}
