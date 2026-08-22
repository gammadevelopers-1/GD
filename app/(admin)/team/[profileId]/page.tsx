import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AccountPanel } from "@/components/admin/team/account-panel";
import { DocumentsPanel } from "@/components/admin/team/documents-panel";
import { PersonEditor } from "@/components/admin/team/person-editor";
import { PageHeading } from "@/components/admin/page-heading";
import { requireRole } from "@/data/auth";
import { getTeamPerson } from "@/data/team";
import { buildInviteEmail } from "@/lib/team/invite-email";
import { isUuid } from "@/lib/projects/validation";
import { PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export default async function TeamPersonPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  if (!isUuid(profileId)) notFound();

  const viewer = await requireRole(["owner"]);
  const person = await getTeamPerson(profileId, viewer);
  if (!person) notFound();

  const draft = {
    profileId: person.id,
    fullName: person.fullName,
    email: person.email ?? "",
    ...buildInviteEmail({
      fullName: person.fullName,
      jobTitle: person.jobTitle ?? "the team",
      role: person.role,
      invitedBy: viewer.fullName,
    }),
  };

  return (
    <div className="mx-auto max-w-[1480px]">
      <Link
        href="/team"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-black/45 transition hover:text-black"
      >
        <ArrowLeft className="size-3.5" />
        Team
      </Link>

      <PageHeading title={person.fullName} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <PersonEditor person={person} />

        <div className="space-y-5">
          <AccountPanel
            person={person}
            draft={draft}
            isSelf={person.id === viewer.id}
          />

          <section className={cn(PANEL, "p-5")}>
            <h2 className="font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
              Projects
            </h2>
            {person.projects.length ? (
              <ul className="mt-4 space-y-2">
                {person.projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.publicId}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.07] bg-white px-3.5 py-2.5 transition hover:border-black/[0.14]"
                    >
                      <span className="min-w-0 truncate text-[13px] font-medium text-black/80">
                        {project.name}
                      </span>
                      {project.responsibility ? (
                        <span className="shrink-0 text-[11px] text-black/45">
                          {project.responsibility}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[12.5px] text-black/45">
                Not on a project yet.
              </p>
            )}
          </section>

          <DocumentsPanel profileId={person.id} documents={person.documents} />
        </div>
      </div>
    </div>
  );
}
