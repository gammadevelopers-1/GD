import { PanelSkeleton } from "@/components/admin/skeletons";

export default function OverviewLoading() {
  return (
    <div
      className="grid gap-4 lg:grid-cols-[1.35fr_1fr]"
      aria-busy
      role="status"
    >
      <span className="sr-only">Loading overview</span>
      <PanelSkeleton lines={8} />
      <div className="space-y-4">
        <PanelSkeleton lines={5} />
        <PanelSkeleton lines={3} />
      </div>
    </div>
  );
}
