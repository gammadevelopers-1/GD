import { PanelSkeleton } from "gd-website";

export function Default() {
  return (
    <div className="bg-background max-w-md p-8">
      <PanelSkeleton />
    </div>
  );
}

export function ManyLines() {
  return (
    <div className="bg-background max-w-md p-8">
      <PanelSkeleton lines={7} />
    </div>
  );
}
