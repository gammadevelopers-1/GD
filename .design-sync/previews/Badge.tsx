import { Badge } from "gd-website";

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <Badge>Live</Badge>
      <Badge variant="secondary">Building</Badge>
      <Badge variant="outline">Review</Badge>
      <Badge variant="destructive">Blocked</Badge>
      <Badge variant="ghost">Paused</Badge>
      <Badge variant="link">View details</Badge>
    </div>
  );
}

export function ProjectStatuses() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <Badge variant="secondary">Discovery</Badge>
      <Badge>Retainer</Badge>
      <Badge variant="outline">Closed</Badge>
    </div>
  );
}
