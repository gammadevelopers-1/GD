import { Suspense } from "react";
import { Inbox, MailWarning } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { LeadList } from "@/components/admin/leads/lead-list";
import { PageHeading } from "@/components/admin/page-heading";
import { CardGridSkeleton } from "@/components/admin/skeletons";
import { requireRole, type Viewer } from "@/data/auth";
import { getContactLeads, leadCounts } from "@/data/leads";
import { PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export default async function LeadsPage() {
  const viewer = await requireRole(["owner"]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeading title="Contact leads" />

      <Suspense fallback={<CardGridSkeleton count={5} height="h-16" />}>
        <LeadInbox viewer={viewer} />
      </Suspense>
    </div>
  );
}

async function LeadInbox({ viewer }: { viewer: Viewer }) {
  const leads = await getContactLeads(viewer);
  const counts = leadCounts(leads);
  const open = leads.filter((lead) => !lead.archivedAt);
  const archived = leads.filter((lead) => lead.archivedAt);

  if (!leads.length) {
    return (
      <EmptyState
        icon={Inbox}
        title="No enquiries yet"
        description="Everything sent through the form on /contact lands here, whether or not the notification email goes out."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label="Open" value={counts.total} />
        <Stat label="Unworked" value={counts.unread} />
        <Stat
          label="Never mailed"
          value={counts.unnotified}
          warn={counts.unnotified > 0}
        />
      </div>

      {counts.unnotified > 0 ? (
        <p className="flex items-start gap-2 rounded-xl border border-amber-700/25 bg-amber-500/10 px-3.5 py-2.5 text-[12px] leading-[1.55] text-amber-900">
          <MailWarning className="mt-px size-4 shrink-0" />
          <span>
            {counts.unnotified === 1
              ? "One enquiry is"
              : `${counts.unnotified} enquiries are`}{" "}
            stored here but never reached the inbox — check that{" "}
            <code className="font-mono">RESEND_API_KEY</code> and{" "}
            <code className="font-mono">NOTIFICATIONS_FROM</code> are set.
          </span>
        </p>
      ) : null}

      {open.length ? (
        <LeadList leads={open} />
      ) : (
        <EmptyState
          icon={Inbox}
          title="Inbox clear"
          description="Every enquiry has been archived."
        />
      )}

      {archived.length ? (
        <section>
          <h2 className="mb-3 font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
            Archived
          </h2>
          <LeadList leads={archived} />
        </section>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div className={cn(PANEL, "px-4 py-3")}>
      <p className="font-mono text-[9px] tracking-[0.16em] text-black/45 uppercase">
        {label}
      </p>
      <p
        className={cn(
          "font-display mt-1 text-[26px] leading-none font-semibold tracking-[-0.04em]",
          warn ? "text-amber-800" : "text-[#14171a]",
        )}
      >
        {value}
      </p>
    </div>
  );
}
