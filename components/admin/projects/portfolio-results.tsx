import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  ArrowUpRight,
  CalendarDays,
  CircleDot,
  FolderKanban,
  PauseCircle,
  Plus,
  SearchX,
  X,
} from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { Progress } from "@/components/ui/progress";
import type { PortfolioProject } from "@/data/portfolio";
import type { AppRole } from "@/data/auth";
import {
  TONE_BAR,
  TONE_CHIP,
  TONE_TEXT,
  deadlineSignal,
  deliverySignal,
  formatDate,
  formatDateShort,
  formatMoney,
  initials,
} from "@/lib/projects/format";
import {
  PROJECT_STATUS_CHIP,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_TONE,
  isExitStatus,
} from "@/lib/projects/status";
import type { PortfolioQuery } from "@/lib/projects/portfolio-query";
import { isPortfolioFiltered } from "@/lib/projects/portfolio-query";
import { bannerFitClass } from "@/lib/projects/banner";
import { TONE_SOFT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export function PortfolioResults({
  projects,
  query,
  role,
}: {
  projects: PortfolioProject[];
  query: PortfolioQuery;
  role: AppRole;
}) {
  const isOwner = role === "owner";
  const filtered = isPortfolioFiltered(query);

  if (!projects.length) {
    return filtered ? (
      <EmptyState
        icon={SearchX}
        title="Nothing matches these filters"
        description="Try a different status, client or person."
        action={
          <Link
            href={query.view === "table" ? "/projects?view=table" : "/projects"}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/[0.09] bg-white px-4 text-xs font-semibold text-black/70 transition hover:border-black/20 hover:text-black"
          >
            <X className="size-3.5" />
            Clear filters
          </Link>
        }
      />
    ) : (
      <EmptyState
        icon={FolderKanban}
        title={isOwner ? "No projects yet" : "Nothing assigned to you yet"}
        description={
          isOwner
            ? "Create one, add its team, then plan the first week."
            : "Projects appear here as soon as an owner assigns you."
        }
        action={
          isOwner ? (
            <Link
              href="/projects/new"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#15181b] px-4 text-xs font-semibold text-white transition hover:bg-black"
            >
              <Plus className="size-3.5" />
              Create the first project
            </Link>
          ) : null
        }
      />
    );
  }

  const total = projects.length;
  const inDelivery = projects.filter(
    (project) => !isExitStatus(project.status) && !project.isArchived,
  ).length;
  const overdue = projects.filter(
    (project) => project.overdueItems > 0 && !isExitStatus(project.status),
  ).length;
  const dueSoon = projects.filter((project) => {
    if (isExitStatus(project.status) || !project.dueOn) return false;
    return deadlineSignal(project.dueOn, project.status).tone === "warning";
  }).length;
  const parked = projects.filter((project) =>
    isExitStatus(project.status),
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={CircleDot}
          label="In delivery"
          value={inDelivery}
          note={`of ${total} shown`}
        />
        <Stat
          icon={AlertTriangle}
          label="Overdue work"
          value={overdue}
          note={overdue ? "needs attention" : "nothing slipping"}
          tone={overdue ? "danger" : "muted"}
        />
        <Stat
          icon={CalendarDays}
          label="Due in 14 days"
          value={dueSoon}
          note={dueSoon ? "closing soon" : "nothing imminent"}
          tone={dueSoon ? "warning" : "muted"}
        />
        <Stat
          icon={PauseCircle}
          label="Paused or closed"
          value={parked}
          note="out of delivery"
        />
      </div>

      <div
        className={cn(
          "grid gap-3 sm:grid-cols-2",
          query.view === "grid" ? "xl:grid-cols-3" : "lg:hidden",
        )}
      >
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} isOwner={isOwner} />
        ))}
      </div>

      {query.view === "table" ? (
        <div className="card-surface hidden overflow-hidden rounded-2xl border border-black/[0.06] lg:block">
          <div
            aria-hidden
            className={cn(
              "grid gap-4 border-b border-black/[0.06] bg-black/[0.015] px-5 py-2.5 text-[11px] font-medium text-black/38",
              isOwner
                ? "grid-cols-[minmax(0,2.4fr)_repeat(4,minmax(0,1fr))_minmax(0,0.9fr)]"
                : "grid-cols-[minmax(0,2.4fr)_repeat(4,minmax(0,1fr))]",
            )}
          >
            <span>Project</span>
            <span>Status</span>
            <span>Lead</span>
            <span>Dates</span>
            <span>Delivery</span>
            {isOwner ? <span className="text-right">Value</span> : null}
          </div>
          <div className="divide-y divide-black/[0.05]">
            {projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                isOwner={isOwner}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProjectCard({
  project,
  isOwner,
}: {
  project: PortfolioProject;
  isOwner: boolean;
}) {
  const delivery = deliverySignal(project);
  const deadline = deadlineSignal(project.dueOn, project.status);

  return (
    <Link
      href={`/projects/${project.publicId}`}
      className="edge-lit card-surface card-lift group flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] hover:border-[#2fe85c]/40 focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:outline-none"
    >
      <CardBanner project={project} />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-black/35">
              {project.clientName ?? "No client"}
            </p>
            {isOwner && project.clientAccess !== "none" ? (
              <span
                className={cn(
                  "mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                  project.clientAccess === "active"
                    ? TONE_SOFT.ok
                    : TONE_SOFT.info,
                )}
              >
                {project.clientAccess === "active"
                  ? "Client signed in"
                  : "Client invited"}
              </span>
            ) : null}
            {project.bannerUrl ? (
              <h3 className="mt-1 truncate text-[17px] leading-tight font-semibold tracking-[-0.035em] transition-colors group-hover:text-[#08743d]">
                {project.name}
              </h3>
            ) : null}
          </div>
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-black/[0.035] text-black/25 transition-colors duration-300 group-hover:bg-[#2fe85c]/15 group-hover:text-[#08743d]">
            <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
              PROJECT_STATUS_CHIP[project.status],
            )}
          >
            {PROJECT_STATUS_LABEL[project.status]}
          </span>
          {isExitStatus(project.status) ? null : (
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                TONE_CHIP[delivery.tone],
              )}
            >
              {delivery.label}
            </span>
          )}
          {project.isArchived ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
              <Archive className="size-3" /> Archived
            </span>
          ) : null}
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[12px] text-black/45">
              {project.currentWeek
                ? `Week ${project.currentWeek.number} · ${project.currentWeek.done} of ${project.currentWeek.total}`
                : "No plan yet"}
            </span>
            <span className="font-mono text-[12px] font-medium text-black/55">
              {project.progress}%
            </span>
          </div>
          <Progress
            value={project.progress}
            aria-label={`${project.name} progress`}
            className="mt-2 h-1.5 bg-black/[0.06]"
            indicatorClassName={cn(
              "rounded-full transition-transform duration-500",
              TONE_BAR[delivery.tone],
            )}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/[0.055] pt-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar name={project.leadName} />
            <span className="truncate text-[12px] text-black/55">
              {project.leadName ?? "No lead"}
            </span>
          </div>
          <span
            className={cn(
              "shrink-0 text-[12px] font-medium",
              TONE_TEXT[deadline.tone],
            )}
          >
            {project.dueOn ? (
              <>
                {project.startsOn ? (
                  <span className="font-normal text-black/35">
                    {formatDateShort(project.startsOn)} →{" "}
                  </span>
                ) : null}
                {formatDate(project.dueOn)}
              </>
            ) : (
              "No date"
            )}
          </span>
        </div>

        {isOwner && project.value ? (
          <p className="mt-3 font-mono text-[13px] font-semibold text-black/60">
            {formatMoney(project.value.amount, project.value.currency)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function CardBanner({ project }: { project: PortfolioProject }) {
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

function RowBanner({ project }: { project: PortfolioProject }) {
  return (
    <span className="panel-dark relative grid h-9 w-14 shrink-0 place-items-center overflow-hidden rounded-lg">
      {project.bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.bannerUrl}
          alt=""
          className={cn(
            "absolute inset-0 size-full",
            bannerFitClass(project.bannerFit),
          )}
        />
      ) : (
        <span className="text-[10px] font-semibold text-white/70">
          {initials(project.name)}
        </span>
      )}
    </span>
  );
}

function ProjectRow({
  project,
  isOwner,
}: {
  project: PortfolioProject;
  isOwner: boolean;
}) {
  const delivery = deliverySignal(project);
  const deadline = deadlineSignal(project.dueOn, project.status);

  return (
    <Link
      href={`/projects/${project.publicId}`}
      className={cn(
        "group grid items-center gap-4 px-5 py-3 transition-colors duration-200 hover:bg-[#2fe85c]/[0.05] focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:outline-none",
        isOwner
          ? "grid-cols-[minmax(0,2.4fr)_repeat(4,minmax(0,1fr))_minmax(0,0.9fr)]"
          : "grid-cols-[minmax(0,2.4fr)_repeat(4,minmax(0,1fr))]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <RowBanner project={project} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-[13px] font-semibold tracking-[-0.02em] transition-colors group-hover:text-[#08743d]">
              {project.name}
            </p>
            {project.isArchived ? (
              <Archive className="size-3 shrink-0 text-amber-700" />
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-black/38">
            {project.clientName ?? "No client"}
          </p>
        </div>
      </div>

      <div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            PROJECT_STATUS_TONE[project.status],
          )}
        >
          {PROJECT_STATUS_LABEL[project.status]}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <Avatar name={project.leadName} />
        <span className="truncate text-[12px] text-black/55">
          {project.leadName ?? "Unassigned"}
        </span>
      </div>

      <div className="min-w-0">
        <p className="truncate text-[12px] text-black/60">
          {project.startsOn ? (
            <span className="text-black/35">
              {formatDateShort(project.startsOn)} →{" "}
            </span>
          ) : null}
          {formatDateShort(project.dueOn)}
        </p>
        <p className={cn("mt-0.5 text-[11px]", TONE_TEXT[deadline.tone])}>
          {deadline.label}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Progress
            value={project.progress}
            aria-label={`${project.name} progress`}
            className="h-1.5 w-full max-w-24 bg-black/[0.06]"
            indicatorClassName={cn("rounded-full", TONE_BAR[delivery.tone])}
          />
          <span className="font-mono text-[11px] text-black/45">
            {project.progress}%
          </span>
        </div>
        <p className={cn("mt-1 text-[11px]", TONE_TEXT[delivery.tone])}>
          {isExitStatus(project.status)
            ? "Out of delivery"
            : project.currentWeek
              ? `Week ${project.currentWeek.number} · ${delivery.label}`
              : delivery.label}
        </p>
      </div>

      {isOwner ? (
        <p className="truncate text-right font-mono text-[12px] font-semibold text-black/60">
          {project.value
            ? formatMoney(project.value.amount, project.value.currency)
            : "—"}
        </p>
      ) : null}
    </Link>
  );
}

function Avatar({ name }: { name: string | null }) {
  if (!name) {
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-dashed border-black/15 text-[9px] text-black/25">
        —
      </span>
    );
  }

  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#15181b] text-[9px] font-semibold text-[#2fe85c]">
      {initials(name)}
    </span>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  note,
  tone = "muted",
}: {
  icon: typeof CircleDot;
  label: string;
  value: number;
  note: string;
  tone?: "muted" | "warning" | "danger";
}) {
  return (
    <div className="card-surface flex items-start justify-between gap-3 rounded-2xl border border-black/[0.06] p-4 hover:border-black/[0.12]">
      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium text-black/45">
          {label}
        </p>
        <p className="mt-2 text-[26px] leading-none font-semibold tracking-[-0.05em]">
          {value}
        </p>
        <p
          className={cn(
            "mt-2 truncate text-[11px]",
            tone === "danger"
              ? "text-red-700"
              : tone === "warning"
                ? "text-amber-700"
                : "text-black/35",
          )}
        >
          {note}
        </p>
      </div>
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          tone === "danger"
            ? "bg-red-500/10 text-red-600"
            : tone === "warning"
              ? "bg-amber-400/15 text-amber-600"
              : "bg-[#2fe85c]/12 text-[#08743d]",
        )}
      >
        <Icon className="size-[18px]" />
      </span>
    </div>
  );
}
