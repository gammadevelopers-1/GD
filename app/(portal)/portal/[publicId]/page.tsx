import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPortal,
  getPortalProjects,
  markPortalSeen,
  requirePortalAccess,
} from "@/data/portal";
import {
  type PortalMeta,
  PortalHero,
  PortalTopBar,
} from "@/components/portal/portal-header";
import { PortalOverview } from "@/components/portal/portal-overview";
import { PortalTeam } from "@/components/portal/portal-team";
import {
  type MilestoneActions,
  PortalMilestone,
} from "@/components/portal/portal-milestone";
import { isPortalTab } from "@/lib/portal/tabs";
import { heroMeta } from "@/lib/portal/hero";
import { saveWeekIdeas, setItemDone } from "../actions";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PortalProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const viewer = await requirePortalAccess();
  const { publicId } = await params;
  const { tab } = await searchParams;
  const activeTab = isPortalTab(tab) ? tab : "overview";

  const [portal, projects] = await Promise.all([
    getPortal(publicId),
    getPortalProjects(),
  ]);
  if (!portal) notFound();

  await markPortalSeen(publicId);

  const actions: MilestoneActions = {
    setDone: setItemDone,
    saveIdeas: saveWeekIdeas,
  };

  const meta: PortalMeta[] = heroMeta(portal);

  return (
    <>
      <PortalTopBar
        viewer={viewer}
        projects={projects}
        currentPublicId={publicId}
      />

      <div className="mx-auto max-w-[1480px] min-w-0 px-4 pt-2 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pt-3 xl:px-10">
        <PortalHero
          project={portal.project}
          activeTab={activeTab}
          meta={meta}
        />

        <div className="mt-4">
          {activeTab === "overview" ? <PortalOverview portal={portal} /> : null}
          {activeTab === "team" ? <PortalTeam team={portal.team} /> : null}
          {activeTab === "milestone" ? (
            <PortalMilestone
              publicId={portal.project.publicId}
              weeks={portal.weeks}
              canEdit={portal.canEditMilestones}
              actions={actions}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
