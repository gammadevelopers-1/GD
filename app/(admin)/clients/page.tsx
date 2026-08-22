import { Suspense } from "react";
import { Building2 } from "lucide-react";
import { AddClient } from "@/components/admin/clients/add-client";
import { ClientList } from "@/components/admin/clients/client-list";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeading } from "@/components/admin/page-heading";
import { CardGridSkeleton } from "@/components/admin/skeletons";
import { requireRole, type Viewer } from "@/data/auth";
import { getClientCompanies } from "@/data/clients";

export default async function ClientsPage() {
  const viewer = await requireRole(["owner"]);

  return (
    <div className="mx-auto max-w-[1480px]">
      <PageHeading title="Clients" action={<AddClient />} />

      <Suspense fallback={<CardGridSkeleton count={6} height="h-36" />}>
        <ClientDirectory viewer={viewer} />
      </Suspense>
    </div>
  );
}

async function ClientDirectory({ viewer }: { viewer: Viewer }) {
  const clients = await getClientCompanies(viewer);
  const live = clients.filter((client) => !client.archivedAt);
  const archived = clients.filter((client) => client.archivedAt);

  return (
    <>
      {clients.length ? (
        <div className="space-y-8">
          <ClientList clients={live} />

          {archived.length ? (
            <section>
              <h2 className="mb-3 font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
                Archived
              </h2>
              <ClientList clients={archived} />
            </section>
          ) : null}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No clients yet"
          description="Add the first company, then invite them to a project from its page."
        />
      )}
    </>
  );
}
