import { LoaderVisual } from "gd-website";

export function Default() {
  return (
    <div className="relative h-[500px] overflow-hidden">
      <LoaderVisual progress={58} className="absolute" />
    </div>
  );
}

export function NearlyDone() {
  return (
    <div className="relative h-[500px] overflow-hidden">
      <LoaderVisual progress={94} className="absolute" />
    </div>
  );
}
