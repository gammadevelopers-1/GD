"use client";

import { useActionState, useState, useTransition } from "react";
import { AlertCircle, Loader2, Trash2, UserPlus } from "lucide-react";
import {
  archiveClientContact,
  saveClientContact,
} from "@/app/(admin)/clients/actions";
import { ConfirmAction } from "@/components/admin/projects/modal";
import { useCloseOnSuccess } from "@/components/admin/projects/use-close-on-success";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ClientContact } from "@/data/clients";
import { IDLE_FORM } from "@/lib/projects/form-state";
import { ICON_BUTTON_DANGER, PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ContactsPanel({
  clientId,
  contacts,
}: {
  clientId: string;
  contacts: ClientContact[];
}) {
  return (
    <section className={cn(PANEL, "p-5")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[9px] tracking-[0.16em] text-black/55 uppercase">
          Contacts
        </h2>
        <ContactDialog clientId={clientId} />
      </div>

      {contacts.length ? (
        <ul className="mt-4 space-y-2">
          {contacts.map((contact) => (
            <li
              key={contact.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-black/[0.07] bg-white px-3.5 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-black/80">
                  {contact.fullName}
                  {contact.isPrimary ? (
                    <span className="text-gd-green-deep ml-2 text-[10px] font-semibold">
                      Primary
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-[11px] text-black/60">
                  {[contact.jobTitle, contact.email, contact.phone]
                    .filter(Boolean)
                    .join(" · ") || "No details recorded"}
                </p>
              </div>

              <ContactDialog clientId={clientId} contact={contact} />
              <RemoveContact clientId={clientId} contactId={contact.id} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[12px] text-black/55">No contacts yet.</p>
      )}
    </section>
  );
}

function ContactDialog({
  clientId,
  contact,
}: {
  clientId: string;
  contact?: ClientContact;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveClientContact, IDLE_FORM);

  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="admin-secondary"
          size="none"
          type="button"
          className={cn("h-8 px-2.5 text-xs", !contact && "h-9 px-3")}
        >
          {contact ? (
            "Edit"
          ) : (
            <>
              <UserPlus className="size-3.5" />
              Add contact
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-gd-panel border-black/[0.08] text-black sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px] tracking-[-0.025em]">
            {contact ? `Edit ${contact.fullName}` : "Add a contact"}
          </DialogTitle>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          {contact ? (
            <input type="hidden" name="contactId" value={contact.id} />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              name="fullName"
              defaultValue={contact?.fullName}
              required
            />
            <Field
              label="Job title"
              name="jobTitle"
              defaultValue={contact?.jobTitle ?? ""}
            />
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue={contact?.email ?? ""}
            />
            <Field
              label="Phone"
              name="phone"
              defaultValue={contact?.phone ?? ""}
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-black/[0.09] bg-white px-3.5 py-3">
            <input
              type="checkbox"
              name="isPrimary"
              defaultChecked={contact?.isPrimary}
              className="accent-gd-green size-4 shrink-0"
            />
            <span className="text-[13px] text-black/75">
              The person we speak to first
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

          <Button
            variant="admin-primary"
            size="none"
            type="submit"
            disabled={pending}
            className="h-10 w-full"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {contact ? "Save contact" : "Add contact"}
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
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] text-black/55">{label}</span>
      <Input
        variant="admin"
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className={cn("h-10")}
      />
    </label>
  );
}

function RemoveContact({
  clientId,
  contactId,
}: {
  clientId: string;
  contactId: string;
}) {
  const [removing, startRemoving] = useTransition();

  return (
    <ConfirmAction
      label={<Trash2 className="size-3.5" />}
      confirmLabel="Remove"
      question="Remove this contact?"
      pending={removing}
      className={ICON_BUTTON_DANGER}
      onConfirm={() => {
        const data = new FormData();
        data.set("clientId", clientId);
        data.set("contactId", contactId);
        startRemoving(() => archiveClientContact(data));
      }}
    />
  );
}
