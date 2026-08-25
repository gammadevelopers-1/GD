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
import {
  TRANSCRIBE_MAX_BYTES,
  askAboutPoints,
  extractPoints,
  organisePoints,
  readSource,
  transcriptAiConfigured,
} from "@/lib/projects/transcript-ai";

const MEDIA_BUCKET = "app-week-media";
const QUESTION_MAX = 600;

function refresh() {
  revalidatePath("/projects", "layout");
}

function notConfigured() {
  return formError(
    "Transcription is not configured on this environment, so nothing was read.",
  );
}

/**
 * One press does the whole thing: store the file, transcribe it, pull the
 * points out, write them. Anything that fails after the row exists marks the
 * source failed rather than leaving it pending forever.
 */
export async function addTranscriptSource(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const projectId = String(formData.get("projectId") ?? "");
  const weekId = String(formData.get("weekId") ?? "");
  const file = formData.get("file");

  if (!isUuid(projectId) || !isUuid(weekId)) {
    return formError("That week could not be found.");
  }
  if (!(file instanceof File) || !file.size) {
    return formError("Choose a file to read.");
  }
  if (file.size > TRANSCRIBE_MAX_BYTES) {
    return formError("Files are limited to 25MB.");
  }
  if (!transcriptAiConfigured()) return notConfigured();

  const read = await readSource(file);
  if (!read.ok) return formError(read.reason);
  const kind = read.kind ?? "other";

  const supabase = await createClient();

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
  const path = `${projectId}/${weekId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return formError("That file could not be uploaded.");

  const { data: created, error: createError } = await supabase.rpc(
    "app_create_week_transcript",
    {
      target_week_id: weekId,
      new_kind: kind,
      new_name: file.name.slice(0, 200),
      new_storage_path: path,
      new_duration_seconds: read.durationSeconds,
    },
  );

  if (createError || typeof created !== "string") {
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    return formError("That source could not be saved.");
  }

  const points = await extractPoints(read.text, file.name);
  if (!points.ok) {
    await supabase.rpc("app_fail_week_transcript", {
      target_transcript_id: created,
      reason: points.reason,
    });
    refresh();
    return formError(points.reason);
  }

  const { data: written, error: writeError } = await supabase.rpc(
    "app_record_transcript_points",
    {
      target_transcript_id: created,
      new_points: points.points,
    },
  );

  if (writeError) {
    await supabase.rpc("app_fail_week_transcript", {
      target_transcript_id: created,
      reason: "The points could not be saved.",
    });
    refresh();
    return formError("The points could not be saved.");
  }

  refresh();
  const count = Number(written ?? 0);
  return formSuccess(
    count === 1 ? "Pulled out 1 point." : `Pulled out ${count} points.`,
  );
}

export async function askAi(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState & { answer?: string; grounded?: boolean }> {
  await requireRole(["owner", "member"]);

  const weekId = String(formData.get("weekId") ?? "");
  const question = String(formData.get("question") ?? "").trim();

  if (!isUuid(weekId)) return formError("That week could not be found.");
  if (!question) return formError("Ask a question.");
  if (question.length > QUESTION_MAX) {
    return formError("That question is too long.");
  }
  if (!transcriptAiConfigured()) return notConfigured();

  const supabase = await createClient();

  const { data: sources } = await supabase
    .from("app_week_transcripts")
    .select("id")
    .eq("milestone_week_id", weekId)
    .is("archived_at", null);

  const ids = (sources ?? []).map((row) => String(row.id));
  if (!ids.length) {
    return formError("There is no transcript on this week yet.");
  }

  const { data: rows } = await supabase
    .from("app_week_transcript_points")
    .select("at_seconds, speaker, body")
    .in("transcript_id", ids)
    .is("archived_at", null)
    .order("position", { ascending: true });

  const points = (rows ?? []).map((row) => ({
    atSeconds:
      typeof row.at_seconds === "number" ? Math.round(row.at_seconds) : null,
    speaker: typeof row.speaker === "string" ? row.speaker : null,
    body: String(row.body ?? ""),
  }));

  const answer = await askAboutPoints(question, points);
  if (!answer.ok) return formError(answer.reason);

  return {
    ...formSuccess("Answered."),
    answer: answer.answer,
    grounded: answer.grounded,
  };
}

export async function sendPointToWorkBoard(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const pointId = String(formData.get("pointId") ?? "");
  if (!isUuid(pointId)) return formError("That point could not be found.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_send_point_to_work_board", {
    target_point_id: pointId,
  });

  if (error) return formError("That point could not be sent.");

  refresh();
  return formSuccess("Added to the Work Board.");
}

export async function saveTranscriptPoint(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const pointId = String(formData.get("pointId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const speaker = String(formData.get("speaker") ?? "").trim();
  const tag = String(formData.get("tag") ?? "").trim();
  const rawDoc = String(formData.get("doc") ?? "").trim();

  if (!isUuid(pointId)) return formError("That point could not be found.");
  if (!body) return formError("A point needs something in it.");

  let doc: unknown = null;
  if (rawDoc) {
    try {
      doc = parseIdeaDoc(JSON.parse(rawDoc));
    } catch (error) {
      if (error instanceof IdeaDocError) return formError(error.message);
      return formError("That note could not be read.");
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_update_transcript_point", {
    target_point_id: pointId,
    new_body: body,
    new_speaker: speaker || null,
    new_tag: tag || null,
    new_doc: doc,
  });

  if (error) return formError("That point could not be saved.");

  refresh();
  return formSuccess("Saved.");
}

export async function removeTranscriptPoint(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const pointId = String(formData.get("pointId") ?? "");
  if (!isUuid(pointId)) return formError("That point could not be found.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_archive_transcript_point", {
    target_point_id: pointId,
  });

  if (error) return formError("That point could not be removed.");

  refresh();
  return formSuccess("Removed.");
}

export async function removeTranscriptSource(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const transcriptId = String(formData.get("transcriptId") ?? "");
  if (!isUuid(transcriptId))
    return formError("That source could not be found.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("app_archive_week_transcript", {
    target_transcript_id: transcriptId,
  });

  if (error) return formError("That source could not be removed.");

  refresh();
  return formSuccess("Source removed.");
}

/**
 * Reshapes a week's transcript points the way the Work Board reshapes tasks:
 * one press, one model call, and the whole source is rewritten or nothing is.
 */
export async function organiseTranscriptPoints(
  _state: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["owner", "member"]);

  const weekId = String(formData.get("weekId") ?? "");
  if (!isUuid(weekId)) return formError("That week could not be found.");
  if (!transcriptAiConfigured()) return notConfigured();

  const supabase = await createClient();

  const { data: sources } = await supabase
    .from("app_week_transcripts")
    .select("id")
    .eq("milestone_week_id", weekId)
    .is("archived_at", null);

  const ids = (sources ?? []).map((row) => String(row.id));
  if (!ids.length) return formError("There is no transcript on this week yet.");

  const { data: rows } = await supabase
    .from("app_week_transcript_points")
    .select("id, transcript_id, body, tag")
    .in("transcript_id", ids)
    .is("archived_at", null)
    .order("position", { ascending: true });

  const points = (rows ?? []).map((row) => ({
    id: String(row.id),
    transcriptId: String(row.transcript_id),
    body: String(row.body ?? ""),
    tag: typeof row.tag === "string" ? row.tag : null,
  }));

  if (points.length < 2) {
    return formError("Add at least two points to organise them.");
  }

  const organised = await organisePoints(
    points.map(({ id, body, tag }) => ({ id, body, tag })),
  );
  if (!organised.ok) return formError(organised.reason);

  const home = new Map(points.map((point) => [point.id, point.transcriptId]));
  const perSource = new Map<
    string,
    Array<{ id: string; body: string; tag: string | null; position: number }>
  >();

  for (const point of organised.points) {
    const sourceId = home.get(point.id);
    if (!sourceId) continue;
    const list = perSource.get(sourceId) ?? [];
    list.push({ ...point, position: list.length });
    perSource.set(sourceId, list);
  }

  let touched = 0;
  for (const [sourceId, updates] of perSource) {
    const { data, error } = await supabase.rpc(
      "app_organise_transcript_points",
      { target_transcript_id: sourceId, updates },
    );
    if (error) return formError("The points could not be saved.");
    touched += Number(data ?? 0);
  }

  if (!touched) return formError("Nothing was changed.");

  refresh();
  return formSuccess(
    touched === 1 ? "1 point reorganised." : `${touched} points reorganised.`,
  );
}
