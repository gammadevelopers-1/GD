import {
  PageHeadingSkeleton,
  PanelSkeleton,
} from "@/components/admin/skeletons";

export default function ClientRecordLoading() {
  return (
    <div className="mx-auto max-w-[1100px]" aria-busy role="status">
      <span className="sr-only">Loading client</span>
      <PageHeadingSkeleton />
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <PanelSkeleton />
          <PanelSkeleton />
        </div>
        <div className="space-y-4">
          <PanelSkeleton />
          <PanelSkeleton />
        </div>
      </div>
    </div>
  );
}
