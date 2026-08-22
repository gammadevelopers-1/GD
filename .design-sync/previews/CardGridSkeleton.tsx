import { CardGridSkeleton } from "gd-website";

export function Default() {
  return (
    <div className="bg-[#f8f8f3] p-6">
      <CardGridSkeleton count={6} />
    </div>
  );
}

export function Compact() {
  return (
    <div className="bg-[#f8f8f3] p-6">
      <CardGridSkeleton count={3} height="h-20" className="md:grid-cols-3" />
    </div>
  );
}
