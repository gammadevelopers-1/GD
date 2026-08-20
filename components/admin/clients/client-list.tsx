import Link from "next/link";
import { Building2 } from "lucide-react";
import type { ClientCompany } from "@/data/clients";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CARD_HOVER } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export function ClientList({ clients }: { clients: ClientCompany[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {clients.map((client) => (
        <Link key={client.id} href={`/clients/${client.id}`} className="group">
          <Card
            className={cn(
              "h-full gap-0 border-black/[0.07] bg-[#f8f8f3] py-5 shadow-none",
              CARD_HOVER,
              client.archivedAt && "opacity-60",
            )}
          >
            <CardHeader className="px-5">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-black/[0.045]">
                  <Building2 className="size-4 text-black/45" />
                </span>
                {client.archivedAt ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-amber-700/30 bg-amber-500/20 font-semibold text-amber-900"
                  >
                    Archived
                  </Badge>
                ) : (
                  <span className="text-[10px] font-semibold text-[#08743d]">
                    {client.activeCount} active
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="px-5">
              <h2 className="mt-4 text-lg font-semibold tracking-[-0.035em]">
                {client.name}
              </h2>
              <p className="mt-1 truncate text-[11px] text-black/38">
                {client.website ?? "No website added"}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-black/[0.06] pt-4">
                <div className="min-w-0">
                  <p className="font-mono text-[8px] tracking-wider text-black/30 uppercase">
                    Contact
                  </p>
                  <p className="mt-1.5 truncate text-xs font-medium">
                    {client.primaryContact ?? "None yet"}
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
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
