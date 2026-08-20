import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireRole } from "@/data/auth";
import { getProjectCore } from "@/data/project-detail";
import { ProjectShell } from "@/components/admin/projects/project-shell";
import {
  MilestoneMeta,
  ProjectHeroCompact,
  ProjectHeroFull,
} from "@/components/admin/projects/project-hero";
import { MetaSkeleton } from "@/components/admin/projects/hero-skeleton";

// This layout renders once per project. Moving between tabs replaces only the
// segment below it, so the hero is not rebuilt and the project is not read again.
//
// It deliberately blocks on the project rather than streaming it: whether this
// account may see this project decides the response status, and a hero streamed
// into an already-committed 200 would answer "not found" inside a page that had
// already claimed to be found. The wait is one round trip, covered by the
// skeleton in ../loading.tsx, and every tab below reuses the result for free.
export default async function ProjectWorkspaceLayout({
  params,
  children,
}: {
  params: Promise<{ projectId: string }>;
  children: React.ReactNode;
}) {
  const { projectId: publicId } = await params;

  // The role gate and the project read do not depend on each other. Row level
  // security is what decides whether this project is readable at all; requireRole
  // only keeps finance out of the module, and it still throws before anything renders.
  const [viewer, project] = await Promise.all([
    requireRole(["owner", "member"]),
    getProjectCore(publicId),
  ]);

  if (!project) notFound();

  return (
    <ProjectShell
      publicId={publicId}
      hero={
        <ProjectHeroFull
          project={project}
          viewer={viewer}
          milestones={
            <Suspense fallback={<MetaSkeleton label="Milestones" />}>
              <MilestoneMeta projectId={project.id} />
            </Suspense>
          }
        />
      }
      heroCompact={<ProjectHeroCompact project={project} viewer={viewer} />}
    >
      {children}
    </ProjectShell>
  );
}
