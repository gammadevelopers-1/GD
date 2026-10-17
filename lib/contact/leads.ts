/**
 * The shape of a lead, shared by the server that reads it and the console that
 * renders it.
 *
 * Kept apart from data/leads.ts deliberately: that module is server-only and
 * pulls in the Supabase server client, so a "use client" component importing a
 * type from it would drag next/headers into the browser bundle and fail the
 * whole build. Types and label maps live here; queries live there.
 */

export type LeadStatus = "new" | "contacted" | "qualified" | "closed" | "spam";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "closed",
  "spam",
];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  closed: "Closed",
  spam: "Spam",
};

export type ContactLead = {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  country: string;
  roleTitle: string;
  headcount: string;
  revenue: string;
  stage: string;
  budget: string;
  timeline: string;
  summary: string;
  status: LeadStatus;
  ownerNote: string | null;
  /** Display name of the colleague who last changed the status. */
  handledBy: string | null;
  handledAt: string | null;
  archivedAt: string | null;
  sourcePath: string | null;
  referrer: string | null;
  /** Null means the lead was stored but the notification never left. */
  notifiedAt: string | null;
};
