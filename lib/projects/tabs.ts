export const PROJECT_TABS = [
  "overview",
  "team",
  "milestone",
  "technical",
] as const;

export type ProjectTab = (typeof PROJECT_TABS)[number];

export const PROJECT_TAB_LABEL: Record<ProjectTab, string> = {
  overview: "Overview",
  team: "Team",
  milestone: "Milestone",
  technical: "Technical",
};

export function isProjectTab(value: string | undefined): value is ProjectTab {
  return (PROJECT_TABS as readonly string[]).includes(value ?? "");
}

// Each tab is its own route segment rather than a query string. That is what
// lets the hero and the tab bar live in a layout: navigating between siblings
// swaps only the segment below it, so the shell is never rebuilt or refetched.
export function projectTabHref(publicId: string, tab: ProjectTab) {
  return `/projects/${publicId}${tab === "overview" ? "" : `/${tab}`}`;
}
