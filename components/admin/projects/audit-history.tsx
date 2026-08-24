"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Clock3,
  Copy,
  FolderPlus,
  History,
  Pencil,
  Plus,
  Share2,
  Trash2,
  UserRound,
} from "lucide-react";
import type { ProjectAuditEntry } from "@/data/project-audit";
import {
  AUDIT_CATEGORIES,
  AUDIT_CATEGORY_LABEL,
  type AuditCategory,
  auditActionLabel,
  deviceLabel,
} from "@/lib/projects/audit";
import { ROLE_LABELS, type TeamRole } from "@/lib/team/records";
import { FOCUS_RING, INPUT_SMALL, PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { FormSelect } from "@/components/common/form-select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";

const CATEGORY_ICON: Record<AuditCategory, typeof Plus> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  access: Copy,
  share: Share2,
  group: FolderPlus,
};

const CATEGORY_SKIN: Record<AuditCategory, string> = {
  create: "bg-blue-600/12 text-blue-900",
  update: "bg-gd-green/14 text-gd-green-ink",
  delete: "bg-red-100 text-red-700",
  access: "bg-black/[0.06] text-black/60",
  share: "bg-violet-500/14 text-violet-900",
  group: "bg-blue-600/10 text-blue-900",
};

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
        <ul className="mt-3.5 flex flex-col gap-2">
          {rows.map((entry) => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </ul>
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
  const Icon = CATEGORY_ICON[entry.category];
  const device = deviceLabel(entry.userAgent);
  const occurred = new Date(entry.occurredAt);

  return (
    <li className="overflow-hidden rounded-[13px] border border-black/[0.07] bg-white">
      <div className="flex items-start gap-3 px-3.5 py-3">
        <span
          className={cn(
            "mt-0.5 grid size-7.5 shrink-0 place-items-center rounded-lg",
            CATEGORY_SKIN[entry.category],
          )}
        >
          <Icon className="size-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black/[0.06] px-1.75 py-0.75 font-mono text-[8.5px] tracking-[0.06em] text-black/60 uppercase">
              {AUDIT_CATEGORY_LABEL[entry.category]}
            </span>
            <span className="font-mono text-xs font-semibold break-all text-black/80">
              {entry.target}
            </span>
            <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] text-black/40 tabular-nums">
              <Clock3 className="size-3" />
              {shortStamp(occurred)}
            </span>
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-black/50">
            <span className="inline-flex items-center gap-1.5 font-medium text-black/70">
              <UserRound className="size-3" />
              {entry.actor}
            </span>
            {entry.version ? (
              <>
                <span>·</span>
                <span>{entry.version}</span>
              </>
            ) : null}
            {entry.group ? (
              <>
                <span>·</span>
                <span>{entry.group}</span>
              </>
            ) : null}
          </p>

          <button
            type="button"
            onClick={() => setOpen((was) => !was)}
            aria-expanded={open}
            className={cn(
              "mt-2 inline-flex cursor-pointer items-center gap-1 rounded text-[11.5px] text-black/50 transition-colors duration-150 hover:text-black",
              FOCUS_RING,
            )}
          >
            View details
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
        <div className="border-t border-black/[0.06] bg-black/[0.015] px-3.5 pt-3 pb-3.5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            <Detail label="Actor">
              {entry.actor}
              {entry.actorRole ? (
                <span className="ml-1.5 font-mono text-[10px] text-black/40">
                  {ROLE_LABELS[entry.actorRole as TeamRole] ?? entry.actorRole}
                </span>
              ) : null}
            </Detail>
            <Detail label="Email" mono>
              {entry.actorEmail ?? "—"}
            </Detail>
            <Detail label="IP address" mono>
              {entry.ip ?? "Not recorded"}
            </Detail>
            <Detail label="Device">{device ?? "Not recorded"}</Detail>
            <Detail label="When" mono>
              {fullStamp(occurred)}
            </Detail>
            <Detail label="Event">{auditActionLabel(entry.action)}</Detail>
            <Detail label="Target" mono>
              {entry.target}
            </Detail>
            <Detail label="Version">{entry.version ?? "—"}</Detail>
            <Detail label="Group">{entry.group ?? "—"}</Detail>
          </dl>

          {entry.detail ? (
            <p className="mt-3 font-mono text-[10.5px] leading-relaxed text-black/45">
              {entry.detail}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function Detail({
  label,
  mono,
  children,
}: {
  label: string;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="mb-0.75 font-mono text-[8.5px] tracking-[0.1em] text-black/40 uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "m-0 break-words text-black/80",
          mono ? "font-mono text-[11.5px]" : "text-xs",
        )}
      >
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
