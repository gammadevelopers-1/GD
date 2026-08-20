import { Suspense } from "react";
import { PanelSkeleton } from "@/components/admin/skeletons";
import { TeamPanel } from "@/components/admin/projects/team-panel";
import { requireRole } from "@/data/auth";
import {
  getActivePeople,
  getProjectCore,
  getProjectMembers,
} from "@/data/project-detail";
import {
  addProjectMember,
  removeProjectMember,
  updateMemberResponsibility,
} from "../../../team-actions";

export default async function ProjectTeamPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId: publicId } = await params;

  return (
    <Suspense fallback={<TeamSkeleton />}>
      <TeamSection publicId={publicId} />
    </Suspense>
  );
}

async function TeamSection({ publicId }: { publicId: string }) {
  const [viewer, project] = await Promise.all([
    requireRole(["owner", "member"]),
    getProjectCore(publicId),
  ]);
  if (!project) return null;

  const isOwner = viewer.role === "owner";

  // The people list is only rendered for owners, so a member never pays for it.
  const [members, people] = await Promise.all([
    getProjectMembers(project.id, project.leadId),
    isOwner ? getActivePeople() : Promise.resolve([]),
  ]);

  return (
    <TeamPanel
      projectId={project.id}
      members={members}
      people={people}
      isOwner={isOwner}
      addMember={addProjectMember}
      updateResponsibility={updateMemberResponsibility}
      removeMember={removeProjectMember}
    />
  );
}

function TeamSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <PanelSkeleton lines={5} />
      <PanelSkeleton lines={4} />
    </div>
  );
}
