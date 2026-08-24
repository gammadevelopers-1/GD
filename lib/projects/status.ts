export const PROJECT_STATUSES = [
  "discovery",
  "building",
  "review",
  "live",
  "retainer",
  "paused",
  "closed",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  discovery: "Discovery",
  building: "Building",
  review: "In review",
  live: "Live",
  retainer: "Retainer",
  paused: "Paused",
  closed: "Closed",
};

export const PROJECT_STATUS_CHIP: Record<ProjectStatus, string> = {
  discovery: "border-sky-200/70 bg-sky-50 text-sky-700",
  building: "border-brand/25 bg-brand/10 text-gd-green-deep",
  review: "border-amber-200/80 bg-amber-50 text-amber-700",
  live: "border-violet-200/70 bg-violet-50 text-violet-700",
  retainer: "border-cyan-200/70 bg-cyan-50 text-cyan-700",
  paused: "border-black/[0.07] bg-black/[0.035] text-black/50",
  closed: "border-black/[0.07] bg-black/[0.035] text-black/50",
};

export const PROJECT_STATUS_TONE: Record<ProjectStatus, string> = {
  discovery: "bg-sky-500/10 text-sky-700",
  building: "bg-brand/15 text-gd-green-deep",
  review: "bg-amber-400/15 text-amber-700",
  live: "bg-violet-500/10 text-violet-700",
  retainer: "bg-cyan-500/10 text-cyan-700",
  paused: "bg-black/5 text-black/45",
  closed: "bg-black/5 text-black/45",
};

export const EXIT_STATUSES: ProjectStatus[] = ["paused", "closed"];

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}

export function isExitStatus(status: ProjectStatus) {
  return EXIT_STATUSES.includes(status);
}
