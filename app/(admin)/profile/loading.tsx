import { PanelSkeleton } from "@/components/admin/skeletons";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-[1140px] space-y-4" aria-busy role="status">
      <span className="sr-only">Loading profile</span>
      <PanelSkeleton lines={4} />
      <PanelSkeleton lines={6} />
    </div>
  );
}
