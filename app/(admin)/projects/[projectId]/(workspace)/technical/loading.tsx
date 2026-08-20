import { PanelSkeleton } from "@/components/admin/skeletons";

export default function TechnicalLoading() {
  return (
    <div className="space-y-6" aria-busy role="status">
      <span className="sr-only">Loading technical details</span>
      <PanelSkeleton lines={5} />
      <PanelSkeleton lines={5} />
    </div>
  );
}
