"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProjectTabs } from "@/components/admin/projects/project-tabs";

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
  const lean = segment === "milestone" || segment === "technical";

  return (
    <div className="mx-auto max-w-[1480px]">
      <Link
        href="/projects"
        prefetch
        className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-black/55 transition hover:text-black"
      >
        <ArrowLeft className="size-3.5" /> All projects
      </Link>

      <div>
        <section className="panel-dark overflow-hidden rounded-[20px] border border-black/[0.07] text-white">
          {lean ? heroCompact : hero}
          <ProjectTabs publicId={publicId} />
        </section>
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}
