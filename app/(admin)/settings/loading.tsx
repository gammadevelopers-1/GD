import { PageHeadingSkeleton, PanelSkeleton } from "@/components/admin/skeletons";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-[1000px]" aria-busy role="status">
      <span className="sr-only">Loading settings</span>
      <PageHeadingSkeleton />
      <div className="space-y-4">
        <PanelSkeleton lines={4} />
        <PanelSkeleton lines={3} />
        <PanelSkeleton lines={5} />
      </div>
    </div>
  );
}
