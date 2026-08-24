"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Loader2, Plus, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <Button
          variant="admin-cta"
          size="none"
          type="button"
          data-button-fill
          className="h-10"
        >
          <Plus className="size-4" />
          <span className="button-fill-fx__label">Add client</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gd-panel max-h-[85vh] overflow-y-auto border-black/[0.08] text-black sm:max-w-2xl">
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
              <Input
                variant="admin"
                name="name"
                required
                maxLength={160}
                placeholder="Northstar Labs"
                className={cn("h-10")}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[12px] text-black/55">Website</span>
              <Input
                variant="admin"
                name="website"
                placeholder="https://example.com"
                className={cn("h-10")}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[12px] text-black/55">Notes</span>
            <Textarea
              name="notes"
              rows={2}
              variant="admin"
              className="resize-y"
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
                    <Button
                      variant="admin-icon"
                      size="none"
                      type="button"
                      aria-label="Remove this contact"
                      onClick={() =>
                        setRows((was) => was.filter((value) => value !== row))
                      }
                    >
                      <X className="size-3.5" />
                    </Button>
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
              <Button
                variant="admin-secondary"
                size="none"
                type="button"
                onClick={() =>
                  setRows((was) => [...was, (was[was.length - 1] ?? 0) + 1])
                }
                className="h-9 w-full text-xs"
              >
                <Plus className="size-3.5" />
                Add another contact
              </Button>
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

          <Button
            variant="admin-primary"
            size="none"
            type="submit"
            disabled={pending}
            className="h-10 w-full"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Add client
          </Button>
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
      <Input variant="admin" name={name} type={type} className={cn("h-10")} />
    </label>
  );
}
