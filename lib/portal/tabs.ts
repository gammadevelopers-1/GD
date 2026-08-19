export const PORTAL_TABS = [
  "overview",
  "team",
  "milestone",
] as const;

export type PortalTab = (typeof PORTAL_TABS)[number];

export const PORTAL_TAB_LABEL: Record<PortalTab, string> = {
  overview: "Overview",
  team: "Team",
  milestone: "Milestone",
};

export function isPortalTab(value: string | undefined): value is PortalTab {
  return (PORTAL_TABS as readonly string[]).includes(value ?? "");
}

export function portalTabHref(
  publicId: string,
  tab: PortalTab,
  base = "/portal",
) {
  return `${base}/${publicId}${tab === "overview" ? "" : `?tab=${tab}`}`;
}
