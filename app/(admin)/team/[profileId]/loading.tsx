import { PanelSkeleton, Shimmer } from "@/components/admin/skeletons";

export default function TeamPersonLoading() {
  return (
    <div className="mx-auto max-w-[1100px]" aria-busy role="status">
      <span className="sr-only">Loading person</span>
      <Shimmer className="mb-4 h-3 w-24" />
      <Shimmer className="h-9 w-64 rounded-lg" />
      <div className="mt-6 space-y-4">
        <PanelSkeleton lines={5} />
        <PanelSkeleton lines={3} />
      </div>
    </div>
  );
}
