import { Archive } from "lucide-react";
import { BannerControl } from "@/components/admin/projects/banner-control";
import { EditProjectLink } from "@/components/admin/projects/edit-link";
import { StatusControl } from "@/components/admin/projects/status-control";
import { InviteClientLauncher } from "@/components/admin/clients/invite-client-launcher";
import type { ProjectShell } from "@/data/project-detail";
import { getProjectWeekStats } from "@/data/project-detail";
import type { Viewer } from "@/data/auth";
import { deadlineSignal, formatDate } from "@/lib/projects/format";
import { PROJECT_STATUS_LABEL } from "@/lib/projects/status";
import { bannerFitClass } from "@/lib/projects/banner";
import { cn } from "@/lib/utils";
import {
  removeProjectBanner,
  setProjectBanner,
} from "@/app/(admin)/projects/banner-actions";
import { setProjectStatus } from "@/app/(admin)/projects/actions";

function StatusBadge({
  project,
  isOwner,
}: {
  project: ProjectShell;
  isOwner: boolean;
}) {
  return isOwner ? (
    <StatusControl
      projectId={project.id}
      status={project.status}
      action={setProjectStatus}
    />
  ) : (
    <span className="bg-brand/12 text-gd-mint-bright inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold">
      {PROJECT_STATUS_LABEL[project.status]}
    </span>
  );
}

export function ProjectHeroCompact({
  project,
  viewer,
}: {
  project: ProjectShell;
  viewer: Viewer;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6">
      <span className="shrink-0 text-[11px] text-white/65">
        {project.clientName ?? "No client yet"}
      </span>
      <span aria-hidden className="shrink-0 text-white/45">
        /
      </span>
      <h1 className="font-display min-w-0 flex-1 truncate text-[15px] font-semibold tracking-[-0.03em]">
        {project.name}
      </h1>
      {project.isArchived ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
          <Archive className="size-3" /> Archived
        </span>
      ) : null}
      <div className="shrink-0">
        <StatusBadge project={project} isOwner={viewer.role === "owner"} />
      </div>
    </div>
  );
}

export function ProjectHeroFull({
  project,
  viewer,
  milestones,
}: {
  project: ProjectShell;
  viewer: Viewer;
  milestones: React.ReactNode;
}) {
  const isOwner = viewer.role === "owner";
  const canManageBanner =
    isOwner || (!project.isArchived && viewer.id === project.leadId);
  const deadline = deadlineSignal(project.dueOn, project.status);

  return (
    <>
      {project.bannerUrl ? (
        <div className="relative h-36 sm:h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.bannerUrl}
            alt=""
            className={cn(
              "absolute inset-0 size-full",
              bannerFitClass(project.bannerFit),
            )}
          />
          <div className="to-gd-panel-dark absolute inset-0 bg-gradient-to-b from-black/20 via-transparent" />
        </div>
      ) : null}
      <div className="relative px-4 pt-5 pb-5 sm:px-6">
        <div className="bg-brand/12 pointer-events-none absolute -top-32 right-8 size-80 rounded-full blur-3xl" />
        {project.bannerUrl ? null : (
          <div className="via-brand/45 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
        )}
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-white/65">
                {project.clientName ?? "No client yet"}
              </span>
              {project.isArchived ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  <Archive className="size-3" /> Archived
                </span>
              ) : null}
            </div>
            <h1 className="font-display mt-2 text-2xl font-semibold tracking-[-0.045em] sm:text-[2rem]">
              {project.name}
            </h1>
            {project.description ? (
              <p className="mt-2 max-w-2xl text-[13px] leading-5 text-white/80">
                {project.description}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {canManageBanner ? (
              <BannerControl
                projectId={project.id}
                hasBanner={Boolean(project.bannerUrl)}
                save={setProjectBanner}
                remove={removeProjectBanner}
              />
            ) : null}
            <StatusBadge project={project} isOwner={isOwner} />
            {isOwner ? (
              <InviteClientLauncher projectId={project.id} viewer={viewer} />
            ) : null}
            {isOwner ? <EditProjectLink publicId={project.publicId} /> : null}
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <HeaderMeta
            label="Project lead"
            value={project.leadName ?? "Unassigned"}
          />
          <HeaderMeta label="Team" value={`${project.memberCount} assigned`} />
          <HeaderMeta
            label="Due date"
            value={formatDate(project.dueOn)}
            note={deadline.label}
          />
          {milestones}
        </div>
      </div>
    </>
  );
}

export function HeaderMeta({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="hover:border-brand/30 min-w-0 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.06]">
      <p className="text-[10px] text-white/65">{label}</p>
      <p className="mt-1.5 truncate text-[12px] font-medium text-white/75">
        {value}
      </p>
      {note ? (
        <p className="mt-0.5 truncate text-[10px] text-white/65">{note}</p>
      ) : null}
    </div>
  );
}

export async function MilestoneMeta({ projectId }: { projectId: string }) {
  const stats = await getProjectWeekStats(projectId);

  return (
    <HeaderMeta
      label="Milestones"
      value={
        stats.weeks
          ? `${stats.closedWeeks}/${stats.weeks} weeks closed`
          : "Not planned"
      }
      note={
        stats.totalItems
          ? `${stats.doneItems}/${stats.totalItems} items done`
          : undefined
      }
    />
  );
}
