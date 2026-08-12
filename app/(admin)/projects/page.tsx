import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeading } from "@/components/admin/page-heading";
import { requireViewer } from "@/data/auth";
import { getProjects } from "@/data/resources";
import type { ProjectStatus } from "@/data/dashboard";

const statusStyle: Record<ProjectStatus, string> = {
  discovery: "bg-sky-500/10 text-sky-700",
  building: "bg-[#2fe85c]/15 text-[#08743d]",
  review: "bg-amber-400/15 text-amber-700",
  live: "bg-violet-500/10 text-violet-700",
  retainer: "bg-cyan-500/10 text-cyan-700",
  paused: "bg-black/5 text-black/45",
  closed: "bg-black/5 text-black/45",
};

export default async function ProjectsPage() {
  const viewer = await requireViewer();
  const projects = await getProjects();
  return (
    <div className="mx-auto max-w-[1480px]">
      <PageHeading
        eyebrow="Delivery"
        title="Projects"
        description={
          viewer.role === "member"
            ? "Only projects you are assigned to are visible here."
            : "Every client project, its owner, stage and delivery dates in one place."
        }
        action={
          viewer.role === "owner" ? (
            <Link
              href="/projects/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#15181b] px-4 text-sm font-semibold text-white"
            >
              <Plus className="size-4 text-[#2fe85c]" /> New project
            </Link>
          ) : undefined
        }
      />
      {projects.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group rounded-[20px] border border-black/[0.07] bg-[#f8f8f3] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(20,23,26,0.06)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${statusStyle[project.status]}`}
                >
                  {project.status}
                </span>
                <span className="font-mono text-[9px] text-black/30">
                  {date(project.dueOn)}
                </span>
              </div>
              <h2 className="mt-7 text-lg font-semibold tracking-[-0.035em] group-hover:text-[#08743d]">
                {project.name}
              </h2>
              <p className="mt-1 text-xs text-black/40">{project.client}</p>
              <div className="mt-6 flex items-center justify-between border-t border-black/[0.06] pt-4 text-[11px]">
                <span className="text-black/35">Project lead</span>
                <span className="font-medium text-black/60">
                  {project.lead}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={
            viewer.role === "owner"
              ? "Create the first project, then assign its team and weekly milestones."
              : "Projects will appear after an owner assigns you."
          }
        />
      )}
    </div>
  );
}

function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(`${value}T00:00:00`))
    : "No due date";
}
