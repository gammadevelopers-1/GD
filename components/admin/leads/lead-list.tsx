"use client";

import { useActionState, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  Loader2,
  Mail,
  MailWarning,
  Phone,
} from "lucide-react";

import { archiveLead, setLeadStatus } from "@/app/(admin)/leads/actions";
import { Badge } from "@/components/ui/badge";
import { FormSelect } from "@/components/common/form-select";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  type ContactLead,
  type LeadStatus,
} from "@/lib/contact/leads";
import {
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  INPUT_SMALL,
  PANEL,
  TONE_FILL,
  TONE_SOFT,
  type Tone,
} from "@/lib/admin-ui";
import { IDLE_FORM } from "@/lib/projects/form-state";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<LeadStatus, Tone> = {
  new: "info",
  contacted: "warning",
  qualified: "ok",
  closed: "muted",
  spam: "danger",
};

function stamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function LeadList({ leads }: { leads: ContactLead[] }) {
  return (
    <ul className="space-y-2">
      {leads.map((lead) => (
        <LeadRow key={lead.id} lead={lead} />
      ))}
    </ul>
  );
}

function LeadRow({ lead }: { lead: ContactLead }) {
  const [open, setOpen] = useState(false);
  const tone = STATUS_TONE[lead.status];

  return (
    <li
      className={cn(
        PANEL,
        "overflow-hidden p-0",
        lead.archivedAt && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-white/70"
      >
        <span
          aria-hidden
          className={cn(
            "size-2 shrink-0 rounded-full",
            TONE_FILL[tone],
            lead.status === "new" && "shadow-[0_0_0_3px_rgba(22,163,74,0.14)]",
          )}
        />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="truncate text-[14px] font-semibold tracking-[-0.02em]">
              {lead.company}
            </span>
            <span className="truncate text-[12px] text-black/55">
              {lead.name} · {lead.roleTitle}
            </span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-black/45">
            <span>{lead.headcount} staff</span>
            <Dot />
            <span>{lead.budget}</span>
            <Dot />
            <span>{lead.timeline}</span>
            <Dot />
            <span>{lead.country}</span>
          </span>
        </span>

        {lead.notifiedAt ? null : (
          <span
            title="Stored, but the notification email never left."
            className="hidden shrink-0 items-center gap-1 text-[10.5px] font-semibold text-amber-800 sm:inline-flex"
          >
            <MailWarning className="size-3.5" />
            Not mailed
          </span>
        )}

        <Badge
          variant="outline"
          className={cn(
            "hidden shrink-0 rounded-full font-semibold sm:inline-flex",
            TONE_SOFT[tone],
          )}
        >
          {LEAD_STATUS_LABEL[lead.status]}
        </Badge>

        <span className="hidden shrink-0 font-mono text-[10px] tracking-[0.04em] text-black/40 md:inline">
          {stamp(lead.createdAt)}
        </span>

        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-black/35 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? <LeadDetail lead={lead} /> : null}
    </li>
  );
}

function Dot() {
  return (
    <span aria-hidden className="text-black/20">
      ·
    </span>
  );
}

function LeadDetail({ lead }: { lead: ContactLead }) {
  return (
    <div className="border-t border-black/[0.07] bg-white/60 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`mailto:${lead.email}?subject=${encodeURIComponent(`Re: your enquiry · ${lead.company}`)}`}
          className={cn(BUTTON_PRIMARY, "h-8")}
        >
          <Mail className="size-3.5" />
          Reply
        </a>
        <span className="text-[12px] text-black/55">{lead.email}</span>
        {lead.phone ? (
          <a
            href={`tel:${lead.phone.replace(/\s+/g, "")}`}
            className={cn(BUTTON_GHOST, "h-8")}
          >
            <Phone className="size-3.5" />
            {lead.phone}
          </a>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="Revenue" value={lead.revenue} />
        <Fact label="Headcount" value={lead.headcount} />
        <Fact label="Budget" value={lead.budget} />
        <Fact label="Timeline" value={lead.timeline} />
        <Fact label="Stage" value={lead.stage} />
        <Fact label="Country" value={lead.country} />
      </dl>

      <div className="mt-4 rounded-xl border border-black/[0.07] bg-white p-3.5">
        <h3 className="font-mono text-[9px] tracking-[0.16em] text-black/45 uppercase">
          What they want solved
        </h3>
        <p className="mt-2 text-[13px] leading-[1.6] whitespace-pre-wrap text-black/80">
          {lead.summary}
        </p>
      </div>

      {lead.ownerNote ? (
        <div className="mt-2 rounded-xl border border-black/[0.07] bg-black/[0.02] p-3.5">
          <h3 className="font-mono text-[9px] tracking-[0.16em] text-black/45 uppercase">
            Internal note
          </h3>
          <p className="mt-2 text-[13px] leading-[1.6] whitespace-pre-wrap text-black/70">
            {lead.ownerNote}
          </p>
        </div>
      ) : null}

      <Triage lead={lead} />

      <p className="mt-3 font-mono text-[10px] tracking-[0.04em] text-black/35">
        Received {stamp(lead.createdAt)} UTC
        {lead.sourcePath ? ` · ${lead.sourcePath}` : ""}
        {lead.handledBy ? ` · last touched by ${lead.handledBy}` : ""}
        {lead.notifiedAt ? "" : " · notification email never sent"}
      </p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-[13px] font-medium text-black/80">{value}</dd>
    </div>
  );
}

function Triage({ lead }: { lead: ContactLead }) {
  const [state, action, pending] = useActionState(setLeadStatus, IDLE_FORM);

  return (
    <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-dashed border-black/10 pt-4">
      <form action={action} className="flex flex-1 flex-wrap items-end gap-2">
        <input type="hidden" name="leadId" value={lead.id} />

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[9px] tracking-[0.16em] text-black/45 uppercase">
            Status
          </span>
          <FormSelect
            name="status"
            ariaLabel="Lead status"
            defaultValue={lead.status}
            options={LEAD_STATUSES.map((status) => ({
              value: status,
              label: LEAD_STATUS_LABEL[status],
            }))}
            triggerSize="sm"
            triggerClassName={cn(INPUT_SMALL, "h-8 w-36")}
          />
        </label>

        <label className="flex min-w-[200px] flex-1 flex-col gap-1">
          <span className="font-mono text-[9px] tracking-[0.16em] text-black/45 uppercase">
            Add a note
          </span>
          <input
            name="note"
            placeholder="Called, sending a plan Thursday"
            className={cn(INPUT_SMALL, "h-8")}
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className={cn(BUTTON_PRIMARY, "h-8")}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Save
        </button>

        {state.message ? (
          <p
            aria-live="polite"
            className={cn(
              "text-[11px]",
              state.status === "error" ? "text-red-700" : "text-black/50",
            )}
          >
            {state.message}
          </p>
        ) : null}
      </form>

      <ArchiveToggle lead={lead} />
    </div>
  );
}

function ArchiveToggle({ lead }: { lead: ContactLead }) {
  const [, action, pending] = useActionState(archiveLead, IDLE_FORM);
  const archived = Boolean(lead.archivedAt);

  return (
    <form action={action}>
      <input type="hidden" name="leadId" value={lead.id} />
      <input
        type="hidden"
        name="archived"
        value={archived ? "false" : "true"}
      />
      <button
        type="submit"
        disabled={pending}
        className={cn(BUTTON_GHOST, "h-8")}
      >
        {archived ? (
          <ArchiveRestore className="size-3.5" />
        ) : (
          <Archive className="size-3.5" />
        )}
        {archived ? "Restore" : "Archive"}
      </button>
    </form>
  );
}
