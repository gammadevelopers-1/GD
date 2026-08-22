"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PROJECT_TABS,
  PROJECT_TAB_LABEL,
  type ProjectTab,
  isProjectTab,
  projectTabHref,
} from "@/lib/projects/tabs";
import { cn } from "@/lib/utils";

export function ProjectTabs({ publicId }: { publicId: string }) {
  const segment = useSelectedLayoutSegment();
  const current = segment ?? "overview";
  const activeTab: ProjectTab = isProjectTab(current) ? current : "overview";

  return (
    <Tabs value={activeTab} activationMode="manual" className="block">
      <TabsList
        variant="line"
        aria-label="Project sections"
        className="flex h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-t border-white/[0.07] p-0 px-2 sm:px-4"
      >
        {PROJECT_TABS.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            asChild
            className={cn(
              "group relative h-auto flex-none shrink-0 rounded-none border-0 px-3.5 py-3.5 text-[13px] font-medium transition duration-200 after:hidden hover:text-white focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none dark:hover:text-white sm:px-4",
              activeTab === tab
                ? "bg-white/[0.03] text-white"
                : "text-white/35 hover:bg-white/[0.05]",
            )}
          >
            <Link
              href={projectTabHref(publicId, tab)}
              prefetch
              aria-current={activeTab === tab ? "page" : undefined}
            >
              {PROJECT_TAB_LABEL[tab]}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-3.5 bottom-0 h-0.5 rounded-full bg-[#2fe85c] transition-all duration-200 sm:inset-x-4",
                  activeTab === tab
                    ? "opacity-100 shadow-[0_0_14px_rgba(47,232,92,0.65)]"
                    : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-40",
                )}
              />
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
