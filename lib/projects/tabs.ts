// The workspace tab list lives here rather than in the tab component, because
// the server page needs the array at runtime to validate ?tab=.
//
// A "use client" module hands a Server Component a client-reference proxy for
// every export, so a plain array imported across that boundary is not an array
// any more — PROJECT_TABS.includes() throws. Types survive the boundary because
// they are erased; values do not.

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

// Lives here for the same reason as the list above. A Server Component cannot
// hand a function to a Client Component, so the tab bar builds its own hrefs
// from the project id rather than being passed a builder.
export function projectTabHref(projectId: string, tab: ProjectTab) {
  return `/projects/${projectId}${tab === "overview" ? "" : `?tab=${tab}`}`;
}
