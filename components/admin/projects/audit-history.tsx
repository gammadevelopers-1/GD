"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Clock3,
  RotateCcw,
  SearchX,
  UserRound,
} from "lucide-react";
import type { CredentialAuditEntry } from "@/data/credentials";
import { AUDIT_LABEL, AUDIT_TONE } from "@/lib/credentials/validation";
import { ROLE_LABELS, type TeamRole } from "@/lib/team/records";
import { INPUT_SMALL, PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { FormSelect } from "@/components/common/form-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AuditHistory({ entries }: { entries: CredentialAuditEntry[] }) {
  const [person, setPerson] = useState("");
  const [variable, setVariable] = useState("");

  const people = useMemo(() => {
    const found = new Map<string, string>();
    for (const entry of entries) {
      if (entry.actorId) found.set(entry.actorId, entry.actor);
    }
    return [...found].sort((a, b) => a[1].localeCompare(b[1]));
  }, [entries]);

  const variables = useMemo(() => {
    const found = new Map<string, string>();
    for (const entry of entries) {
      if (entry.credentialId)
        found.set(entry.credentialId, entry.credentialName);
    }
    return [...found].sort((a, b) => a[1].localeCompare(b[1]));
  }, [entries]);

  const rows = entries.filter(
    (entry) =>
      (!person || entry.actorId === person) &&
      (!variable || entry.credentialId === variable),
  );

  const filtered = Boolean(person || variable);

  return (
    <section className={cn(PANEL, "overflow-hidden bg-[#f7f8f3]")}>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.07] bg-white/75 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[16px] font-semibold tracking-[-0.025em]">
            Audit history
          </h2>
          <p className="mt-0.5 text-[11px] text-black/60">
            Credential activity and access events
          </p>
        </div>
        {entries.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <FormSelect
              value={person}
              onValueChange={setPerson}
              ariaLabel="Filter by person"
              triggerClassName={cn(INPUT_SMALL, "h-9")}
              options={[
                { value: "", label: "Everyone" },
                ...people.map(([value, label]) => ({ value, label })),
              ]}
            />
            <FormSelect
              value={variable}
              onValueChange={setVariable}
              ariaLabel="Filter by variable"
              triggerClassName={cn(INPUT_SMALL, "h-9 max-w-52")}
              options={[
                { value: "", label: "Every variable" },
                ...variables.map(([value, label]) => ({ value, label })),
              ]}
            />
            {filtered ? (
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  setPerson("");
                  setVariable("");
                }}
                className="h-9 bg-white text-black/70"
              >
                <RotateCcw data-icon="inline-start" className="size-3.5" />
                Reset
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      {!entries.length ? (
        <EmptyState message="Nothing recorded yet." />
      ) : !rows.length ? (
        <EmptyState message="Nothing matches those filters." />
      ) : (
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <span className="text-[11px] font-medium text-black/60">
              Showing {rows.length} of {entries.length} events
            </span>
            {filtered ? (
              <Badge variant="outline" className="bg-white text-black/60">
                Filtered
              </Badge>
            ) : null}
          </div>
          <ul className="max-h-[clamp(22rem,52dvh,34rem)] space-y-2.5 overflow-y-auto overscroll-contain pr-1">
            {rows.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-black/[0.08] bg-white p-3.5 shadow-[0_2px_8px_rgba(20,23,26,0.025)] transition hover:border-black/15 hover:shadow-[0_8px_22px_rgba(20,23,26,0.055)] sm:p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-6 rounded-md px-2 text-[10.5px] font-semibold",
                          AUDIT_TONE[entry.action] ??
                            "border-black/[0.09] bg-black/[0.03] text-black/65",
                        )}
                      >
                        {AUDIT_LABEL[entry.action] ?? entry.action}
                      </Badge>
                      <code className="min-w-0 truncate font-mono text-[12px] font-semibold text-black/75">
                        {entry.credentialName}
                      </code>
                    </div>

                    <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-5 text-black/60">
                      <UserRound className="mt-0.5 size-3.5 shrink-0 text-black/60" />
                      <span>
                        <span className="font-medium text-black/75">
                          {entry.actor}
                        </span>
                        {entry.detail ? (
                          <span className="text-black/60">
                            {" "}
                            · {entry.detail}
                          </span>
                        ) : null}
                      </span>
                    </p>
                  </div>

                  <time
                    dateTime={entry.occurredAt}
                    className="hidden shrink-0 items-center gap-1.5 text-[11px] font-medium text-black/60 sm:flex"
                  >
                    <Clock3 className="size-3.5" />
                    {formatMoment(entry.occurredAt)}
                  </time>
                </div>

                <div className="mt-3 flex flex-wrap items-center border-t border-black/[0.06] pt-2.5">
                  <time
                    dateTime={entry.occurredAt}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-black/60 sm:hidden"
                  >
                    <Clock3 className="size-3.5" />
                    {formatMoment(entry.occurredAt)}
                  </time>
                  <ActorDetails entry={entry} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid min-h-40 place-items-center px-5 py-8 text-center">
      <div>
        <span className="mx-auto grid size-10 place-items-center rounded-xl border border-black/[0.08] bg-white text-black/55 shadow-sm">
          <SearchX className="size-4.5" />
        </span>
        <p className="mt-3 text-[12.5px] font-medium text-black/60">
          {message}
        </p>
      </div>
    </div>
  );
}

function formatMoment(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActorDetails({ entry }: { entry: CredentialAuditEntry }) {
  const [open, setOpen] = useState(false);
  const detailsId = `audit-details-${entry.id}`;

  if (!entry.actorId) return null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-controls={detailsId}
        className="ml-auto h-7 text-[11px] font-semibold text-black/60 hover:text-black"
      >
        {open ? "Hide details" : "View details"}
        <ChevronDown
          data-icon="inline-end"
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </Button>

      {open ? (
        <dl
          id={detailsId}
          className="mt-2 w-full basis-full space-y-1.5 rounded-xl border border-black/[0.07] bg-[#f7f8f3] px-3.5 py-3 shadow-inner"
        >
          <Fact label="Name" value={entry.actor} />
          <Fact label="Email" value={entry.actorEmail ?? "Not recorded"} />
          <Fact
            label="Role"
            value={
              entry.actorRole
                ? ROLE_LABELS[entry.actorRole as TeamRole]
                : "Unknown"
            }
          />
          <Fact label="Address" value={entry.ip ?? "Not recorded"} mono />
          <Fact
            label="Exact time"
            value={new Date(entry.occurredAt).toISOString()}
            mono
          />
        </dl>
      ) : null}
    </>
  );
}

function Fact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <dt className="w-20 shrink-0 text-[11px] text-black/55">{label}</dt>
      <dd
        className={cn(
          "min-w-0 flex-1 text-[12px] break-all text-black/70",
          mono && "font-mono text-[11.5px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
