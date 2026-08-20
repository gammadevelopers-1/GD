"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import {
  setClientArchived,
  updateClientCompany,
} from "@/app/(admin)/clients/actions";
import { CompanyForm } from "@/components/admin/clients/company-form";
import { ConfirmAction } from "@/components/admin/projects/modal";
import type { ClientRecord } from "@/data/clients";
import { BUTTON_SECONDARY, PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export function CompanyPanel({ client }: { client: ClientRecord }) {
  const [switching, startSwitching] = useTransition();
  const archived = Boolean(client.archivedAt);

  return (
    <section className={cn(PANEL, "p-5")}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
          Company
        </h2>

        <ConfirmAction
          label={
            <span className="inline-flex items-center gap-1.5">
              {archived ? (
                <ArchiveRestore className="size-3.5" />
              ) : (
                <Archive className="size-3.5" />
              )}
              {archived ? "Restore" : "Archive"}
            </span>
          }
          confirmLabel={archived ? "Restore" : "Archive"}
          question={
            archived
              ? `Restore ${client.name}?`
              : `Archive ${client.name}? It leaves the client list and the project picker.`
          }
          pending={switching}
          className={cn(BUTTON_SECONDARY, "h-8 px-2.5 text-xs")}
          onConfirm={() => {
            const data = new FormData();
            data.set("clientId", client.id);
            data.set("archived", archived ? "0" : "1");
            startSwitching(() => setClientArchived(data));
          }}
        />
      </div>

      <CompanyForm
        action={updateClientCompany}
        clientId={client.id}
        defaults={{
          name: client.name,
          website: client.website ?? "",
          notes: client.notes ?? "",
        }}
        submitLabel="Save changes"
      />
    </section>
  );
}
