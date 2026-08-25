import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";
import { signStoragePaths } from "@/lib/supabase/admin";
import {
  type IdeaDoc,
  IdeaDocError,
  parseIdeaDoc,
} from "@/lib/projects/idea-doc";
import type {
  TranscriptKind,
  TranscriptPoint,
  TranscriptStatus,
  WeekTranscript,
} from "@/lib/projects/transcript";

const MEDIA_BUCKET = "app-week-media";

type SourceRow = {
  id: unknown;
  milestone_week_id: unknown;
  kind: unknown;
  name: unknown;
  storage_path: unknown;
  duration_seconds: unknown;
  status: unknown;
  failure: unknown;
  created_at: unknown;
  author: { full_name: string } | null;
};

type PointRow = {
  id: unknown;
  transcript_id: unknown;
  at_seconds: unknown;
  speaker: unknown;
  body: unknown;
  tag: unknown;
  doc: unknown;
  card_id: unknown;
};

function readDoc(value: unknown): IdeaDoc | null {
  if (!value) return null;
  try {
    const parsed = parseIdeaDoc(value);
    return parsed.content.length ? parsed : null;
  } catch (error) {
    if (error instanceof IdeaDocError) return null;
    throw error;
  }
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function whole(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : null;
}

/**
 * Every transcript on a week, newest source first, with its points in order.
 * RLS has already limited this to weeks the viewer can open, so there is no
 * second check here — what comes back is what they are allowed to see.
 */
export const getWeekTranscripts = cache(async function getWeekTranscripts(
  weekIds: string[],
  viewer: Viewer,
): Promise<Record<string, WeekTranscript[]>> {
  if (!weekIds.length) return {};
  if (viewer.role !== "owner" && viewer.role !== "member") return {};

  const supabase = await createClient();

  const { data: sources } = await supabase
    .from("app_week_transcripts")
    .select(
      "id, milestone_week_id, kind, name, storage_path, duration_seconds, status, failure, created_at, author:app_profiles!app_week_transcripts_created_by_fkey(full_name)",
    )
    .in("milestone_week_id", weekIds)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  const rows = (sources ?? []) as unknown as SourceRow[];
  if (!rows.length) return {};

  const ids = rows.map((row) => String(row.id));

  const { data: pointRows } = await supabase
    .from("app_week_transcript_points")
    .select("id, transcript_id, at_seconds, speaker, body, tag, doc, card_id")
    .in("transcript_id", ids)
    .is("archived_at", null)
    .order("position", { ascending: true });

  const byTranscript = new Map<string, TranscriptPoint[]>();
  for (const row of (pointRows ?? []) as unknown as PointRow[]) {
    const key = String(row.transcript_id);
    const list = byTranscript.get(key) ?? [];
    list.push({
      id: String(row.id),
      atSeconds: whole(row.at_seconds),
      speaker: text(row.speaker),
      body: String(row.body ?? ""),
      tag: text(row.tag),
      doc: readDoc(row.doc),
      cardId: text(row.card_id),
    });
    byTranscript.set(key, list);
  }

  const grouped: Record<string, WeekTranscript[]> = {};
  for (const row of rows) {
    const weekId = String(row.milestone_week_id);
    const list = grouped[weekId] ?? [];
    list.push({
      id: String(row.id),
      kind: String(row.kind) as TranscriptKind,
      name: String(row.name ?? ""),
      storagePath: String(row.storage_path ?? ""),
      durationSeconds: whole(row.duration_seconds),
      status: String(row.status ?? "pending") as TranscriptStatus,
      failure: text(row.failure),
      createdAt: String(row.created_at ?? ""),
      createdBy: row.author?.full_name ?? null,
      points: byTranscript.get(String(row.id)) ?? [],
    });
    grouped[weekId] = list;
  }

  return grouped;
});

/**
 * Signed URLs for the media itself, so the panel can play a recording without
 * the bucket ever being public.
 */
export async function signTranscriptMedia(
  transcripts: WeekTranscript[],
): Promise<Record<string, string>> {
  const paths = transcripts
    .map((transcript) => transcript.storagePath)
    .filter(Boolean);
  if (!paths.length) return {};
  return signStoragePaths(MEDIA_BUCKET, paths);
}
