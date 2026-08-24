import { Suspense } from "react";
import { PanelSkeleton } from "@/components/admin/skeletons";
import {
  type LinkActions,
  WorkingLinks,
} from "@/components/admin/projects/working-links";
import {
  type EnvActions,
  EnvPanel,
} from "@/components/admin/projects/env-panel";
import { AuditHistory } from "@/components/admin/projects/audit-history";
import { requireRole } from "@/data/auth";
import { getProjectCore, getProjectMembers } from "@/data/project-detail";
import { getProjectLinks } from "@/data/project-links";
import { getEnvFiles, getEnvGroups } from "@/data/env";
import { getCopyVariables, getMergeRows, getMyCopies } from "@/data/env-copies";
import { EnvCompare } from "@/components/admin/projects/env-compare";
import { EnvMyCopy } from "@/components/admin/projects/env-my-copy";
import { buildMerge } from "@/lib/projects/env-merge";
import {
  adoptIntoMain,
  createMyCopy,
  removeMyVariable,
  saveMyVariables,
} from "../../../env-copy-actions";
import { getProjectCredentials } from "@/data/credentials";
import { getProjectAudit } from "@/data/project-audit";
import { credentialsConfigured } from "@/lib/credentials/crypto";
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
  shareEnvGroups,
  deleteEnvFile,
  deleteEnvGroup,
  deleteEnvVariable,
  downloadEnvFile,
  grantEnvAccess,
  renameEnvGroup,
  revokeEnvAccess,
  saveEnvVariables,
  updateEnvVariable,
  uploadEnvFile,
} from "../../../env-actions";

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

  // Five independent reads. They used to run as two waves with the member list
  // and the technical row already paid for by the shared project query.
  const [links, members, credentials, envGroups, envFiles] =
    await Promise.all([
      getProjectLinks(project.id, viewer),
      getProjectMembers(project.id, project.leadId),
      getProjectCredentials(project.id, viewer),
      getEnvGroups(project.id, viewer),
      getEnvFiles(project.id, viewer),
    ]);

  const audit = isOwner ? await getProjectAudit(project.id, viewer) : [];
  const onThisProject =
    isOwner || members.some((member) => member.id === viewer.id);

  const [copies, mergeRows] = await Promise.all([
    onThisProject ? getMyCopies(project.id, viewer) : Promise.resolve([]),
    getMergeRows(project.id, viewer),
  ]);

  const copyVariables = Object.fromEntries(
    await Promise.all(
      copies.map(
        async (copy) => [copy.id, await getCopyVariables(copy.id)] as const,
      ),
    ),
  );

  const mergeKeys = buildMerge(mergeRows);
  const mainGroupId =
    mergeRows.find((row) => row.isMain)?.groupId ?? envGroups[0]?.id ?? null;

  const linkActions: LinkActions = {
    setLink: setProjectLink,
    renameLink: renameProjectLink,
    clearLink: clearProjectLink,
    addLink: addProjectLink,
    deleteLink: deleteProjectLink,
  };

  const envActions: EnvActions = {
    createGroup: createEnvGroup,
    shareGroups: shareEnvGroups,
    renameGroup: renameEnvGroup,
    deleteGroup: deleteEnvGroup,
    saveVariables: saveEnvVariables,
    updateVariable: updateEnvVariable,
    deleteVariable: deleteEnvVariable,
    grantAccess: grantEnvAccess,
    revokeAccess: revokeEnvAccess,
    uploadFile: uploadEnvFile,
    deleteFile: deleteEnvFile,
    downloadFile: downloadEnvFile,
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

      <EnvPanel
        projectId={project.id}
        groups={envGroups}
        variables={credentials.filter((entry) => !entry.isArchived)}
        files={envFiles}
        members={members.map((member) => ({
          id: member.id,
          name: member.name,
        }))}
        isOwner={isOwner}
        vaultReady={credentialsConfigured()}
        actions={envActions}
      />

      {isOwner && mergeKeys.length ? (
        <EnvCompare
          mainGroupId={mainGroupId}
          keys={mergeKeys}
          adopt={adoptIntoMain}
        />
      ) : null}

      {onThisProject ? (
        <EnvMyCopy
          projectId={project.id}
          copies={copies}
          variables={copyVariables}
          createCopy={createMyCopy}
          saveVariables={saveMyVariables}
          removeVariable={removeMyVariable}
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
