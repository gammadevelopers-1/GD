import {
  PageHeadingSkeleton,
  PanelSkeleton,
} from "@/components/admin/skeletons";

export default function TeamLoading() {
  return (
    <div className="mx-auto max-w-[1480px]" aria-busy role="status">
      <span className="sr-only">Loading the team</span>
      <PageHeadingSkeleton action />
      <PanelSkeleton />
    </div>
  );
}
