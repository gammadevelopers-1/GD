"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import {
  IDLE_FORM,
  type SimpleFormState,
  formError,
  formSuccess,
} from "@/lib/projects/form-state";
import { isUuid } from "@/lib/projects/validation";
import { BlockError, parseBlocks } from "@/lib/projects/blocks";
import { isCardStatus } from "@/lib/projects/board";
import { draftIdeaBlocks, suggestIdeaOrder } from "@/lib/projects/board-ai";

function safeParseBlocks(raw: unknown) {
  try {
    return parseBlocks(raw);
  } catch {
    return [];
  }
}

const TITLE_MAX = 240;
const REASON_MAX = 2000;
const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function refresh() {
  revalidatePath("/projects/[projectId]", "layout");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

async function assertCanManage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
) {
  const { data } = await supabase.rpc("app_can_manage_project", {
    target_project_id: projectId,
  });
  return data === true;
}

function readTitle(formData: FormData) {
  return String(formData.get("title") ?? "")
    .trim()
    .slice(0, TITLE_MAX);
}

function readReason(formData: FormData) {
  const value = String(formData.get("reason") ?? "")
    .trim()
    .slice(0, REASON_MAX);
  return value || null;
}

export async function createCard(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  const viewer = await requireRole(["owner", "member"]);
  const projectId = String(formData.get("projectId") ?? "");
  const weekId = String(formData.get("weekId") ?? "");
  const title = readTitle(formData);

  if (!isUuid(projectId) || !isUuid(weekId)) {
    return formError("That week could not be found.");
  }
  if (!title) return formError("Give the idea a title.");

  const supabase = await createClient();
  if (!(await assertCanManage(supabase, projectId))) {
    return formError("Only an owner or the project lead can edit this board.");
  }

  const { data: last } = await supabase
    .from("app_milestone_cards")
    .select("position")
    .eq("milestone_week_id", weekId)
    .eq("board", "idea")
    .is("archived_at", null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("app_milestone_cards").insert({
    milestone_week_id: weekId,
    board: "idea",
    status: "idea",
    title,
    blocks: [],
    position: (Number(last?.position ?? -1) || 0) + (last ? 1 : 0),
    created_by: viewer.id,
  });

  if (error) return formError("The idea could not be added.");

  refresh();
  return formSuccess("Added to the Idea Board.");
}

export async function saveCard(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);
  const projectId = String(formData.get("projectId") ?? "");
  const cardId = String(formData.get("cardId") ?? "");
  const title = readTitle(formData);

  if (!isUuid(projectId) || !isUuid(cardId)) {
    return formError("That card could not be found.");
  }
  if (!title) return formError("A card needs a title.");

  let blocks;
  try {
    blocks = parseBlocks(formData.get("blocks"));
  } catch (error) {
    return formError(
      error instanceof BlockError
        ? error.message
        : "That content could not be saved.",
    );
  }

  const supabase = await createClient();
  if (!(await assertCanManage(supabase, projectId))) {
    return formError("Only an owner or the project lead can edit this board.");
  }

  const { error } = await supabase
    .from("app_milestone_cards")
    .update({ title, blocks })
    .eq("id", cardId);

  if (error) return formError("The card could not be saved.");

  refresh();
  return formSuccess("Saved.");
}

export async function moveCard(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);
  const projectId = String(formData.get("projectId") ?? "");
  const cardId = String(formData.get("cardId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!isUuid(projectId) || !isUuid(cardId)) {
    return formError("That card could not be found.");
  }
  if (!isCardStatus(status)) return formError("Unknown card state.");

  const reason = readReason(formData);
  if (status === "blocked" && !reason) {
    return formError("Say what is blocking it, so the next person knows.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_set_milestone_card_status", {
    target_card_id: cardId,
    next_status: status,
    reason,
  });

  if (error) {
    return formError(
      error.code === "42501"
        ? "Only an owner or the project lead can move cards."
        : "That move could not be saved.",
    );
  }

  refresh();
  return formSuccess("Moved.");
}

export async function carryCard(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);
  const projectId = String(formData.get("projectId") ?? "");
  const cardId = String(formData.get("cardId") ?? "");
  const weekId = String(formData.get("weekId") ?? "");

  if (!isUuid(projectId) || !isUuid(cardId) || !isUuid(weekId)) {
    return formError("That card could not be moved.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_carry_milestone_card", {
    target_card_id: cardId,
    target_week_id: weekId,
    reason: readReason(formData),
  });

  if (error) {
    return formError(
      error.code === "42501"
        ? "Only an owner or the project lead can move cards."
        : "That card could not be carried over.",
    );
  }

  refresh();
  return formSuccess("Carried into the next week.");
}

export async function reorderCards(formData: FormData) {
  await requireRole(["owner", "member"]);
  const projectId = String(formData.get("projectId") ?? "");
  const weekId = String(formData.get("weekId") ?? "");
  const board = String(formData.get("board") ?? "");
  const ordered = String(formData.get("orderedIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(isUuid);

  if (!isUuid(projectId) || !isUuid(weekId) || !ordered.length) return;
  if (board !== "idea" && board !== "work") return;

  const supabase = await createClient();
  await supabase.rpc("app_reorder_milestone_cards", {
    target_week_id: weekId,
    target_board: board,
    ordered_ids: ordered,
  });

  refresh();
}

export async function setCardArchived(formData: FormData) {
  await requireRole(["owner", "member"]);
  const projectId = String(formData.get("projectId") ?? "");
  const cardId = String(formData.get("cardId") ?? "");
  const archived = String(formData.get("archived") ?? "") === "1";
  if (!isUuid(projectId) || !isUuid(cardId)) return;

  const supabase = await createClient();
  if (!(await assertCanManage(supabase, projectId))) return;

  await supabase
    .from("app_milestone_cards")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", cardId);

  refresh();
}

export async function draftCard(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState & { blocks?: unknown }> {
  await requireRole(["owner", "member"]);
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!isUuid(projectId)) return formError("That project could not be found.");

  const supabase = await createClient();
  if (!(await assertCanManage(supabase, projectId))) {
    return formError("Only an owner or the project lead can edit this board.");
  }

  const existing = safeParseBlocks(formData.get("blocks"));
  const draft = await draftIdeaBlocks(title, existing);
  if (!draft.ok) return formError(draft.reason);

  return {
    ...formSuccess("Drafted below — edit anything, then save."),
    blocks: draft.blocks,
  };
}

export async function organiseWeek(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);
  const projectId = String(formData.get("projectId") ?? "");
  const weekId = String(formData.get("weekId") ?? "");

  if (!isUuid(projectId) || !isUuid(weekId)) {
    return formError("That week could not be found.");
  }

  const supabase = await createClient();
  if (!(await assertCanManage(supabase, projectId))) {
    return formError("Only an owner or the project lead can reorder a week.");
  }

  const { data: rows } = await supabase
    .from("app_milestone_cards")
    .select("id, title, blocks")
    .eq("milestone_week_id", weekId)
    .eq("board", "idea")
    .is("archived_at", null)
    .order("position");

  const ideas = (rows ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    blocks: safeParseBlocks(row.blocks),
  }));

  const suggestion = await suggestIdeaOrder(ideas);
  if (!suggestion.ok) return formError(suggestion.reason);

  const { error } = await supabase.rpc("app_reorder_milestone_cards", {
    target_week_id: weekId,
    target_board: "idea",
    ordered_ids: suggestion.orderedIds,
  });

  if (error) return formError("The new order could not be saved.");

  refresh();
  return formSuccess(suggestion.rationale);
}

export async function uploadAttachment(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState & { path?: string; name?: string; size?: number }> {
  await requireRole(["owner", "member"]);
  const projectId = String(formData.get("projectId") ?? "");
  const cardId = String(formData.get("cardId") ?? "");
  const file = formData.get("file");

  if (!isUuid(projectId) || !isUuid(cardId)) {
    return formError("That card could not be found.");
  }
  if (!(file instanceof File) || !file.size) {
    return formError("Choose a file to attach.");
  }
  if (file.size > ATTACHMENT_MAX_BYTES) {
    return formError("Attachments are limited to 10MB.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return formError("That file type cannot be attached.");
  }

  const supabase = await createClient();
  if (!(await assertCanManage(supabase, projectId))) {
    return formError("Only an owner or the project lead can attach files.");
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
  const path = `${projectId}/${cardId}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage
    .from("app-project-attachments")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return formError("The file could not be uploaded.");

  return {
    ...formSuccess("Attached."),
    path,
    name: file.name.slice(0, 200),
    size: file.size,
  };
}

export async function uploadCardFile(formData: FormData) {
  return uploadAttachment(IDLE_FORM, formData);
}
