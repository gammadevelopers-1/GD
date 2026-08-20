"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { createClientCompany } from "@/app/(admin)/clients/actions";
import { CompanyForm } from "@/components/admin/clients/company-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BUTTON_PRIMARY } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export function AddClient() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={cn(BUTTON_PRIMARY, "h-10")}>
          <Building2 className="size-4" />
          Add client
        </button>
      </DialogTrigger>

      <DialogContent className="border-black/[0.08] bg-[#f8f8f3] text-black sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px] tracking-[-0.025em]">
            Add a client
          </DialogTitle>
          <DialogDescription className="text-[12px] text-black/45">
            The company. Contacts and portal access come from its record.
          </DialogDescription>
        </DialogHeader>

        <CompanyForm
          action={createClientCompany}
          submitLabel="Add client"
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
