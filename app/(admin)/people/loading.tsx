import {
  CardGridSkeleton,
  PageHeadingSkeleton,
} from "@/components/admin/skeletons";

export default function PeopleLoading() {
  return (
    <div className="mx-auto max-w-[1480px]" aria-busy role="status">
      <span className="sr-only">Loading people</span>
      <PageHeadingSkeleton />
      <CardGridSkeleton count={6} height="h-28" />
    </div>
  );
}
