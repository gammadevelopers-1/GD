"use client";

import { useMemo, useState } from "react";
import type { CredentialAuditEntry } from "@/data/credentials";
import { AUDIT_LABEL, AUDIT_TONE } from "@/lib/credentials/validation";
import { BUTTON_GHOST, INPUT_SMALL, PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

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
            <select
              value={person}
              onChange={(event) => setPerson(event.target.value)}
              aria-label="Filter by person"
              className={cn(INPUT_SMALL, "h-9")}
            >
              <option value="">Everyone</option>
              {people.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={variable}
              onChange={(event) => setVariable(event.target.value)}
              aria-label="Filter by variable"
              className={cn(INPUT_SMALL, "h-9 max-w-52")}
            >
              <option value="">Every variable</option>
              {variables.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
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
