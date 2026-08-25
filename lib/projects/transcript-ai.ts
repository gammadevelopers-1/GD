import "server-only";

import OpenAI, { toFile } from "openai";

const DEFAULT_MODEL = "gpt-5.6-terra";
const DEFAULT_TRANSCRIBE_MODEL = "whisper-1";
const MAX_OUTPUT_TOKENS = 2400;

export const TRANSCRIBE_MAX_BYTES = 25 * 1024 * 1024;

export const TRANSCRIPT_KINDS = [
  "video",
  "audio",
  "voice",
  "pdf",
  "doc",
  "image",
  "other",
] as const;

export type TranscriptKind = (typeof TRANSCRIPT_KINDS)[number];

export function isTranscriptKind(value: string): value is TranscriptKind {
  return (TRANSCRIPT_KINDS as readonly string[]).includes(value);
}

export function kindForFile(type: string, name: string): TranscriptKind {
  const lower = name.toLowerCase();
  if (
    type.startsWith("video/") ||
    /\.(mp4|mov|mkv|webm|avi|m4v)$/.test(lower)
  ) {
    return "video";
  }
  if (
    type.startsWith("audio/") ||
    /\.(mp3|m4a|wav|ogg|opus|oga|flac|aac|amr|wma)$/.test(lower)
  ) {
    return /voice|memo|note|whatsapp|ptt/.test(lower) ? "voice" : "audio";
  }
  if (type === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (
    type.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|heic|tiff?)$/.test(lower)
  ) {
    return "image";
  }
  if (
    type.startsWith("text/") ||
    /\.(txt|vtt|srt|md|markdown|csv|json|log|rtf|docx?|odt)$/.test(lower)
  ) {
    return "doc";
  }
  return "other";
}

export function speaks(kind: TranscriptKind) {
  return kind === "video" || kind === "audio" || kind === "voice";
}

function looksLikeText(sample: string) {
  if (!sample.trim()) return false;
  let odd = 0;
  for (const character of sample) {
    const code = character.codePointAt(0) ?? 0;
    if (code === 9 || code === 10 || code === 13) continue;
    if (code < 32 || code === 65533) odd += 1;
  }
  return odd / sample.length < 0.1;
}

export function transcriptAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

let client: OpenAI | null = null;

function openai(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    client = new OpenAI({ apiKey, maxRetries: 1, timeout: 120_000 });
  }
  return client;
}

function describeFailure(error: unknown, fallback: string): string {
  const status = (error as { status?: number } | null)?.status;
  const code = (error as { code?: string } | null)?.code;

  if (
    status === 429 ||
    code === "insufficient_quota" ||
    code === "credit_balance_exhausted"
  ) {
    return "The AI account has no credits left, so nothing was transcribed.";
  }
  if (status === 401 || status === 403) {
    return "The AI key was rejected. Check OPENAI_API_KEY.";
  }
  if (status === 404) {
    return "That AI model is unavailable. Check OPENAI_MODEL.";
  }
  if (status === 413) {
    return "That file is too large to transcribe.";
  }
  return fallback;
}

export type TranscriptPointDraft = {
  at_seconds: number | null;
  speaker: string | null;
  body: string;
  tag: string | null;
};

const POINTS_SCHEMA = {
  type: "object",
  properties: {
    points: {
      type: "array",
      description:
        "The points the source actually makes, in the order they were made.",
      items: {
        type: "object",
        properties: {
          at_seconds: {
            type: ["integer", "null"],
            description:
              "Seconds from the start of the recording, or null if the source has no timeline.",
          },
          speaker: {
            type: ["string", "null"],
            description:
              "Who said it, as named in the source. Null if it cannot be told.",
          },
          body: {
            type: "string",
            description:
              "One decision, requirement or question, in one sentence.",
          },
          tag: {
            type: ["string", "null"],
            description:
              "One word: Scope, Feature, Detail, Rule, Risk, Question or Decision.",
          },
        },
        required: ["at_seconds", "speaker", "body", "tag"],
        additionalProperties: false,
      },
    },
  },
  required: ["points"],
  additionalProperties: false,
} as const;

const SYSTEM = `You pull the working points out of a planning conversation for a small software studio.

You receive a transcript of a call, voice note or document. Return the points it
actually makes — the decisions, requirements, rules and open questions a team
would need to act on.

Rules:
- Every point must come from the source. Invent nothing, infer nothing.
- One point per idea, one sentence each, in the words the source used where you can.
- Skip greetings, scheduling and small talk.
- at_seconds is where the point starts. Use null when the source has no timeline.
- speaker is who said it, if the transcript names them. Otherwise null.
- Write each point in the language the source used. If it is Urdu, answer in Urdu.
  If it is Roman Urdu, keep Roman Urdu. If speakers mix languages, follow the
  language of that particular point. Never translate into English.
- The tag stays in English so the board can group on it.
- Return at most 40 points. If the source says nothing actionable, return an empty list.`;

const READ_SYSTEM = `You read a file and write out everything it contains, plainly.

Rules:
- Transcribe every word you can see, including handwriting, tables and captions.
- Keep the original language and script. Do not translate.
- Describe a diagram or screenshot only as far as it carries information.
- No preamble, no summary, no commentary. Just the contents.`;

async function readWithModel(
  file: Blob,
  filename: string,
  part: "input_file" | "input_image",
): Promise<TranscribeResult> {
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const type = file.type || "application/octet-stream";

  const content =
    part === "input_image"
      ? [
          {
            type: "input_image" as const,
            image_url: `data:${type};base64,${base64}`,
            detail: "high" as const,
          },
        ]
      : [
          {
            type: "input_file" as const,
            filename,
            file_data: `data:${type};base64,${base64}`,
          },
        ];

  const response = await openai().responses.create({
    model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
    instructions: READ_SYSTEM,
    input: [{ role: "user", content }],
    max_output_tokens: MAX_OUTPUT_TOKENS,
    store: false,
  });

  if (response.error) {
    return { ok: false, reason: "That file could not be read." };
  }

  const text = String(response.output_text ?? "").trim();
  if (!text) return { ok: false, reason: "That file appears to be empty." };

  return { ok: true, text, durationSeconds: null };
}

/**
 * Works out what the file is and reads it the way that file wants to be read:
 * speech goes to the transcriber, a page or a picture goes to the model that
 * can see it, and anything that is already text is simply decoded.
 */
export async function readSource(
  file: File,
): Promise<TranscribeResult & { kind?: TranscriptKind }> {
  if (!transcriptAiConfigured()) {
    return { ok: false, reason: "AI is not configured on this environment." };
  }
  if (file.size > TRANSCRIBE_MAX_BYTES) {
    return { ok: false, reason: "That file is over the 25 MB limit." };
  }

  const kind = kindForFile(file.type, file.name);

  try {
    if (speaks(kind)) {
      const spoken = await transcribeMedia(file, file.name);
      return spoken.ok ? { ...spoken, kind } : spoken;
    }

    if (kind === "image") {
      const seen = await readWithModel(file, file.name, "input_image");
      return seen.ok ? { ...seen, kind } : seen;
    }

    if (kind === "pdf") {
      const read = await readWithModel(file, file.name, "input_file");
      return read.ok ? { ...read, kind } : read;
    }

    const decoded = await file.text();
    if (looksLikeText(decoded.slice(0, 4000))) {
      const text = decoded.trim();
      if (!text) return { ok: false, reason: "That file is empty." };
      return { ok: true, text, durationSeconds: null, kind: "doc" };
    }

    const read = await readWithModel(file, file.name, "input_file");
    return read.ok ? { ...read, kind: "other" } : read;
  } catch (error) {
    return {
      ok: false,
      reason: describeFailure(error, "That file could not be read."),
    };
  }
}

export type TranscribeResult =
  | { ok: true; text: string; durationSeconds: number | null }
  | { ok: false; reason: string };

export async function transcribeMedia(
  file: Blob,
  filename: string,
): Promise<TranscribeResult> {
  if (!transcriptAiConfigured()) {
    return { ok: false, reason: "AI is not configured on this environment." };
  }
  if (file.size > TRANSCRIBE_MAX_BYTES) {
    return {
      ok: false,
      reason: "That file is over the 25 MB transcription limit.",
    };
  }

  try {
    const response = await openai().audio.transcriptions.create({
      file: await toFile(file, filename),
      model: process.env.OPENAI_TRANSCRIBE_MODEL ?? DEFAULT_TRANSCRIBE_MODEL,
      response_format: "verbose_json",
    });

    const text = String(response.text ?? "").trim();
    if (!text) {
      return { ok: false, reason: "Nothing was said in that recording." };
    }

    const duration = (response as { duration?: unknown }).duration;

    return {
      ok: true,
      text,
      durationSeconds:
        typeof duration === "number" && Number.isFinite(duration)
          ? Math.round(duration)
          : null,
    };
  } catch (error) {
    return {
      ok: false,
      reason: describeFailure(
        error,
        "That recording could not be transcribed.",
      ),
    };
  }
}

export type PointsResult =
  { ok: true; points: TranscriptPointDraft[] } | { ok: false; reason: string };

export async function extractPoints(
  text: string,
  sourceName: string,
): Promise<PointsResult> {
  if (!transcriptAiConfigured()) {
    return { ok: false, reason: "AI is not configured on this environment." };
  }

  const body = text.trim().slice(0, 60_000);
  if (!body) return { ok: false, reason: "There was nothing to read." };

  try {
    const response = await openai().responses.create({
      model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
      instructions: SYSTEM,
      input: `Source: ${sourceName}\n\n${body}`,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "gamma_transcript_points",
          strict: true,
          schema: POINTS_SCHEMA,
        },
      },
    });

    if (response.error) {
      return { ok: false, reason: "The transcript could not be organised." };
    }

    const parsed = JSON.parse(response.output_text) as { points?: unknown };
    if (!Array.isArray(parsed.points)) {
      return { ok: false, reason: "The transcript could not be organised." };
    }

    const points: TranscriptPointDraft[] = [];
    for (const entry of parsed.points.slice(0, 40)) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Record<string, unknown>;
      const pointBody = String(row.body ?? "").trim();
      if (!pointBody) continue;

      const at = row.at_seconds;
      points.push({
        at_seconds:
          typeof at === "number" && Number.isFinite(at) && at >= 0
            ? Math.round(at)
            : null,
        speaker:
          typeof row.speaker === "string" && row.speaker.trim()
            ? row.speaker.trim().slice(0, 80)
            : null,
        body: pointBody.slice(0, 4000),
        tag:
          typeof row.tag === "string" && row.tag.trim()
            ? row.tag.trim().slice(0, 40)
            : null,
      });
    }

    if (!points.length) {
      return { ok: false, reason: "Nothing actionable was said in that file." };
    }

    return { ok: true, points };
  } catch (error) {
    return {
      ok: false,
      reason: describeFailure(error, "The transcript could not be organised."),
    };
  }
}

const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    answer: {
      type: "string",
      description: "The answer, grounded only in the supplied points.",
    },
    grounded: {
      type: "boolean",
      description: "False when the points do not contain the answer.",
    },
  },
  required: ["answer", "grounded"],
  additionalProperties: false,
} as const;

const ASK_SYSTEM = `You answer questions about one project's transcript.

You receive the points already pulled from a recording, and a question. Answer
using those points only.

Rules:
- If the points do not answer it, set grounded to false and say what is missing.
- Quote the speaker and timestamp when it helps. Two or three sentences at most.
- Answer in the language the question was asked in. If the question is in Urdu or
  Roman Urdu, answer the same way.
- Never guess, never generalise beyond the points, never invent a speaker.`;

export type AskResult =
  | { ok: true; answer: string; grounded: boolean }
  | { ok: false; reason: string };

export async function askAboutPoints(
  question: string,
  points: Array<{
    atSeconds: number | null;
    speaker: string | null;
    body: string;
  }>,
): Promise<AskResult> {
  if (!transcriptAiConfigured()) {
    return { ok: false, reason: "AI is not configured on this environment." };
  }
  if (!points.length) {
    return { ok: false, reason: "There is no transcript to read yet." };
  }

  const input = points
    .map((point) => {
      const stamp =
        point.atSeconds === null ? "" : `[${stamp0(point.atSeconds)}] `;
      return `${stamp}${point.speaker ?? "Unknown"}: ${point.body}`;
    })
    .join("\n");

  try {
    const response = await openai().responses.create({
      model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
      instructions: ASK_SYSTEM,
      input: `Points:\n${input}\n\nQuestion: ${question.trim().slice(0, 600)}`,
      max_output_tokens: 600,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "gamma_transcript_answer",
          strict: true,
          schema: ANSWER_SCHEMA,
        },
      },
    });

    if (response.error) {
      return { ok: false, reason: "That question could not be answered." };
    }

    const parsed = JSON.parse(response.output_text) as {
      answer?: unknown;
      grounded?: unknown;
    };

    return {
      ok: true,
      answer:
        typeof parsed.answer === "string"
          ? parsed.answer.slice(0, 1200)
          : "Nothing came back.",
      grounded: parsed.grounded === true,
    };
  } catch (error) {
    return {
      ok: false,
      reason: describeFailure(error, "That question could not be answered."),
    };
  }
}

function stamp0(seconds: number) {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

const ORGANISE_SCHEMA = {
  type: "object",
  properties: {
    points: {
      type: "array",
      description:
        "Every point you were given, reworded and reordered. Same ids, none added, none dropped.",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "The id you were given." },
          body: {
            type: "string",
            description: "The point, tightened to one clear sentence.",
          },
          tag: {
            type: ["string", "null"],
            description:
              "One of Scope, Feature, Detail, Rule, Risk, Question, Decision.",
          },
        },
        required: ["id", "body", "tag"],
        additionalProperties: false,
      },
    },
  },
  required: ["points"],
  additionalProperties: false,
} as const;

const ORGANISE_SYSTEM = `You tidy the points pulled out of a project conversation.

You receive points in the order they were said. Return the same points, but:
- Reordered so related points sit together and what must happen first comes first.
- Reworded to one clear sentence each, keeping the meaning exactly.
- Tagged consistently: Scope, Feature, Detail, Rule, Risk, Question or Decision.

Rules:
- Return every id you were given, exactly once. Add nothing, drop nothing, merge nothing.
- Keep each point in the language it was written in. If it is Urdu or Roman Urdu,
  keep it that way. Only the tag is in English.
- Do not turn a question into a statement, or a risk into a task.`;

export type OrganisedPoint = { id: string; body: string; tag: string | null };

export type OrganiseResult =
  | { ok: true; points: OrganisedPoint[] }
  | { ok: false; reason: string };

export async function organisePoints(
  points: Array<{ id: string; body: string; tag: string | null }>,
): Promise<OrganiseResult> {
  if (!transcriptAiConfigured()) {
    return { ok: false, reason: "AI is not configured on this environment." };
  }
  if (points.length < 2) {
    return { ok: false, reason: "Add at least two points to organise them." };
  }

  const input = points
    .map((point) => `id: ${point.id}\ntag: ${point.tag ?? "-"}\n${point.body}`)
    .join("\n\n---\n\n");

  try {
    const response = await openai().responses.create({
      model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
      instructions: ORGANISE_SYSTEM,
      input,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "gamma_transcript_organised",
          strict: true,
          schema: ORGANISE_SCHEMA,
        },
      },
    });

    if (response.error) {
      return { ok: false, reason: "The points could not be organised." };
    }

    const parsed = JSON.parse(response.output_text) as { points?: unknown };
    if (!Array.isArray(parsed.points)) {
      return { ok: false, reason: "The points could not be organised." };
    }

    const supplied = new Map(points.map((point) => [point.id, point]));
    const seen = new Set<string>();
    const organised: OrganisedPoint[] = [];

    for (const entry of parsed.points) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Record<string, unknown>;
      const id = String(row.id ?? "");
      if (!supplied.has(id) || seen.has(id)) continue;

      const body = String(row.body ?? "").trim();
      if (!body) continue;

      seen.add(id);
      organised.push({
        id,
        body: body.slice(0, 4000),
        tag:
          typeof row.tag === "string" && row.tag.trim()
            ? row.tag.trim().slice(0, 40)
            : null,
      });
    }

    if (organised.length !== points.length) {
      return {
        ok: false,
        reason: "The result was incomplete, so nothing was changed.",
      };
    }

    return { ok: true, points: organised };
  } catch (error) {
    return {
      ok: false,
      reason: describeFailure(error, "The points could not be organised."),
    };
  }
}
