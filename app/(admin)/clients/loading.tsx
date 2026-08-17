import {
  CardGridSkeleton,
  PageHeadingSkeleton,
} from "@/components/admin/skeletons";

export default function ClientsLoading() {
  return (
    <div className="mx-auto max-w-[1480px]" aria-busy role="status">
      <span className="sr-only">Loading clients</span>
      <PageHeadingSkeleton />
      <CardGridSkeleton count={6} height="h-36" />
    </div>
  );
}
