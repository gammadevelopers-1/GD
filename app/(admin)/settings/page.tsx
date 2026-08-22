import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/admin/page-heading";
import { SettingsWorkspace } from "@/components/admin/profile/settings-panels";
import { PanelSkeleton } from "@/components/admin/skeletons";
import { requireViewer, type Viewer } from "@/data/auth";
import { getMyProfile } from "@/data/profile";
import { getMySessions } from "@/data/sessions";

export const metadata = { title: "Settings · Internal platform" };

export default async function SettingsPage() {
  const viewer = await requireViewer();

  return (
    <div className="mx-auto max-w-[1000px]">
      <PageHeading title="Settings" />
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsBody viewer={viewer} />
      </Suspense>
    </div>
  );
}

async function SettingsBody({ viewer }: { viewer: Viewer }) {
  const [profile, sessions] = await Promise.all([
    getMyProfile(viewer),
    getMySessions(),
  ]);
  if (!profile) notFound();

  return <SettingsWorkspace profile={profile} sessions={sessions} />;
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4" aria-busy role="status">
      <span className="sr-only">Loading settings</span>
      <PanelSkeleton lines={4} />
      <PanelSkeleton lines={3} />
      <PanelSkeleton lines={5} />
    </div>
  );
}
