import { Suspense } from "react";
import { PanelSkeleton } from "@/components/admin/skeletons";
import {
  type TechnicalDetails,
  TechnicalPanel,
} from "@/components/admin/projects/technical-panel";
import {
  type EnvActions,
  EnvPanel,
} from "@/components/admin/projects/env-panel";
import { AuditHistory } from "@/components/admin/projects/audit-history";
import { requireRole } from "@/data/auth";
import {
  type ProjectCore,
  getProjectCore,
  getProjectMembers,
  getProjectTechnical,
} from "@/data/project-detail";
import { getEnvFiles, getEnvGroups } from "@/data/env";
import { getCredentialAudit, getProjectCredentials } from "@/data/credentials";
import { credentialsConfigured } from "@/lib/credentials/crypto";
import { saveTechnicalDetails } from "../../../technical-actions";
import {
  copyEnvValue,
  createEnvGroup,
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

  // Five independent reads. They used to run as two waves with the member list
  // and the technical row already paid for by the shared project query.
  const [technical, members, credentials, envGroups, envFiles] =
    await Promise.all([
      getProjectTechnical(project.id),
      getProjectMembers(project.id, project.leadId),
      getProjectCredentials(project.id, viewer),
      getEnvGroups(project.id, viewer),
      getEnvFiles(project.id, viewer),
    ]);

  const audit = isOwner ? await getCredentialAudit(credentials, viewer) : [];
  const onThisProject =
    isOwner || members.some((member) => member.id === viewer.id);

  const envActions: EnvActions = {
    createGroup: createEnvGroup,
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
      <TechnicalPanel
        projectId={project.id}
        details={toTechnicalDetails(technical)}
        canEdit={onThisProject}
        isArchived={project.isArchived}
        save={saveTechnicalDetails}
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

function toTechnicalDetails(
  technical: ProjectCore["technical"],
): TechnicalDetails | null {
  if (!technical) return null;

  return {
    repositoryUrl: technical.repositoryUrl ?? "",
    hostingUrl: technical.hostingUrl ?? "",
    liveDomain: technical.liveDomain ?? "",
    stagingDomain: technical.stagingDomain ?? "",
    designUrl: technical.designUrl ?? "",
    stackNotes: technical.stackNotes ?? "",
    onboardingNotes: technical.onboardingNotes ?? "",
    updatedBy: technical.updatedBy,
    updatedAt: technical.updatedAt,
  };
}
