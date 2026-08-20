import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderKanban } from "lucide-react";
import { AccountsPanel } from "@/components/admin/clients/accounts-panel";
import { ContactsPanel } from "@/components/admin/clients/contacts-panel";
import { CompanyPanel } from "@/components/admin/clients/company-panel";
import { PageHeading } from "@/components/admin/page-heading";
import { requireRole } from "@/data/auth";
import { getClientRecord } from "@/data/clients";
import { isUuid } from "@/lib/projects/validation";
import { PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export default async function ClientRecordPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  if (!isUuid(clientId)) notFound();

  const viewer = await requireRole(["owner"]);
  const client = await getClientRecord(clientId, viewer);
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-[1100px]">
      <Link
        href="/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-black/45 transition hover:text-black"
      >
        <ArrowLeft className="size-3.5" />
        All clients
      </Link>

      <PageHeading
        eyebrow="Client"
        title={client.name}
        description={client.website ?? undefined}
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <CompanyPanel client={client} />
          <ContactsPanel clientId={client.id} contacts={client.contacts} />
        </div>

        <div className="space-y-4">
          <section className={cn(PANEL, "p-5")}>
            <h2 className="font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
              Projects
            </h2>
            {client.projects.length ? (
              <ul className="mt-4 space-y-2">
                {client.projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects`}
                      className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white px-3.5 py-2.5 transition hover:border-black/20"
                    >
                      <FolderKanban className="size-4 shrink-0 text-black/35" />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-black/80">
                        {project.name}
                      </span>
                      <span className="text-[11px] text-black/40 capitalize">
                        {project.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[12px] text-black/40">
                No projects for this client yet.
              </p>
            )}
          </section>

          <AccountsPanel clientId={client.id} accounts={client.accounts} />
        </div>
      </div>
    </div>
  );
}
