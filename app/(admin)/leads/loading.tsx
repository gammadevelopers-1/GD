import {
  CardGridSkeleton,
  PageHeadingSkeleton,
} from "@/components/admin/skeletons";

export default function LeadsLoading() {
  return (
    <div className="mx-auto max-w-[1100px]" aria-busy role="status">
      <span className="sr-only">Loading contact leads</span>
      <PageHeadingSkeleton />
      <CardGridSkeleton count={5} height="h-16" />
    </div>
  );
}
