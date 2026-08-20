import { InviteClient } from "@/components/admin/clients/invite-client";
import { getProjectInviteContext } from "@/data/clients";
import type { Viewer } from "@/data/auth";

export async function InviteClientLauncher({
  projectId,
  viewer,
}: {
  projectId: string;
  viewer: Viewer;
}) {
  const context = await getProjectInviteContext(projectId, viewer);
  return <InviteClient projectId={projectId} context={context} />;
}
