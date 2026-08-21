"use client";

import { useMemo, useState } from "react";
import type { CredentialAuditEntry } from "@/data/credentials";
import { AUDIT_LABEL, AUDIT_TONE } from "@/lib/credentials/validation";
import { ROLE_LABELS, type TeamRole } from "@/lib/team/records";
import { BUTTON_GHOST, FOCUS_RING, INPUT_SMALL, PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { FormSelect } from "@/components/common/form-select";

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
    <section className={cn(PANEL, "p-6 sm:p-7")}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold tracking-[-0.025em]">
          Audit history
        </h2>
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
              <button
                type="button"
                onClick={() => {
                  setPerson("");
                  setVariable("");
                }}
                className={cn(BUTTON_GHOST, "h-9")}
              >
                Reset
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {!entries.length ? (
        <p className="mt-5 text-[12.5px] text-black/40">
          Nothing recorded yet.
        </p>
      ) : !rows.length ? (
        <p className="mt-5 text-[12.5px] text-black/40">
          Nothing matches those filters.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-black/[0.06]">
          {rows.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-4"
            >
              <span
                className={cn(
                  "w-fit shrink-0 rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium sm:w-36",
                  AUDIT_TONE[entry.action] ??
                    "border-black/[0.09] bg-black/[0.03] text-black/55",
                )}
              >
                {AUDIT_LABEL[entry.action] ?? entry.action}
              </span>
              <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-black/70">
                {entry.credentialName}
              </code>
              <span className="shrink-0 text-[12px] text-black/55">
                {entry.actor}
                {entry.detail ? (
                  <span className="text-black/35"> · {entry.detail}</span>
                ) : null}
              </span>
              <time
                dateTime={entry.occurredAt}
                className="shrink-0 text-[11.5px] text-black/35 sm:w-36 sm:text-right"
              >
                {formatMoment(entry.occurredAt)}
              </time>
              <ActorDetails entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </section>
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

  if (!entry.actorId) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        className={cn(
          "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition sm:w-16 sm:text-right",
          open ? "text-black" : "text-black/35 hover:text-black",
          FOCUS_RING,
        )}
      >
        {open ? "Hide" : "Details"}
      </button>

      {open ? (
        <dl className="mt-1 w-full basis-full space-y-1 rounded-lg bg-black/[0.03] px-3 py-2.5 sm:mt-2">
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
      <dt className="w-20 shrink-0 text-[11px] text-black/40">{label}</dt>
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
