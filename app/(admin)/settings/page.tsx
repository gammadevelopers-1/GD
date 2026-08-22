import { notFound } from "next/navigation";
import { PageHeading } from "@/components/admin/page-heading";
import { SettingsWorkspace } from "@/components/admin/profile/settings-panels";
import { requireViewer } from "@/data/auth";
import { getMyProfile } from "@/data/profile";

export const metadata = { title: "Settings · Internal platform" };

export default async function SettingsPage() {
  const viewer = await requireViewer();
  const profile = await getMyProfile(viewer);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-[1000px]">
      <PageHeading title="Settings" />
      <SettingsWorkspace profile={profile} />
    </div>
  );
}
