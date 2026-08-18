export const PROJECT_TABS = [
  "overview",
  "team",
  "milestones",
  "technical",
] as const;

export type ProjectTab = (typeof PROJECT_TABS)[number];

export function isProjectTab(value: string | undefined): value is ProjectTab {
  return (PROJECT_TABS as readonly string[]).includes(value ?? "");
}

export function projectTabHref(publicId: string, tab: ProjectTab) {
  return `/projects/${publicId}${tab === "overview" ? "" : `?tab=${tab}`}`;
}
