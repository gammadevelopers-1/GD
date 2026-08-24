"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { IssuedAccess } from "@/app/(admin)/projects/client-actions";
import { FOCUS_RING } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Issued({
  issued,
  onClose,
}: {
  issued: IssuedAccess;
  onClose: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#0f7a37]/30 bg-[#16a34a]/[0.06] p-4">
      <p className="text-[13px] font-medium text-[#0b5f2c]">
        Send these to {issued.name}
      </p>
      <p className="mt-1 text-[11.5px] text-black/60">
        The password is shown once. If it is lost, generate a new one
      </p>

      <dl className="mt-3 space-y-1.5">
        <Field label="Link" value={issued.url} />
        <Field label="Email" value={issued.email} />
        <Field label="Password" value={issued.password} mono />
      </dl>

      <Button
        variant="admin-secondary"
        size="none"
        type="button"
        onClick={onClose}
        className="mt-3 h-8 text-xs"
      >
        I have copied these
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2">
      <dt className="w-16 shrink-0 text-[11.5px] text-black/60">{label}</dt>
      <dd
        className={cn(
          "min-w-0 flex-1 truncate text-[12.5px] text-black/80",
          mono && "font-mono tracking-[0.02em]",
        )}
      >
        {value}
      </dd>
      <CopyButton value={value} label={label} />
    </div>
  );
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="bare"
      size="none"
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md text-black/55 transition hover:bg-black/[0.05] hover:text-black active:scale-95",
        FOCUS_RING,
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-[#0b5f2c]" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </Button>
  );
}
