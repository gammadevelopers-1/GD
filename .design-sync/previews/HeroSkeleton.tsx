import { HeroSkeleton } from "gd-website";

export function Default() {
  return (
    <div className="panel-dark">
      <HeroSkeleton />
    </div>
  );
}

export function Compact() {
  return (
    <div className="panel-dark">
      <HeroSkeleton compact />
    </div>
  );
}
