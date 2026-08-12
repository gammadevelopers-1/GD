import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeading } from "@/components/admin/page-heading";
import { requireRole } from "@/data/auth";
import { getClients } from "@/data/resources";

export default async function ClientsPage() {
  await requireRole(["owner"]);
  const clients = await getClients();
  return (
    <div className="mx-auto max-w-[1480px]">
      <PageHeading
        eyebrow="Relationships"
        title="Clients"
        description="Companies, the people we speak with and every project connected to them."
      />
      {clients.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <article
              key={client.id}
              className="rounded-[20px] border border-black/[0.07] bg-[#f8f8f3] p-5"
            >
              <div className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-black/[0.045]">
                  <Building2 className="size-4 text-black/45" />
                </span>
                <span className="text-[10px] font-semibold text-[#08743d]">
                  {client.activeCount} active
                </span>
              </div>
              <h2 className="mt-5 text-lg font-semibold tracking-[-0.035em]">
                {client.name}
              </h2>
              <p className="mt-1 text-[11px] text-black/38">
                {client.website ?? "No website added"}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-black/[0.06] pt-4">
                <div>
                  <p className="font-mono text-[8px] tracking-wider text-black/30 uppercase">
                    Contact
                  </p>
                  <p className="mt-1.5 truncate text-xs font-medium">
                    {client.contact}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[8px] tracking-wider text-black/30 uppercase">
                    Projects
                  </p>
                  <p className="mt-1.5 text-xs font-medium">
                    {client.projectCount}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No clients yet"
          description="Add a client before creating their first project."
        />
      )}
    </div>
  );
}
