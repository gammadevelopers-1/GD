import { redirect } from "next/navigation";
import { getPortalProjects, requirePortalAccess } from "@/data/portal";
import { PortalProjectCard } from "@/components/portal/portal-project-card";
import { PortalTopBar } from "@/components/portal/portal-header";

export default async function PortalIndexPage() {
  const viewer = await requirePortalAccess();
  const projects = await getPortalProjects();

  if (projects.length === 1) redirect(`/portal/${projects[0].publicId}`);

  return (
    <>
      <PortalTopBar viewer={viewer} />

      <div className="mx-auto max-w-[1480px] min-w-0 px-4 pt-2 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pt-3 xl:px-10">
        <section className="panel-dark overflow-hidden rounded-[20px] border border-black/[0.07] px-4 py-5 text-white sm:px-6">
          <span className="font-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">
            Your projects
          </span>
          <h1 className="font-display mt-2 text-2xl font-semibold tracking-[-0.045em]">
            {viewer.fullName}
          </h1>
        </section>

        <div className="mt-4">
          {projects.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <li key={project.publicId}>
                  <PortalProjectCard project={project} />
                </li>
              ))}
            </ul>
          ) : (
            <section className="card-surface rounded-2xl border border-black/[0.06] p-5">
              <p className="text-sm text-black/45">
                Nothing is shared with this account yet.
              </p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
