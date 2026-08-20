import { Suspense } from "react";
import { WeekPlan } from "@/components/admin/projects/week-plan";
import { WorkspaceSkeleton } from "@/components/admin/projects/workspace-skeleton";
import { requireRole } from "@/data/auth";
import { getProjectCore, getProjectWeeks } from "@/data/project-detail";
import {
  addMilestoneWeek,
  setMilestoneWeekArchived,
  setMilestoneWeekComplete,
} from "../../../milestone-actions";
import { uploadIdeaAttachment } from "../../../idea-actions";
import {
  acceptCarryOver,
  acceptWeekTasks,
  dismissCarryOver,
  saveTask,
  saveWeekIdeaBoard,
  setTaskDone,
  suggestWeekTasks,
} from "../../../week-actions";

export default async function ProjectMilestonePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId: publicId } = await params;

  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <WorkspaceSection publicId={publicId} />
    </Suspense>
  );
}

async function WorkspaceSection({ publicId }: { publicId: string }) {
  const [viewer, project] = await Promise.all([
    requireRole(["owner", "member"]),
    getProjectCore(publicId),
  ]);
  if (!project) return null;

  const isOwner = viewer.role === "owner";
  const plan = await getProjectWeeks(project.id, isOwner);

  // The old page read the whole member list to answer this. The lead id and the
  // viewer's own membership are the only facts it needs, and both are already here.
  const onThisProject = isOwner || viewer.id === project.leadId;
  const canPlan = isOwner || viewer.id === project.leadId;
  const archived = project.isArchived;

  return (
    <WeekPlan
      projectId={project.id}
      weeks={plan.weeks}
      currentWeekId={plan.currentWeek?.id ?? null}
      progress={plan.progress}
      canPlan={canPlan && !archived}
      isOwner={isOwner && !archived}
      canWrite={onThisProject && !archived}
      canManage={canPlan && !archived}
      canTick={onThisProject && !archived}
      dismissedCarry={plan.dismissedCarry}
      acceptCarry={acceptCarryOver}
      dismissCarry={dismissCarryOver}
      setComplete={setMilestoneWeekComplete}
      addWeek={addMilestoneWeek}
      archiveWeek={setMilestoneWeekArchived}
      saveIdeaBoard={saveWeekIdeaBoard}
      upload={uploadIdeaAttachment}
      workActions={{
        saveTask,
        setTaskDone,
        suggest: suggestWeekTasks,
        accept: acceptWeekTasks,
      }}
    />
  );
}
