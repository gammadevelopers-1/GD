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
  UserRound,
  X,
} from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
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
        title="No projects match these filters"
        description="Nothing in your portfolio matches the current search and filters."
        action={
          <Link
            href={query.view === "table" ? "/projects?view=table" : "/projects"}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/[0.09] bg-white px-4 text-xs font-semibold text-black/70 transition hover:border-black/20 hover:text-black"
          >
            <X className="size-3.5" />
            Clear all filters
          </Link>
        }
      />
    ) : (
      <EmptyState
        icon={FolderKanban}
        title={isOwner ? "No projects yet" : "No projects assigned to you"}
        description={
          isOwner
            ? "Create the first project, then add its team and plan the first milestone week."
            : "Projects appear here as soon as an owner assigns you to one."
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/[0.07] bg-black/[0.07] lg:grid-cols-4">
        <Stat icon={CircleDot} label="In delivery" value={inDelivery} />
        <Stat
          icon={AlertTriangle}
          label="With overdue work"
          value={overdue}
          tone={overdue ? "danger" : "muted"}
        />
        <Stat
          icon={CalendarDays}
          label="Due within 14 days"
          value={dueSoon}
          tone={dueSoon ? "warning" : "muted"}
        />
        <Stat icon={PauseCircle} label="Paused or closed" value={parked} />
      </div>

      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2",
          query.view === "grid" ? "xl:grid-cols-3" : "lg:hidden",
        )}
      >
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} isOwner={isOwner} />
        ))}
      </div>

      {query.view === "table" ? (
        <div className="hidden overflow-hidden rounded-[20px] border border-black/[0.07] bg-[#f8f8f3] lg:block">
          <div
            aria-hidden
            className={cn(
              "grid gap-4 border-b border-black/[0.07] px-5 py-3 font-mono text-[9px] tracking-[0.12em] text-black/35 uppercase",
              isOwner
                ? "grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))_minmax(0,0.9fr)]"
                : "grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))]",
            )}
          >
            <span>Project</span>
            <span>Status</span>
            <span>Project lead</span>
            <span>Due date</span>
            <span>Delivery</span>
            {isOwner ? <span className="text-right">Value</span> : null}
          </div>
          <div className="divide-y divide-black/[0.055]">
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
      className="group relative flex flex-col overflow-hidden rounded-[20px] border border-black/[0.075] bg-[#f8f8f3] p-4 shadow-[0_12px_34px_rgba(20,23,26,0.025)] transition duration-300 hover:-translate-y-1 hover:border-black/[0.12] hover:shadow-[0_22px_55px_rgba(20,23,26,0.08)] focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:outline-none sm:p-5"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2fe85c]/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold",
              PROJECT_STATUS_CHIP[project.status],
            )}
          >
            {PROJECT_STATUS_LABEL[project.status]}
          </span>
          {project.isArchived ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">
              <Archive className="size-3" /> Archived
            </span>
          ) : null}
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-black/[0.06] bg-white/60 text-black/30 transition group-hover:border-[#2fe85c]/30 group-hover:bg-[#2fe85c]/10 group-hover:text-[#08743d]">
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>

      <div className="mt-4">
        <p className="font-mono text-[9px] tracking-[0.11em] text-black/30 uppercase">
          {project.clientName}
        </p>
        <h3 className="mt-1.5 text-[17px] leading-[1.2] font-semibold tracking-[-0.035em] transition-colors group-hover:text-[#08743d]">
          {project.name}
        </h3>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-black/[0.06] pt-3.5">
        <Meta
          icon={UserRound}
          label="Project lead"
          value={project.leadName ?? "Unassigned"}
        />
        <Meta
          icon={CalendarDays}
          label="Due date"
          value={formatDate(project.dueOn)}
          tone={deadline.tone === "ok" ? undefined : deadline.tone}
        />
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-black/45">
            {project.currentWeek
              ? `Week ${project.currentWeek.number} · ${project.currentWeek.done}/${project.currentWeek.total} done`
              : "No milestone plan"}
          </span>
          <span className="font-mono text-black/35">{project.progress}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              TONE_BAR[delivery.tone],
            )}
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold",
              TONE_CHIP[delivery.tone],
            )}
          >
            {delivery.label}
          </span>
          {isOwner && project.value ? (
            <span className="rounded-full bg-[#15181b] px-2.5 py-1 font-mono text-[10px] font-semibold text-[#69ee88]">
              {formatMoney(project.value.amount, project.value.currency)}
            </span>
          ) : (
            <span className="text-[10px] text-black/35">
              {project.memberCount} on team
            </span>
          )}
        </div>
      </div>
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
        "grid items-center gap-4 px-5 py-3.5 transition hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:outline-none",
        isOwner
          ? "grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))_minmax(0,0.9fr)]"
          : "grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))]",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold tracking-[-0.02em]">
            {project.name}
          </p>
          {project.isArchived ? (
            <Archive className="size-3 shrink-0 text-amber-700" />
          ) : null}
        </div>
        <p className="mt-1 truncate text-[11px] text-black/40">
          {project.clientName}
        </p>
      </div>

      <div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
            PROJECT_STATUS_TONE[project.status],
          )}
        >
          {PROJECT_STATUS_LABEL[project.status]}
        </span>
      </div>

      <p className="truncate text-xs text-black/60">
        {project.leadName ?? "Unassigned"}
      </p>

      <div className="min-w-0">
        <p className="text-xs text-black/60">
          {formatDateShort(project.dueOn)}
        </p>
        <p className={cn("mt-0.5 text-[10px]", TONE_TEXT[deadline.tone])}>
          {deadline.label}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-full max-w-24 overflow-hidden rounded-full bg-black/[0.07]">
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
        <p className="truncate text-right font-mono text-[11px] font-semibold text-black/60">
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
    <div className="flex items-center gap-3 bg-[#f8f8f3] px-4 py-3">
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg",
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
        <p className="mt-1.5 truncate text-[10px] text-black/40">{label}</p>
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  tone?: "warning" | "danger" | "muted";
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-black/30">
        <Icon className="size-3.5" />
        <p className="text-[9px]">{label}</p>
      </div>
      <p
        className={cn(
          "mt-2 truncate text-[11px] font-semibold",
          tone === "danger"
            ? "text-red-700"
            : tone === "warning"
              ? "text-amber-700"
              : "text-black/60",
        )}
      >
        {value}
      </p>
    </div>
  );
}
