import {
  CalendarDays,
  CalendarRange,
  Check,
  History,
  Info,
  Signal,
} from "lucide-react";
import type { Portal } from "@/lib/portal/types";
import { summarise, today } from "@/lib/portal/types";
import { absoluteTime, timeAgo } from "@/lib/portal/format";
import { formatDate } from "@/lib/projects/format";
import { PROJECT_STATUS_LABEL } from "@/lib/projects/status";
import { TONE_SOFT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export function PortalOverview({ portal }: { portal: Portal }) {
  const now = today();
  const summary = summarise(portal.weeks, now);
  const { project } = portal;
  const updated = timeAgo(portal.lastUpdatedAt);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-4">
        <Panel title="Where we are" icon={Signal}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                summary.overdueWeeks ? TONE_SOFT.warning : TONE_SOFT.ok,
              )}
            >
              {summary.currentWeek
                ? `Week ${summary.currentWeek.number} of ${portal.weeks.length}`
                : portal.weeks.length
                  ? "All weeks closed"
                  : "Not planned yet"}
            </span>
            {summary.overdueWeeks ? (
              <span className="text-[11px] text-amber-700">
                {summary.overdueWeeks === 1
                  ? "One week is past its date with work still open"
                  : `${summary.overdueWeeks} weeks are past their date with work still open`}
              </span>
            ) : null}
          </div>

          {summary.total ? (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-black/45">
                <span>Overall progress</span>
                <span className="font-mono">{summary.percent}%</span>
              </div>
              <Progress
                value={summary.percent}
                aria-label="Overall progress"
                className="mt-2 h-2 bg-black/[0.07]"
                indicatorClassName="rounded-full bg-[#2fe85c] transition-transform duration-500"
              />
              <p className="mt-2 text-[11px] text-black/40">
                {summary.done} of {summary.total} milestones done
              </p>
            </div>
          ) : null}

          {summary.currentWeek ? (
            <div className="mt-5 rounded-xl border border-black/[0.06] bg-black/[0.015] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarRange className="size-4 text-black/35" />
                  <h3 className="text-sm font-semibold">
                    Week {summary.currentWeek.number}
                  </h3>
                  <span className="rounded-full bg-[#2fe85c]/15 px-2 py-0.5 text-[9px] font-semibold text-[#08743d]">
                    Current week
                  </span>
                </div>
                <span className="font-mono text-[10px] text-black/40">
                  {summary.currentWeek.items.filter((item) => item.done).length}
                  /{summary.currentWeek.items.length} done · due{" "}
                  {formatDate(summary.currentWeek.dueOn)}
                </span>
              </div>

              {summary.currentWeek.items.length ? (
                <ul className="mt-3 space-y-1.5">
                  {summary.currentWeek.items.slice(0, 4).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 text-[12.5px]"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-3.5 shrink-0 place-items-center rounded-[4px] border",
                          item.done
                            ? "border-[#2fe85c] bg-[#2fe85c] text-[#0b3f1e]"
                            : "border-black/20",
                        )}
                      >
                        {item.done ? <Check className="size-2.5" /> : null}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 truncate",
                          item.done ? "text-black/35" : "text-black/70",
                        )}
                      >
                        {item.title}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[12px] text-black/35">
                  Nothing planned for this week yet.
                </p>
              )}
            </div>
          ) : null}
        </Panel>

        {project.description ? (
          <Panel title="About this project" icon={Info}>
            <p className="text-sm leading-7 whitespace-pre-wrap text-black/60">
              {project.description}
            </p>
          </Panel>
        ) : null}
      </div>

      <div className="space-y-4">
        <Panel title="Next milestone" icon={CalendarDays}>
          {summary.nextItem ? (
            <>
              <p className="text-sm leading-6 font-medium text-black/80">
                {summary.nextItem.title}
              </p>
              <p className="mt-1.5 text-[12px] text-black/45">
                Week {summary.nextItem.week} · due{" "}
                {formatDate(summary.nextItem.dueOn)}
              </p>
            </>
          ) : (
            <p className="text-sm text-black/45">Nothing open.</p>
          )}
        </Panel>

        <Panel title="Project information" icon={Info}>
          <dl className="space-y-3.5">
            <Detail
              label="Status"
              value={PROJECT_STATUS_LABEL[project.status]}
            />
            <Detail label="Start date" value={formatDate(project.startsOn)} />
            <Detail label="Due date" value={formatDate(project.dueOn)} />
          </dl>
        </Panel>

        <Panel title="Last updated" icon={History}>
          <p className="text-sm leading-6 font-medium text-black/80">
            {updated ?? "No activity yet"}
          </p>
          {portal.lastUpdatedAt ? (
            <p className="mt-1.5 text-[12px] text-black/45">
              {absoluteTime(portal.lastUpdatedAt)}
            </p>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof CalendarDays;
  children: React.ReactNode;
}) {
  return (
    <section className="card-surface rounded-2xl border border-black/[0.06] p-5">
      <div className="mb-5 flex items-center gap-2.5">
        <Icon className="size-4 text-black/35" />
        <h2 className="text-[14px] font-semibold tracking-[-0.025em]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[12px] text-black/40">{label}</dt>
      <dd className="truncate text-[13px] font-medium text-black/80">
        {value}
      </dd>
    </div>
  );
}
