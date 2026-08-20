"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProjectTabs } from "@/components/admin/projects/project-tabs";
import { cn } from "@/lib/utils";

// The frame every project tab sits inside. It lives in the layout, so switching
// tabs replaces only what is below it: no refetch of the project, no rebuilt
// hero, no skeleton over the parts that did not change.
//
// Both hero variants arrive already rendered from the server and this picks one,
// because which to show depends on the child segment and a server layout cannot
// read that. Rendering both costs a little markup once per project; deciding it
// on the server would cost a re-render of the whole shell on every tab click.
export function ProjectShell({
  publicId,
  hero,
  heroCompact,
  children,
}: {
  publicId: string;
  hero: React.ReactNode;
  heroCompact: React.ReactNode;
  children: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  const wide = segment === "milestone";
  const lean = wide || segment === "technical";

  return (
    <div
      className={cn(
        wide
          ? "-mx-4 -mb-8 flex h-[calc(100dvh-4rem)] w-auto flex-col overflow-hidden sm:-mx-6 sm:-mb-10 lg:-mx-8 xl:-mx-10"
          : "mx-auto max-w-[1480px]",
      )}
    >
      <Link
        href="/projects"
        prefetch
        className={cn(
          "inline-flex items-center gap-2 text-xs font-medium text-black/42 transition hover:text-black",
          wide ? "mb-2 shrink-0 px-4 pt-1 sm:px-6 lg:px-8 xl:px-10" : "mb-4",
        )}
      >
        <ArrowLeft className="size-3.5" /> All projects
      </Link>

      <div
        className={wide ? "shrink-0 px-4 sm:px-6 lg:px-8 xl:px-10" : undefined}
      >
        <section className="panel-dark overflow-hidden rounded-[20px] border border-black/[0.07] text-white">
          {lean ? heroCompact : hero}
          <ProjectTabs publicId={publicId} />
        </section>
      </div>

      <div className={wide ? "mt-2 flex min-h-0 flex-1 flex-col" : "mt-4"}>
        {children}
      </div>
    </div>
  );
}
