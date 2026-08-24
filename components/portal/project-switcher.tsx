"use client";

import Link from "next/link";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PortalProject } from "@/data/portal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ProjectSwitcher({
  projects,
  currentPublicId,
}: {
  projects: PortalProject[];
  currentPublicId: string;
}) {
  if (projects.length < 2) return null;

  const current =
    projects.find((project) => project.publicId === currentPublicId) ??
    projects[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="bare"
          size="none"
          type="button"
          className="flex min-w-0 items-center gap-2 rounded-xl border border-black/[0.07] bg-white/55 px-2.5 py-1.5 text-[12px] font-medium text-black/70 transition hover:border-black/[0.14] hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none"
        >
          <span className="max-w-40 truncate sm:max-w-56">{current.name}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-black/35" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        {projects.map((project) => (
          <DropdownMenuItem key={project.publicId} asChild>
            <Link
              href={`/portal/${project.publicId}`}
              className="flex items-center gap-2"
            >
              <Check
                className={cn(
                  "size-3.5 shrink-0",
                  project.publicId === current.publicId
                    ? "opacity-100"
                    : "opacity-0",
                )}
              />
              <span className="min-w-0 flex-1 truncate">{project.name}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
