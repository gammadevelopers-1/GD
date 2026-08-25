import { Suspense } from "react";
import { PanelSkeleton } from "@/components/admin/skeletons";
import {
  type LinkActions,
  WorkingLinks,
} from "@/components/admin/projects/working-links";
import {
  EnvWorkspace,
  type EnvWorkspaceActions,
} from "@/components/admin/projects/env-workspace";
import { AuditHistory } from "@/components/admin/projects/audit-history";
import { requireRole } from "@/data/auth";
import { getProjectCore, getProjectMembers } from "@/data/project-detail";
import { getProjectLinks } from "@/data/project-links";
import { getEnvWorkspace } from "@/data/env-workspace";
import { getProjectAudit } from "@/data/project-audit";
import {
  addProjectLink,
  clearProjectLink,
  deleteProjectLink,
  renameProjectLink,
  setProjectLink,
} from "../../../link-actions";
import {
  copyEnvValue,
  createEnvGroup,
  deleteEnvVariable,
  grantEnvAccess,
  renameEnvGroup,
  saveEnvVariables,
  updateEnvVariable,
} from "../../../env-actions";
import {
  createMyCopy,
  adoptIntoMain,
  saveMyVariables,
} from "../../../env-copy-actions";
import {
  deleteEnvVersion,
  deleteMyGroup,
  moveEnvVariable,
  renameMyGroup,
  shareMainEnv,
} from "../../../env-version-actions";

export default async function ProjectTechnicalPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId: publicId } = await params;

  return (
    <Suspense fallback={<TechnicalSkeleton />}>
      <TechnicalSections publicId={publicId} />
    </Suspense>
  );
}

async function TechnicalSections({ publicId }: { publicId: string }) {
  const [viewer, project] = await Promise.all([
    requireRole(["owner", "member"]),
    getProjectCore(publicId),
  ]);
  if (!project) return null;

  const isOwner = viewer.role === "owner";
  const canManageLinks =
    (isOwner || viewer.id === project.leadId) && !project.isArchived;

  const [links, members, workspace] = await Promise.all([
    getProjectLinks(project.id, viewer),
    getProjectMembers(project.id, project.leadId),
    getEnvWorkspace(project.id, viewer),
  ]);

  const onThisProject =
    isOwner || members.some((member) => member.id === viewer.id);

  const audit = isOwner ? await getProjectAudit(project.id, viewer) : [];

  const linkActions: LinkActions = {
    setLink: setProjectLink,
    renameLink: renameProjectLink,
    clearLink: clearProjectLink,
    addLink: addProjectLink,
    deleteLink: deleteProjectLink,
  };

  const envActions: EnvWorkspaceActions = {
    addVariable: saveMyVariables,
    editVariable: updateEnvVariable,
    addMainVariable: saveEnvVariables,
    uploadMain: saveEnvVariables,
    createVersion: createMyCopy,
    shareAll: shareMainEnv,
    deleteVariable: deleteEnvVariable,
    moveVariable: moveEnvVariable,
    createMainGroup: createEnvGroup,
    renameMainGroup: renameEnvGroup,
    createVersionGroup: createMyCopy,
    renameVersionGroup: renameMyGroup,
    deleteVersionGroup: deleteMyGroup,
    upload: saveMyVariables,
    adopt: adoptIntoMain,
    share: grantEnvAccess,
    deleteVersion: deleteEnvVersion,
    copy: copyEnvValue,
  };

  return (
    <div className="space-y-8">
      <WorkingLinks
        projectId={project.id}
        links={links}
        canManage={canManageLinks}
        actions={linkActions}
      />

      {onThisProject ? (
        <EnvWorkspace
          projectId={project.id}
          workspace={workspace}
          members={members.map((member) => ({
            id: member.id,
            name: member.name,
          }))}
          isOwner={isOwner}
          viewerId={viewer.id}
          actions={envActions}
        />
      ) : null}

      {isOwner ? <AuditHistory entries={audit} /> : null}
    </div>
  );
}

function TechnicalSkeleton() {
  return (
    <div className="space-y-6">
      <PanelSkeleton lines={5} />
      <PanelSkeleton lines={5} />
    </div>
  );
}
