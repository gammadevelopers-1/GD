import Link from "next/link";
import { ArrowUpRight, Building2, Globe, Mail } from "lucide-react";
import type { ClientCompany, ClientInviteStatus } from "@/data/clients";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CARD_HOVER, TONE_SOFT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

const INVITE_LABELS: Record<ClientInviteStatus, string> = {
  active: "Signed in",
  invited: "Invited",
  none: "Not invited",
};

const INVITE_TONES: Record<ClientInviteStatus, string> = {
  active: TONE_SOFT.ok,
  invited: TONE_SOFT.info,
  none: TONE_SOFT.muted,
};

export function ClientList({ clients }: { clients: ClientCompany[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {clients.map((client) => (
        <Link
          key={client.id}
          href={`/clients/${client.id}`}
          className="group focus-visible:outline-none"
        >
          <Card
            className={cn(
              "h-full gap-0 border-black/[0.07] bg-[#f8f8f3] py-0 shadow-none group-focus-visible:border-[#16a34a]/50",
              CARD_HOVER,
              client.archivedAt && "opacity-60",
            )}
          >
            <CardContent className="px-5 pt-5">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-black/[0.045]">
                  <Building2 className="size-4 text-black/60" />
                </span>

                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {client.archivedAt ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full font-semibold",
                        TONE_SOFT.warning,
                      )}
                    >
                      Archived
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full font-semibold",
                        INVITE_TONES[client.inviteState],
                      )}
                    >
                      {INVITE_LABELS[client.inviteState]}
                    </Badge>
                  )}
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-black/[0.035] text-black/55 transition-colors duration-300 group-hover:bg-[#2fe85c]/15 group-hover:text-[#08743d]">
                    <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </div>

              <h2 className="mt-4 truncate text-lg font-semibold tracking-[-0.035em]">
                {client.name}
              </h2>

              <dl className="mt-3 space-y-1.5">
                <Detail
                  icon={Mail}
                  value={client.primaryContact ?? "No contact yet"}
                  hint={client.primaryEmail}
                  muted={!client.primaryContact}
                />
                <Detail
                  icon={Globe}
                  value={client.website ?? "No website"}
                  muted={!client.website}
                />
              </dl>
            </CardContent>

            <CardFooter className="mt-5 grid grid-cols-2 gap-3 border-t border-black/[0.06] px-5 py-3.5">
              <Stat label="Projects" value={String(client.projectCount)} />
              <Stat label="Active" value={String(client.activeCount)} />
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function Detail({
  icon: Icon,
  value,
  hint,
  muted,
}: {
  icon: typeof Mail;
  value: string;
  hint?: string | null;
  muted?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="size-3.5 shrink-0 text-black/55" />
      <span
        className={cn(
          "min-w-0 truncate text-[12px]",
          muted ? "text-black/55" : "text-black/60",
        )}
      >
        {value}
        {hint ? <span className="ml-1.5 text-black/55">· {hint}</span> : null}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[8px] tracking-wider text-black/55 uppercase">
        {label}
      </p>
      <p className="mt-1 text-xs font-medium">{value}</p>
    </div>
  );
}
