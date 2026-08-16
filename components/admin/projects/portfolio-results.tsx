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
import { Spotlight } from "@/components/admin/spotlight";
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
} from "@/lib/projects/format";
import {
  PROJECT_STATUS_CHIP,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_TONE,
  isExitStatus,
} from "@/lib/projects/status";
import type { PortfolioQuery } from "@/lib/projects/portfolio-query";
import { isPortfolioFiltered } from "@/lib/projects/portfolio-query";
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
    <div className="space-y-5">
      <Spotlight className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat icon={CircleDot} label="In delivery" value={inDelivery} />
        <Stat
          icon={AlertTriangle}
          label="Overdue work"
          value={overdue}
          tone={overdue ? "danger" : "muted"}
        />
        <Stat
          icon={CalendarDays}
          label="Due in 14 days"
          value={dueSoon}
          tone={dueSoon ? "warning" : "muted"}
        />
        <Stat icon={PauseCircle} label="Paused or closed" value={parked} />
      </Spotlight>

      <Spotlight
        className={cn(
          "grid gap-3 sm:grid-cols-2",
          query.view === "grid" ? "xl:grid-cols-3" : "lg:hidden",
        )}
      >
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} isOwner={isOwner} />
        ))}
      </Spotlight>

      {query.view === "table" ? (
        <div className="hidden overflow-hidden rounded-[18px] border border-black/[0.07] bg-white/60 backdrop-blur-sm lg:block">
          <div
            aria-hidden
            className={cn(
              "grid gap-4 border-b border-black/[0.06] px-5 py-2.5 text-[10px] font-medium tracking-[0.04em] text-black/32 uppercase",
              isOwner
                ? "grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))_minmax(0,0.9fr)]"
                : "grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))]",
            )}
          >
            <span>Project</span>
            <span>Status</span>
            <span>Lead</span>
            <span>Due</span>
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
      href={`/projects/${project.id}`}
      className="spot edge-lit group flex flex-col overflow-hidden rounded-[18px] border border-black/[0.07] bg-white/65 p-4 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#2fe85c]/35 hover:bg-white/90 hover:shadow-[0_20px_46px_-18px_rgba(20,23,26,0.28)] focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:outline-none sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] text-black/35">
            {project.clientName}
          </p>
          <h3 className="mt-1 truncate text-[17px] leading-tight font-semibold tracking-[-0.035em] transition-colors group-hover:text-[#08743d]">
            {project.name}
          </h3>
        </div>
        <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-black/20 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#08743d]" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
            PROJECT_STATUS_CHIP[project.status],
          )}
        >
          {PROJECT_STATUS_LABEL[project.status]}
        </span>
        {project.isArchived ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            <Archive className="size-3" /> Archived
          </span>
        ) : null}
        <span className={cn("ml-auto text-[11px]", TONE_TEXT[deadline.tone])}>
          {project.dueOn ? formatDate(project.dueOn) : "No due date"}
        </span>
      </div>

      <div className="mt-4 border-t border-black/[0.06] pt-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[12px] text-black/50">
            {project.currentWeek
              ? `Week ${project.currentWeek.number} · ${project.currentWeek.done}/${project.currentWeek.total}`
              : "No plan yet"}
          </span>
          <span className="font-mono text-[11px] text-black/40">
            {project.progress}%
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/[0.07]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              TONE_BAR[delivery.tone],
            )}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
            TONE_CHIP[delivery.tone],
          )}
        >
          {delivery.label}
        </span>
        <span className="truncate text-[11px] text-black/40">
          {project.leadName ?? "No lead"}
        </span>
      </div>

      {isOwner && project.value ? (
        <p className="mt-3 font-mono text-[12px] font-semibold text-black/55">
          {formatMoney(project.value.amount, project.value.currency)}
        </p>
      ) : null}
    </Link>
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
      href={`/projects/${project.id}`}
      className={cn(
        "group grid items-center gap-4 px-5 py-3 transition hover:bg-[#2fe85c]/[0.06] focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:outline-none",
        isOwner
          ? "grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))_minmax(0,0.9fr)]"
          : "grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))]",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold tracking-[-0.02em] transition-colors group-hover:text-[#08743d]">
            {project.name}
          </p>
          {project.isArchived ? (
            <Archive className="size-3 shrink-0 text-amber-700" />
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-black/38">
          {project.clientName}
        </p>
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

      <p className="truncate text-[12px] text-black/55">
        {project.leadName ?? "Unassigned"}
      </p>

      <div className="min-w-0">
        <p className="text-[12px] text-black/55">
          {formatDateShort(project.dueOn)}
        </p>
        <p className={cn("mt-0.5 text-[10px]", TONE_TEXT[deadline.tone])}>
          {deadline.label}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-1 w-full max-w-24 overflow-hidden rounded-full bg-black/[0.07]">
            <div
              className={cn("h-full rounded-full", TONE_BAR[delivery.tone])}
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-black/35">
            {project.progress}%
          </span>
        </div>
        <p className={cn("mt-1 text-[10px]", TONE_TEXT[delivery.tone])}>
          {project.currentWeek
            ? `Week ${project.currentWeek.number} · ${delivery.label}`
            : delivery.label}
        </p>
      </div>

      {isOwner ? (
        <p className="truncate text-right font-mono text-[11px] font-semibold text-black/55">
          {project.value
            ? formatMoney(project.value.amount, project.value.currency)
            : "—"}
        </p>
      ) : null}
    </Link>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = "muted",
}: {
  icon: typeof CircleDot;
  label: string;
  value: number;
  tone?: "muted" | "warning" | "danger";
}) {
  return (
    <div className="spot flex items-center gap-3 rounded-[14px] border border-black/[0.07] bg-white/55 px-4 py-3 backdrop-blur-sm transition duration-300 hover:border-black/[0.13] hover:bg-white/85">
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-[10px]",
          tone === "danger"
            ? "bg-red-500/10 text-red-700"
            : tone === "warning"
              ? "bg-amber-400/15 text-amber-700"
              : "bg-black/[0.045] text-black/35",
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-lg leading-none font-semibold tracking-[-0.04em]">
          {value}
        </p>
        <p className="mt-1.5 truncate text-[11px] text-black/42">{label}</p>
      </div>
    </div>
  );
}
