"use client";

import Link, { useLinkStatus } from "next/link";
import {
  PROJECT_TABS,
  type ProjectTab,
  projectTabHref,
} from "@/lib/projects/tabs";
import { cn } from "@/lib/utils";

function TabIndicator({ active }: { active: boolean }) {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-x-3.5 bottom-0 h-0.5 rounded-full sm:inset-x-4",
        pending
          ? "tab-indicator-pending bg-[#2fe85c]"
          : active
            ? "bg-[#2fe85c] opacity-100 shadow-[0_0_14px_rgba(47,232,92,0.65)] transition-all duration-300"
            : "scale-x-0 bg-[#2fe85c] opacity-0 transition-all duration-300 group-hover:scale-x-100 group-hover:opacity-40",
      )}
    />
  );
}

export function ProjectTabs({
  publicId,
  activeTab,
}: {
  publicId: string;
  activeTab: ProjectTab;
}) {
  return (
    <nav
      aria-label="Project sections"
      className="flex overflow-x-auto border-t border-white/[0.07] px-2 sm:px-4"
    >
      {PROJECT_TABS.map((tab) => (
        <Link
          key={tab}
          href={projectTabHref(publicId, tab)}
          aria-current={activeTab === tab ? "page" : undefined}
          className={cn(
            "group relative shrink-0 px-3.5 py-3.5 text-[13px] font-medium capitalize transition duration-200 focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none sm:px-4",
            activeTab === tab
              ? "bg-white/[0.03] text-white"
              : "text-white/35 hover:bg-white/[0.05] hover:text-white",
          )}
        >
          {tab}
          <TabIndicator active={activeTab === tab} />
        </Link>
      ))}
    </nav>
  );
}
