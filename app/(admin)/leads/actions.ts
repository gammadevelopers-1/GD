"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/data/auth";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/contact/leads";
import {
  formError,
  formSuccess,
  type SimpleFormState,
} from "@/lib/projects/form-state";
import { isUuid } from "@/lib/projects/validation";
import { createClient } from "@/lib/supabase/server";

const NOTE_MAX = 4000;

function isStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as string[]).includes(value);
}

export async function setLeadStatus(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);

  const leadId = String(formData.get("leadId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, NOTE_MAX);

  if (!isUuid(leadId)) return formError("That lead is not valid.");
  if (!isStatus(status)) return formError("That status is not valid.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_set_contact_lead_status", {
    lead_id: leadId,
    next_status: status,
    note: note || null,
  });

  if (error) return formError("Could not update that lead.");

  revalidatePath("/leads");
  return formSuccess("Lead updated.");
}

export async function archiveLead(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner"]);

  const leadId = String(formData.get("leadId") ?? "");
  const archived = String(formData.get("archived") ?? "true") === "true";

  if (!isUuid(leadId)) return formError("That lead is not valid.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_archive_contact_lead", {
    lead_id: leadId,
    archived,
  });

  if (error) return formError("Could not archive that lead.");

  revalidatePath("/leads");
  return formSuccess(archived ? "Lead archived." : "Lead restored.");
}
