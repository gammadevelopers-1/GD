import Link from "next/link";
import { ArrowUpRight, CalendarDays, CircleDot } from "lucide-react";
import type { PortalProject } from "@/data/portal";
import { Card, CardContent } from "@/components/ui/card";
import {
  TONE_BAR,
  TONE_CHIP,
  TONE_TEXT,
  deadlineSignal,
  formatDate,
  formatDateShort,
} from "@/lib/projects/format";
import {
  PROJECT_STATUS_CHIP,
  PROJECT_STATUS_LABEL,
  isProjectStatus,
} from "@/lib/projects/status";
import { bannerFitClass } from "@/lib/projects/banner";
import { cn } from "@/lib/utils";

export function PortalProjectCard({ project }: { project: PortalProject }) {
  const status = isProjectStatus(project.status) ? project.status : null;
  const deadline = deadlineSignal(project.dueOn, status ?? "building");
  const tone = project.overdueItems > 0 ? "danger" : "ok";

  return (
    <Link
      href={`/portal/${project.publicId}`}
      className="group focus-visible:outline-none"
    >
      <Card className="h-full gap-0 overflow-hidden border-black/[0.06] bg-white py-0 shadow-none transition duration-200 group-hover:-translate-y-0.5 group-hover:border-black/[0.14] group-hover:shadow-[0_18px_44px_rgba(20,23,26,0.07)] group-focus-visible:border-[#16a34a]/50">
        <PortalCardBanner project={project} />

        <CardContent className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            {project.bannerUrl ? (
              <h2 className="min-w-0 flex-1 truncate text-[17px] leading-tight font-semibold tracking-[-0.035em] transition-colors group-hover:text-[#08743d]">
                {project.name}
              </h2>
            ) : (
              <span className="min-w-0 flex-1" />
            )}
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-black/[0.035] text-black/25 transition-colors duration-300 group-hover:bg-[#2fe85c]/15 group-hover:text-[#08743d]">
              <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            {status ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  PROJECT_STATUS_CHIP[status],
                )}
              >
                <CircleDot className="size-3" />
                {PROJECT_STATUS_LABEL[status]}
              </span>
            ) : null}

            {project.currentWeek ? (
              <span className="inline-flex rounded-full bg-black/[0.04] px-2.5 py-1 text-[10px] font-semibold text-black/55">
                Week {project.currentWeek.number}
              </span>
            ) : null}
          </div>

          {project.totalItems ? (
            <div className="mt-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[9px] tracking-[0.14em] text-black/35 uppercase">
                  Progress
                </span>
                <span
                  className={cn("text-[11px] font-semibold", TONE_TEXT[tone])}
                >
                  {project.doneItems} of {project.totalItems}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
                <div
                  className={cn("h-full rounded-full", TONE_BAR[tone])}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
            {project.dueOn ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium",
                  TONE_CHIP[deadline.tone],
                )}
              >
                <CalendarDays className="size-3" />
                {formatDate(project.dueOn)}
              </span>
            ) : null}

            {project.currentWeek?.dueOn ? (
              <span className="text-[10.5px] text-black/35">
                Week {project.currentWeek.number} due{" "}
                {formatDateShort(project.currentWeek.dueOn)}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PortalCardBanner({ project }: { project: PortalProject }) {
  if (project.bannerUrl) {
    return (
      <div className="panel-dark relative h-24 shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.bannerUrl}
          alt=""
          className={cn(
            "absolute inset-0 size-full transition-transform duration-500 group-hover:scale-[1.03]",
            bannerFitClass(project.bannerFit),
          )}
        />
      </div>
    );
  }

  return (
    <div className="panel-dark relative flex h-24 shrink-0 items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2fe85c]/40 to-transparent" />
      <h3 className="font-display line-clamp-2 text-center text-[17px] leading-snug font-semibold tracking-[-0.035em] text-white">
        {project.name}
      </h3>
    </div>
  );
}
