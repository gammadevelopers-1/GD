export const PROJECT_TABS = [
  "overview",
  "team",
  "ideas",
  "technical",
] as const;

export type ProjectTab = (typeof PROJECT_TABS)[number];

export const PROJECT_TAB_LABEL: Record<ProjectTab, string> = {
  overview: "Overview",
  team: "Team",
  ideas: "Milestone",
  technical: "Technical",
};

export function isProjectTab(value: string | undefined): value is ProjectTab {
  return (PROJECT_TABS as readonly string[]).includes(value ?? "");
}

export function projectTabHref(publicId: string, tab: ProjectTab) {
  return `/projects/${publicId}${tab === "overview" ? "" : `?tab=${tab}`}`;
}
