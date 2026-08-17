"use client";

import Link, { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

export const PROJECT_TABS = [
  "overview",
  "team",
  "milestones",
  "technical",
] as const;

export type ProjectTab = (typeof PROJECT_TABS)[number];

// Switching tab only changes ?tab=, so the route segment never changes and
// loading.tsx cannot fire. Without this the click has no visible effect until
// the server has re-read the whole project. useLinkStatus is the supported
// hook for exactly that gap.
function TabIndicator({ active }: { active: boolean }) {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-x-3.5 bottom-0 h-0.5 rounded-full sm:inset-x-4",
        // The bar is always rendered at a fixed size, so nothing shifts when
        // it appears — only its paint changes.
        pending
          ? "tab-indicator-pending bg-[#2fe85c]"
          : active
            ? "bg-[#2fe85c] opacity-100 shadow-[0_0_14px_rgba(47,232,92,0.65)] transition-all duration-300"
            : "scale-x-0 bg-[#2fe85c] opacity-0 transition-all duration-300",
      )}
    />
  );
}

export function ProjectTabs({
  activeTab,
  tabHref,
}: {
  activeTab: ProjectTab;
  tabHref: (tab: ProjectTab) => string;
}) {
  return (
    <nav
      aria-label="Project sections"
      className="flex overflow-x-auto border-t border-white/[0.07] px-2 sm:px-4"
    >
      {PROJECT_TABS.map((tab) => (
        <Link
          key={tab}
          href={tabHref(tab)}
          aria-current={activeTab === tab ? "page" : undefined}
          className={cn(
            "relative shrink-0 px-3.5 py-3.5 text-[13px] font-medium capitalize transition duration-200 focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none sm:px-4",
            activeTab === tab ? "text-white" : "text-white/35 hover:text-white/85",
          )}
        >
          {tab}
          <TabIndicator active={activeTab === tab} />
        </Link>
      ))}
    </nav>
  );
}
