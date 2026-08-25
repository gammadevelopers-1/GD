"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Clock3, History } from "lucide-react";
import type { ProjectAuditEntry } from "@/data/project-audit";
import {
  AUDIT_CATEGORIES,
  AUDIT_CATEGORY_LABEL,
  AUDIT_CATEGORY_TONE,
  auditActionLabel,
  auditPhrase,
  deviceLabel,
} from "@/lib/projects/audit";
import { ROLE_LABELS, type TeamRole } from "@/lib/team/records";
import { FOCUS_RING, INPUT_SMALL, PANEL, TONE_SOFT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { FormSelect } from "@/components/common/form-select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AuditHistory({ entries }: { entries: ProjectAuditEntry[] }) {
  const [person, setPerson] = useState("");
  const [category, setCategory] = useState("");

  const people = useMemo(() => {
    const found = new Map<string, string>();
    for (const entry of entries) {
      if (entry.actorId) found.set(entry.actorId, entry.actor);
    }
    return [...found].sort((a, b) => a[1].localeCompare(b[1]));
  }, [entries]);

  const rows = entries.filter(
    (entry) =>
      (!person || entry.actorId === person) &&
      (!category || entry.category === category),
  );

  const filtered = Boolean(person || category);

  return (
    <section className={cn(PANEL, "px-5 py-5 sm:px-6")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <History className="size-4 text-black/45" />
          <h2 className="text-[15.5px] font-semibold tracking-[-0.025em]">
            Audit history
          </h2>
        </div>

        {entries.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <FormSelect
              value={person}
              onValueChange={setPerson}
              ariaLabel="Filter by person"
              triggerClassName={cn(INPUT_SMALL, "h-8")}
              options={[
                { value: "", label: "Everyone" },
                ...people.map(([value, label]) => ({ value, label })),
              ]}
            />
            <FormSelect
              value={category}
              onValueChange={setCategory}
              ariaLabel="Filter by action"
              triggerClassName={cn(INPUT_SMALL, "h-8")}
              options={[
                { value: "", label: "All actions" },
                ...AUDIT_CATEGORIES.map((value) => ({
                  value,
                  label:
                    AUDIT_CATEGORY_LABEL[value].charAt(0).toUpperCase() +
                    AUDIT_CATEGORY_LABEL[value].slice(1),
                })),
              ]}
            />
            {filtered ? (
              <Button
                variant="admin-ghost"
                size="admin-sm"
                onClick={() => {
                  setPerson("");
                  setCategory("");
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {rows.length ? (
        <ScrollArea className="mt-3.5 pr-2.5" viewportClassName="max-h-112">
          <ul className="flex flex-col gap-2">
            {rows.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </ul>
        </ScrollArea>
      ) : (
        <div className="mt-3">
          <EmptyState
            icon={History}
            title={filtered ? "No matching events" : "Nothing recorded yet"}
            description={
              filtered
                ? "Adjust the filters to see more activity."
                : "Changes to links, variables and access appear here."
            }
          />
        </div>
      )}
    </section>
  );
}

function AuditRow({ entry }: { entry: ProjectAuditEntry }) {
  const [open, setOpen] = useState(false);
  const device = deviceLabel(entry.userAgent);
  const occurred = new Date(entry.occurredAt);
  const tone = AUDIT_CATEGORY_TONE[entry.category];
  const place = [entry.group, entry.version].filter(Boolean).join(" · ");
  const role = entry.actorRole
    ? (ROLE_LABELS[entry.actorRole as TeamRole] ?? entry.actorRole)
    : null;

  return (
    <li className="overflow-hidden rounded-[13px] border border-black/[0.07] bg-white">
      <div className="px-3.5 py-3">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
          <span
            className={cn(
              "mt-0.5 shrink-0 rounded-full border px-1.75 py-0.75 font-mono text-[8.5px] tracking-[0.06em] uppercase",
              TONE_SOFT[tone],
            )}
          >
            {AUDIT_CATEGORY_LABEL[entry.category]}
          </span>

          <p className="min-w-0 flex-1 text-[12.5px] leading-5 text-black/55">
            <span className="font-semibold text-black/80">{entry.actor}</span>{" "}
            {auditPhrase(entry.action)}{" "}
            <span className="font-mono text-[11.5px] font-semibold break-all text-black/80">
              {entry.target}
            </span>
          </p>

          <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] text-black/40 tabular-nums">
            <Clock3 className="size-3" />
            {shortStamp(occurred)}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pl-0 sm:pl-[3.6rem]">
          {place ? (
            <span className="text-[11.5px] text-black/45">{place}</span>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={() => setOpen((was) => !was)}
            aria-expanded={open}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded text-[11.5px] text-black/50 transition-colors duration-150 hover:text-black",
              FOCUS_RING,
            )}
          >
            Details
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      {open ? (
        <dl className="space-y-2 border-t border-black/[0.06] bg-black/[0.015] px-3.5 pt-3 pb-3.5">
          <Fact label="What">{auditActionLabel(entry.action)}</Fact>
          <Fact label="Who">
            {entry.actorEmail ?? entry.actor}
            {role ? (
              <span className="ml-1.5 font-mono text-[10px] text-black/40">
                {role}
              </span>
            ) : null}
          </Fact>
          {place ? <Fact label="Where">{place}</Fact> : null}
          <Fact label="From">
            {[entry.ip, device].filter(Boolean).join(" · ") || "Not recorded"}
          </Fact>
          <Fact label="Exact time">{fullStamp(occurred)}</Fact>
          {entry.detail ? <Fact label="Note">{entry.detail}</Fact> : null}
        </dl>
      ) : null}
    </li>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 font-mono text-[8.5px] tracking-[0.1em] text-black/40 uppercase sm:w-24 sm:pt-1">
        {label}
      </dt>
      <dd className="m-0 min-w-0 flex-1 text-xs break-words text-black/80">
        {children}
      </dd>
    </div>
  );
}

function shortStamp(value: Date) {
  return value.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fullStamp(value: Date) {
  return value.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
