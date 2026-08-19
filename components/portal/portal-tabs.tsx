"use client";

import Link from "next/link";
import { useState } from "react";
import {
  PORTAL_TABS,
  PORTAL_TAB_LABEL,
  type PortalTab,
  portalTabHref,
} from "@/lib/portal/tabs";
import { cn } from "@/lib/utils";

export function PortalTabs({
  publicId,
  activeTab,
  base,
}: {
  publicId: string;
  activeTab: PortalTab;
  base?: string;
}) {
  const [clicked, setClicked] = useState<PortalTab | null>(null);
  const [lastActive, setLastActive] = useState(activeTab);
  if (lastActive !== activeTab) {
    setLastActive(activeTab);
    setClicked(null);
  }
  const shown = clicked ?? activeTab;

  return (
    <nav
      aria-label="Project sections"
      className="flex overflow-x-auto border-t border-white/[0.07] px-2 sm:px-4"
    >
      {PORTAL_TABS.map((tab) => (
        <Link
          key={tab}
          href={portalTabHref(publicId, tab, base)}
          prefetch
          onClick={() => setClicked(tab)}
          aria-current={activeTab === tab ? "page" : undefined}
          className={cn(
            "group relative shrink-0 px-3.5 py-3.5 text-[13px] font-medium transition duration-200 focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none sm:px-4",
            shown === tab
              ? "bg-white/[0.03] text-white"
              : "text-white/35 hover:bg-white/[0.05] hover:text-white",
          )}
        >
          {PORTAL_TAB_LABEL[tab]}
          <span
            aria-hidden
            className={cn(
              "absolute inset-x-3.5 bottom-0 h-0.5 rounded-full bg-[#2fe85c] transition-all duration-200 sm:inset-x-4",
              shown === tab
                ? "opacity-100 shadow-[0_0_14px_rgba(47,232,92,0.65)]"
                : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-40",
            )}
          />
        </Link>
      ))}
    </nav>
  );
}
