"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import {
  type SimpleFormState,
  formError,
  formSuccess,
} from "@/lib/projects/form-state";
import { isUuid } from "@/lib/projects/validation";
import { IdeaDocError, parseIdeaDoc } from "@/lib/projects/idea-doc";
import { ideaDocToText } from "@/lib/projects/idea-text";
import { type ProposedTask, proposeWeekTasks } from "@/lib/projects/week-ai";

function taskDoc(detail: string, references: string[]) {
  const content: Array<Record<string, unknown>> = [];

  if (detail.trim()) {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: detail.trim() }],
    });
  }

  if (references.length) {
    content.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "From the idea board",
          marks: [{ type: "bold" }],
        },
      ],
    });
    content.push({
      type: "bulletList",
      content: references.map((reference) => ({
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: reference }] },
        ],
      })),
    });
  }

  return { type: "doc", content };
}

function deniedOr(
  error: { code?: string; message?: string } | null,
  fallback: string,
) {
  if (error?.code === "42501" || error?.code === "PGRST301") {
    return "Only an owner or the project lead can change this board.";
  }
  return `${fallback} ${error?.message ?? ""}`.trim();
}

function refresh() {
  revalidatePath("/projects/[projectId]", "layout");
}

function isFrameworkSignal(error: unknown) {
  const digest = (error as { digest?: unknown })?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

export async function saveWeekIdeaBoard(
  weekId: string,
  serialisedDoc: string,
): Promise<SimpleFormState> {
  try {
    await requireRole(["owner", "member"]);
    if (!isUuid(weekId)) return formError("That week could not be found.");

    const doc = parseIdeaDoc(serialisedDoc);
    const supabase = await createClient();
    const { error } = await supabase.rpc("app_save_week_idea_board", {
      target_week_id: weekId,
      new_doc: doc,
    });

    if (error) {
      console.error("saveWeekIdeaBoard failed", error);
      return formError(`Not saved. ${error.message}`);
    }
    return formSuccess("Saved.");
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    if (error instanceof IdeaDocError) return formError(error.message);
    console.error("saveWeekIdeaBoard failed", error);
    return formError("The idea board could not be saved. Try again.");
  }
}

async function canManage(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("app_can_manage_project", {
    target_project_id: projectId,
  });
  return { supabase, allowed: data === true };
}

async function nextPosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  weekId: string,
) {
  const { data } = await supabase
    .from("app_milestone_cards")
    .select("position")
    .eq("milestone_week_id", weekId)
    .eq("board", "work")
    .is("archived_at", null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Number(data?.position ?? -1) + 1;
}

export async function saveTask(input: {
  projectId: string;
  weekId: string;
  cardId?: string;
  title: string;
  doc: string;
  assignedTo?: string | null;
}): Promise<SimpleFormState & { cardId?: string }> {
  try {
    const viewer = await requireRole(["owner", "member"]);
    const title = input.title.trim().slice(0, 240);

    if (!isUuid(input.projectId) || !isUuid(input.weekId)) {
      return formError("That week could not be found.");
    }
    if (!title) return formError("A task needs a title.");
    if (input.assignedTo && !isUuid(input.assignedTo)) {
      return formError("That person could not be found.");
    }

    const doc = parseIdeaDoc(input.doc);
    const supabase = await createClient();

    if (input.cardId) {
      if (!isUuid(input.cardId)) return formError("That task was not found.");
      const { error } = await supabase
        .from("app_milestone_cards")
        .update({
          title,
          doc,
          ...(input.assignedTo === undefined
            ? {}
            : { assigned_to: input.assignedTo }),
        })
        .eq("id", input.cardId);

      if (error) {
        console.error("saveTask update failed", error);
        return formError(deniedOr(error, "The task could not be saved."));
      }
      refresh();
      return formSuccess("Saved.");
    }

    const { data, error } = await supabase
      .from("app_milestone_cards")
      .insert({
        milestone_week_id: input.weekId,
        board: "work",
        status: "in_progress",
        title,
        doc,
        blocks: [],
        assigned_to: input.assignedTo ?? null,
        position: await nextPosition(supabase, input.weekId),
        created_by: viewer.id,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("saveTask insert failed", error);
      return formError(deniedOr(error, "The task could not be added."));
    }

    refresh();
    return { ...formSuccess("Task added."), cardId: String(data.id) };
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    if (error instanceof IdeaDocError) return formError(error.message);
    console.error("saveTask failed", error);
    return formError("The task could not be saved. Try again.");
  }
}

export async function setTaskDone(
  cardId: string,
  done: boolean,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);
  if (!isUuid(cardId)) return formError("That task could not be found.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_set_milestone_card_status", {
    target_card_id: cardId,
    next_status: done ? "completed" : "in_progress",
  });

  if (error) {
    console.error("setTaskDone failed", error);
    return formError(`That task was not updated. ${error.message}`);
  }

  return formSuccess(done ? "Ticked." : "Reopened.");
}

export async function acceptCarryOver(
  cardId: string,
  targetWeekId: string,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);
  if (!isUuid(cardId) || !isUuid(targetWeekId)) {
    return formError("That task could not be found.");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("app_carry_task_forward", {
    target_card_id: cardId,
  });

  if (error) {
    console.error("acceptCarryOver failed", error);
    return formError(
      deniedOr(error, "That task could not be carried forward."),
    );
  }

  const { error: dismissError } = await supabase
    .from("app_card_carry_dismissals")
    .insert({ card_id: cardId, milestone_week_id: targetWeekId });

  if (dismissError && dismissError.code !== "23505") {
    console.error("acceptCarryOver dismissal failed", dismissError);
  }

  refresh();
  return formSuccess("Moved into this week.");
}

export async function dismissCarryOver(
  cardId: string,
  targetWeekId: string,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);
  if (!isUuid(cardId) || !isUuid(targetWeekId)) {
    return formError("That task could not be found.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("app_card_carry_dismissals").insert({
    card_id: cardId,
    milestone_week_id: targetWeekId,
  });

  if (error && error.code !== "23505") {
    return formError("That suggestion could not be dismissed.");
  }

  refresh();
  return formSuccess("Dismissed.");
}

export async function suggestWeekTasks(
  projectId: string,
  weekId: string,
): Promise<SimpleFormState & { tasks?: ProposedTask[] }> {
  try {
    await requireRole(["owner", "member"]);
    if (!isUuid(projectId) || !isUuid(weekId)) {
      return formError("That week could not be found.");
    }

    const { supabase, allowed } = await canManage(projectId);
    if (!allowed) {
      return formError("Only an owner or the project lead can do this.");
    }

    const [boardResult, cardResult] = await Promise.all([
      supabase
        .from("app_week_idea_boards")
        .select("doc")
        .eq("milestone_week_id", weekId)
        .maybeSingle(),
      supabase
        .from("app_milestone_cards")
        .select("id, title")
        .eq("milestone_week_id", weekId)
        .eq("board", "work")
        .is("archived_at", null),
    ]);

    let notes = "";
    try {
      notes = ideaDocToText(parseIdeaDoc(boardResult.data?.doc ?? null));
    } catch (error) {
      if (!(error instanceof IdeaDocError)) throw error;
    }

    if (!notes.trim()) {
      return formError("Write something on the idea board first.");
    }

    const existing = (cardResult.data ?? []).map((row) => ({
      id: String(row.id),
      title: String(row.title),
    }));
    const proposal = await proposeWeekTasks(notes, existing);
    if (!proposal.ok) return formError(proposal.reason);

    return { ...formSuccess("Review the suggestions."), tasks: proposal.tasks };
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    console.error("suggestWeekTasks failed", error);
    return formError("The suggestions could not be generated. Try again.");
  }
}

export async function acceptWeekTasks(
  projectId: string,
  weekId: string,
  tasks: Array<{
    title: string;
    assignedTo?: string | null;
    detail?: string;
    references?: string[];
    existingId?: string | null;
  }>,
): Promise<SimpleFormState> {
  const viewer = await requireRole(["owner", "member"]);
  if (!isUuid(projectId) || !isUuid(weekId)) {
    return formError("That week could not be found.");
  }

  const clean = tasks
    .map((task) => ({
      title: task.title.trim().slice(0, 240),
      assignedTo:
        task.assignedTo && isUuid(task.assignedTo) ? task.assignedTo : null,
      doc: taskDoc(task.detail ?? "", task.references ?? []),
      existingId:
        task.existingId && isUuid(task.existingId) ? task.existingId : null,
    }))
    .filter((task) => task.title)
    .slice(0, 40);

  if (!clean.length) return formError("Pick at least one task to add.");

  const rewrites = clean.filter((task) => task.existingId);
  const additions = clean.filter((task) => !task.existingId);

  const supabase = await createClient();

  const rewriteResults = await Promise.all(
    rewrites.map((task) =>
      supabase
        .from("app_milestone_cards")
        .update({
          title: task.title,
          ...(task.assignedTo ? { assigned_to: task.assignedTo } : {}),
        })
        .eq("id", task.existingId as string),
    ),
  );

  const rewriteFailure = rewriteResults.find((result) => result.error)?.error;
  if (rewriteFailure) {
    console.error("acceptWeekTasks rewrite failed", rewriteFailure);
    return formError(deniedOr(rewriteFailure, "A task could not be updated."));
  }

  if (additions.length) {
    const start = await nextPosition(supabase, weekId);

    const { error } = await supabase.from("app_milestone_cards").insert(
      additions.map((task, index) => ({
        milestone_week_id: weekId,
        board: "work",
        status: "in_progress",
        title: task.title,
        doc: task.doc,
        blocks: [],
        assigned_to: task.assignedTo,
        position: start + index,
        created_by: viewer.id,
      })),
    );

    if (error) {
      console.error("acceptWeekTasks failed", error);
      return formError(deniedOr(error, "Those tasks could not be added."));
    }
  }

  refresh();

  const parts: string[] = [];
  if (additions.length) parts.push(`${additions.length} added`);
  if (rewrites.length) parts.push(`${rewrites.length} tidied`);
  return formSuccess(`${parts.join(", ")}.`);
}
