import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/data/auth";
import { getPortalPreview } from "@/data/portal";
import { PortalHero, PortalTopBar } from "@/components/portal/portal-header";
import { PortalOverview } from "@/components/portal/portal-overview";
import { PortalTeam } from "@/components/portal/portal-team";
import { PortalMilestone } from "@/components/portal/portal-milestone";
import { isPortalTab } from "@/lib/portal/tabs";
import { heroMeta } from "@/lib/portal/hero";
import { saveWeekIdeas, setItemDone } from "../../actions";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PortalPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireRole(["owner"]);
  const { publicId } = await params;
  const { tab } = await searchParams;
  const activeTab = isPortalTab(tab) ? tab : "overview";

  const portal = await getPortalPreview(publicId);
  if (!portal) notFound();

  return (
    <>
      <PortalTopBar viewer={null} preview />

      <div className="mx-auto max-w-[1480px] min-w-0 px-4 pt-2 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pt-3 xl:px-10">
        <Link
          href={`/projects/${publicId}`}
          className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-black/42 transition hover:text-black"
        >
          <ArrowLeft className="size-3.5" />
          Back to the project
        </Link>

        <PortalHero
          project={portal.project}
          activeTab={activeTab}
          tabBase="/portal/preview"
          meta={heroMeta(portal)}
        />

        <div className="mt-4">
          {activeTab === "overview" ? <PortalOverview portal={portal} /> : null}
          {activeTab === "team" ? <PortalTeam team={portal.team} /> : null}
          {activeTab === "milestone" ? (
            <PortalMilestone
              publicId={portal.project.publicId}
              weeks={portal.weeks}
              canEdit={false}
              actions={{ setDone: setItemDone, saveIdeas: saveWeekIdeas }}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
