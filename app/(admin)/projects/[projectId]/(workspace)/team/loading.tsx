import { PanelSkeleton } from "@/components/admin/skeletons";

export default function TeamLoading() {
  return (
    <div
      className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"
      aria-busy
      role="status"
    >
      <span className="sr-only">Loading team</span>
      <PanelSkeleton lines={5} />
      <PanelSkeleton lines={4} />
    </div>
  );
}
