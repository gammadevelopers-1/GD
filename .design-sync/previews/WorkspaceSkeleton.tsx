import { WorkspaceSkeleton } from "gd-website";

export function Default() {
  return (
    <div style={{ height: 480 }} className="max-w-2xl overflow-hidden rounded-2xl border border-black/[0.08]">
      <WorkspaceSkeleton />
    </div>
  );
}
