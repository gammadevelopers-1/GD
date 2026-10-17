import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import type { ContactLead, LeadStatus } from "@/lib/contact/leads";

export type { ContactLead, LeadStatus } from "@/lib/contact/leads";
export { LEAD_STATUSES, LEAD_STATUS_LABEL } from "@/lib/contact/leads";

const COLUMNS =
  "id, created_at, first_name, last_name, email, phone, company, country, role_title, headcount, revenue, stage, budget, timeline, summary, status, owner_note, handled_by, handled_at, archived_at, source_path, referrer, notified_at";

type Row = Record<string, unknown>;

function toLead(row: Row, names: Map<string, string>): ContactLead {
  const firstName = String(row.first_name ?? "");
  const lastName = String(row.last_name ?? "");
  const handledBy = row.handled_by ? String(row.handled_by) : null;

  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email: String(row.email ?? ""),
    phone: row.phone ? String(row.phone) : null,
    company: String(row.company ?? ""),
    country: String(row.country ?? ""),
    roleTitle: String(row.role_title ?? ""),
    headcount: String(row.headcount ?? ""),
    revenue: String(row.revenue ?? ""),
    stage: String(row.stage ?? ""),
    budget: String(row.budget ?? ""),
    timeline: String(row.timeline ?? ""),
    summary: String(row.summary ?? ""),
    status: (row.status as LeadStatus) ?? "new",
    ownerNote: row.owner_note ? String(row.owner_note) : null,
    handledBy: handledBy ? (names.get(handledBy) ?? null) : null,
    handledAt: row.handled_at ? String(row.handled_at) : null,
    archivedAt: row.archived_at ? String(row.archived_at) : null,
    sourcePath: row.source_path ? String(row.source_path) : null,
    referrer: row.referrer ? String(row.referrer) : null,
    notifiedAt: row.notified_at ? String(row.notified_at) : null,
  };
}

export const getContactLeads = cache(
  async (viewer: Viewer): Promise<ContactLead[]> => {
    if (viewer.role !== "owner") return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_contact_leads")
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error || !data?.length) return [];

    // One lookup for the handful of colleagues who have touched a lead, rather
    // than a join that would widen the row for every read.
    const handlerIds = [
      ...new Set(data.map((row) => row.handled_by).filter(Boolean) as string[]),
    ];

    const names = new Map<string, string>();
    if (handlerIds.length) {
      const { data: profiles } = await supabase
        .from("app_profiles")
        .select("id, full_name, display_name")
        .in("id", handlerIds);

      for (const profile of profiles ?? []) {
        names.set(
          String(profile.id),
          String(profile.display_name ?? profile.full_name),
        );
      }
    }

    return data.map((row) => toLead(row as Row, names));
  },
);

export function leadCounts(leads: ContactLead[]) {
  const open = leads.filter((lead) => !lead.archivedAt);

  return {
    total: open.length,
    unread: open.filter((lead) => lead.status === "new").length,
    /** Stored but never mailed — the console is the only place these exist. */
    unnotified: open.filter((lead) => !lead.notifiedAt).length,
  };
}
