export type TranscriptKind =
  "video" | "audio" | "voice" | "pdf" | "doc" | "image" | "other";

export type TranscriptStatus = "pending" | "ready" | "failed";

import type { IdeaDoc } from "@/lib/projects/idea-doc";

export type TranscriptPoint = {
  id: string;
  atSeconds: number | null;
  speaker: string | null;
  body: string;
  tag: string | null;
  doc: IdeaDoc | null;
  cardId: string | null;
};

export type WeekTranscript = {
  id: string;
  kind: TranscriptKind;
  name: string;
  storagePath: string;
  durationSeconds: number | null;
  status: TranscriptStatus;
  failure: string | null;
  createdAt: string;
  createdBy: string | null;
  points: TranscriptPoint[];
};

export function stamp(seconds: number | null) {
  if (seconds === null) return null;
  const whole = Math.max(0, Math.round(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours
    ? `${hours}:${pad(minutes)}:${pad(rest)}`
    : `${pad(minutes)}:${pad(rest)}`;
}

export function duration(seconds: number | null) {
  const shown = stamp(seconds);
  return shown ?? "unknown length";
}

const KIND_NOUN: Record<TranscriptKind, string> = {
  video: "Recording",
  audio: "Audio",
  voice: "Voice note",
  pdf: "Document",
  doc: "Document",
  image: "Image",
  other: "File",
};

export function kindNoun(kind: TranscriptKind) {
  return KIND_NOUN[kind] ?? "File";
}

export function pointCount(transcript: WeekTranscript | null) {
  return transcript?.points.length ?? 0;
}
