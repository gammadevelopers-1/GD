import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDot,
  FolderKanban,
  PauseCircle,
  Plus,
  Radar,
  UserRound,
} from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { requireRole } from "@/data/auth";
import { getProjects } from "@/data/resources";
import type { ProjectStatus } from "@/data/dashboard";
import { cn } from "@/lib/utils";

export const metadata = { title: "Projects · Internal platform" };

const statusLabel: Record<ProjectStatus, string> = {
  discovery: "Discovery",
  building: "Building",
  review: "In review",
  live: "Live",
  retainer: "Retainer",
  paused: "Paused",
  closed: "Closed",
};

const statusStyle: Record<ProjectStatus, string> = {
  discovery: "border-sky-200/70 bg-sky-50 text-sky-700",
  building: "border-[#2fe85c]/25 bg-[#2fe85c]/10 text-[#08743d]",
  review: "border-amber-200/80 bg-amber-50 text-amber-700",
  live: "border-violet-200/70 bg-violet-50 text-violet-700",
  retainer: "border-cyan-200/70 bg-cyan-50 text-cyan-700",
  paused: "border-black/[0.07] bg-black/[0.035] text-black/50",
  closed: "border-black/[0.07] bg-black/[0.035] text-black/50",
};

export default async function ProjectsPage() {
  const viewer = await requireRole(["owner", "member"]);
  const projects = await getProjects(viewer);
  const activeProjects = projects.filter(
    (project) => project.status !== "paused" && project.status !== "closed",
  );
  const deliveryCount = projects.filter(
    (project) => project.status === "building" || project.status === "review",
  ).length;
  const liveCount = projects.filter(
    (project) => project.status === "live" || project.status === "retainer",
  ).length;
  const pausedCount = projects.filter(
    (project) => project.status === "paused",
  ).length;

  return (
    <div className="mx-auto max-w-[1480px]">
      <section className="relative overflow-hidden rounded-[26px] bg-[#15181b] px-5 py-6 text-white sm:px-7 sm:py-8 lg:px-9 lg:py-10">
        <div className="pointer-events-none absolute -top-40 right-0 size-96 rounded-full bg-[#2fe85c]/12 blur-3xl" />
        <div className="pointer-events-none absolute right-16 -bottom-32 size-72 rounded-full bg-emerald-300/[0.06] blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/[0.055]">
                <FolderKanban className="size-4 text-[#2fe85c]" />
              </span>
              <p className="font-mono text-[9px] tracking-[0.16em] text-[#69ee88] uppercase">
                Delivery workspace
              </p>
            </div>
            <h1 className="font-display mt-6 text-[2.35rem] leading-[0.98] font-semibold tracking-[-0.055em] sm:text-[3.25rem]">
              Every project,
              <br className="hidden sm:block" /> one clear view.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45 sm:text-[15px]">
              {viewer.role === "member"
                ? "Your assigned client work, delivery stage and next deadline—without searching through chats."
                : "See what is moving, what is waiting and who is leading each client engagement."}
            </p>
          </div>

          {viewer.role === "owner" ? (
            <Link
              href="/projects/new"
              data-button-fill
              className="button-fill-fx button-fill-fx--lift group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2fe85c] px-5 text-sm font-semibold text-[#101512] shadow-[0_16px_40px_rgba(47,232,92,0.16)] transition hover:shadow-[0_20px_48px_rgba(47,232,92,0.26)] sm:w-fit"
            >
              <Plus className="size-4" />
              <span className="button-fill-fx__label">New project</span>
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ) : null}
        </div>

        <div className="relative mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] lg:max-w-3xl lg:grid-cols-4">
          <Signal
            icon={Radar}
            label={viewer.role === "member" ? "My active" : "Active"}
            value={activeProjects.length}
          />
          <Signal icon={CircleDot} label="In delivery" value={deliveryCount} />
          <Signal
            icon={ArrowUpRight}
            label="Live / retainer"
            value={liveCount}
          />
          <Signal icon={PauseCircle} label="Paused" value={pausedCount} />
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[9px] tracking-[0.15em] text-[#08743d] uppercase">
              Portfolio
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] sm:text-2xl">
              {viewer.role === "member" ? "Assigned projects" : "All projects"}
            </h2>
          </div>
          <p className="text-xs text-black/40">
            {projects.length} project{projects.length === 1 ? "" : "s"} visible
          </p>
        </div>

        {projects.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => {
              const deadline = getDeadline(project.dueOn, project.status);
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group relative flex min-h-[270px] flex-col overflow-hidden rounded-[22px] border border-black/[0.075] bg-[#f8f8f3] p-5 shadow-[0_12px_34px_rgba(20,23,26,0.025)] transition duration-300 hover:-translate-y-1 hover:border-black/[0.12] hover:shadow-[0_22px_55px_rgba(20,23,26,0.08)] sm:p-6"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2fe85c]/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                        statusStyle[project.status],
                      )}
                    >
                      {statusLabel[project.status]}
                    </span>
                    <span className="grid size-9 place-items-center rounded-xl border border-black/[0.06] bg-white/60 text-black/28 transition group-hover:border-[#2fe85c]/30 group-hover:bg-[#2fe85c]/10 group-hover:text-[#08743d]">
                      <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>

                  <div className="mt-7">
                    <p className="font-mono text-[9px] tracking-[0.11em] text-black/30 uppercase">
                      {project.client}
                    </p>
                    <h3 className="mt-2 text-xl leading-6 font-semibold tracking-[-0.04em] transition-colors group-hover:text-[#08743d]">
                      {project.name}
                    </h3>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-3 border-t border-black/[0.06] pt-5">
                    <ProjectMeta
                      icon={UserRound}
                      label="Project lead"
                      value={project.lead}
                    />
                    <ProjectMeta
                      icon={CalendarDays}
                      label="Due date"
                      value={date(project.dueOn)}
                      tone={deadline.tone}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-black/[0.025] px-3 py-2.5">
                    <span className="text-[10px] text-black/38">
                      {project.startsOn
                        ? `Started ${date(project.startsOn)}`
                        : "Start date not set"}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold",
                        deadline.tone === "danger"
                          ? "text-red-700"
                          : deadline.tone === "warning"
                            ? "text-amber-700"
                            : "text-black/45",
                      )}
                    >
                      {deadline.label}
                    </span>
                  </div>

                  <span className="absolute top-6 right-17 font-mono text-[8px] text-black/15">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description={
              viewer.role === "owner"
                ? "Create the first project, then assign its team and weekly milestones."
                : "Projects will appear here as soon as an owner assigns you."
            }
          />
        )}
      </section>
    </div>
  );
}

function Signal({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Radar;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#1a1e21] px-4 py-4 sm:px-5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.055] text-white/35">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-lg leading-none font-semibold tracking-[-0.04em]">
          {value}
        </p>
        <p className="mt-1.5 text-[9px] text-white/32">{label}</p>
      </div>
    </div>
  );
}

function ProjectMeta({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  tone?: "default" | "warning" | "danger";
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
              : "text-black/62",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function getDeadline(dueOn: string | null, status: ProjectStatus) {
  if (!dueOn) {
    return { label: "Schedule needed", tone: "warning" as const };
  }

  if (status === "closed") {
    return { label: "Completed", tone: "default" as const };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueOn}T00:00:00`);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);

  if (days < 0) {
    return {
      label: `${Math.abs(days)}d past due`,
      tone: "danger" as const,
    };
  }
  if (days === 0) return { label: "Due today", tone: "warning" as const };
  if (days <= 14) {
    return { label: `Due in ${days}d`, tone: "warning" as const };
  }
  return { label: "On schedule", tone: "default" as const };
}

function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(`${value}T00:00:00`))
    : "Not set";
}
