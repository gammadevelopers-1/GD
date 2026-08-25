"use client";

import {
  type CSSProperties,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ExternalLink,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Mic,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { IDLE_FORM, type SimpleFormState } from "@/lib/projects/form-state";
import {
  type TranscriptKind,
  type TranscriptPoint,
  type WeekTranscript,
  duration,
  kindNoun,
  stamp,
} from "@/lib/projects/transcript";
import { FOCUS_RING, TONE_SOFT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/admin/empty-state";
import {
  IdeaEditor,
  type IdeaEditorHandle,
} from "@/components/admin/projects/idea-editor";
import { EMPTY_DOC, type IdeaDoc } from "@/lib/projects/idea-doc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type AskAction = (
  state: SimpleFormState & { answer?: string; grounded?: boolean },
  formData: FormData,
) => Promise<SimpleFormState & { answer?: string; grounded?: boolean }>;

export type TranscriptActions = {
  addSource: (
    state: SimpleFormState,
    formData: FormData,
  ) => Promise<SimpleFormState>;
  ask: AskAction;
  sendToWork: (
    state: SimpleFormState,
    formData: FormData,
  ) => Promise<SimpleFormState>;
  removeSource: (
    state: SimpleFormState,
    formData: FormData,
  ) => Promise<SimpleFormState>;
  removePoint: (
    state: SimpleFormState,
    formData: FormData,
  ) => Promise<SimpleFormState>;
  savePoint: (
    state: SimpleFormState,
    formData: FormData,
  ) => Promise<SimpleFormState>;
  organise: (
    state: SimpleFormState,
    formData: FormData,
  ) => Promise<SimpleFormState>;
};

const KIND_ICON: Record<TranscriptKind, typeof Mic> = {
  video: Video,
  audio: Mic,
  voice: Mic,
  pdf: FileText,
  doc: FileText,
  image: ImageIcon,
  other: FileIcon,
};

const COLLAPSED_WIDTH = 56;
const MIN_WIDTH = 320;
const MAX_WIDTH = 620;

export function TranscriptPanel({
  projectId,
  weekId,
  transcripts,
  media,
  canEdit,
  actions,
}: {
  projectId: string;
  weekId: string;
  transcripts: WeekTranscript[];
  media: Record<string, string>;
  canEdit: boolean;
  actions: TranscriptActions;
}) {
  const [sheet, setSheet] = useState<TranscriptPoint | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(420);
  const [chatOpen, setChatOpen] = useState(false);
  const dragging = useRef(false);
  const openTrigger = useRef<HTMLButtonElement>(null);
  const closeTrigger = useRef<HTMLButtonElement>(null);
  const previousCollapsed = useRef(collapsed);

  useEffect(() => {
    if (previousCollapsed.current === collapsed) return;
    if (collapsed) openTrigger.current?.focus();
    else closeTrigger.current?.focus();
    previousCollapsed.current = collapsed;
  }, [collapsed]);

  const total = transcripts.reduce(
    (count, transcript) => count + transcript.points.length,
    0,
  );

  return (
    <Collapsible
      data-transcript-panel
      open={!collapsed}
      onOpenChange={(next) => setCollapsed(!next)}
      style={
        {
          "--transcript-width": `${collapsed ? COLLAPSED_WIDTH : width}px`,
        } as CSSProperties
      }
      className={cn(
        "relative flex min-w-0 shrink-0 flex-col overflow-hidden border-black/[0.07] bg-[#faf9f4] transition-[width] duration-300 ease-out motion-reduce:transition-none md:w-(--transcript-width) md:pr-14",
        collapsed
          ? "max-md:w-full max-md:border-t md:border-l md:bg-[#f1f1ea]"
          : "border-t max-md:h-80 max-md:w-full! md:border-t-0 md:border-l",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-14 border-l border-black/[0.06] bg-[#f1f1ea] md:block"
      />

      {collapsed ? (
        <CollapsibleTrigger asChild>
          <Button
            ref={openTrigger}
            variant="bare"
            size="none"
            type="button"
            title="Open transcript"
            aria-label="Open transcript"
            className={cn(
              "flex h-full w-full items-center gap-2.5 transition-colors duration-150 hover:bg-[#eef0e9] max-md:justify-center max-md:py-2 md:absolute md:inset-y-0 md:right-0 md:w-14 md:flex-col md:justify-start md:gap-4 md:px-2 md:py-4",
              FOCUS_RING,
            )}
          >
            <span className="bg-gd-panel-dark grid size-9 shrink-0 place-items-center rounded-2xl shadow-[0_8px_20px_rgba(20,23,26,0.18)]">
              <PanelRightOpen className="text-brand size-4" />
            </span>
            <span className="text-[10px] font-semibold tracking-[0.12em] text-black/55 uppercase md:rotate-180 md:[writing-mode:vertical-rl]">
              Open Transcript
            </span>
            {total ? (
              <span className="bg-gd-green text-gd-ink grid min-w-4.5 place-items-center rounded-full px-1.25 py-0.5 font-mono text-[9px] font-bold md:hidden">
                {total}
              </span>
            ) : null}
          </Button>
        </CollapsibleTrigger>
      ) : null}

      <div
        inert={collapsed || undefined}
        className={cn(
          "relative flex min-h-0 flex-1 flex-col transition-opacity duration-150 motion-reduce:transition-none",
          collapsed
            ? "pointer-events-none opacity-0"
            : "opacity-100 delay-100 motion-reduce:delay-0",
        )}
      >
        <span
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize transcript"
          onPointerDown={(event) => {
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!dragging.current) return;
            const panel = event.currentTarget.closest<HTMLElement>(
              "[data-transcript-panel]",
            );
            if (!panel) return;
            const right = panel.getBoundingClientRect().right;
            setWidth(
              Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, right - event.clientX)),
            );
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          className="group absolute inset-y-0 -left-1 z-10 w-2.5 cursor-col-resize touch-none"
        >
          <span className="group-hover:bg-gd-green absolute top-1/2 left-1 h-10 w-0.5 -translate-y-1/2 rounded bg-black/12 transition-all duration-150 group-hover:h-16" />
        </span>

        <div className="flex shrink-0 items-center gap-2 border-b border-black/[0.07] px-3 py-2">
          <CollapsibleTrigger asChild>
            <Button
              ref={closeTrigger}
              variant="admin-icon"
              size="none"
              type="button"
              title="Collapse transcript"
              aria-label="Collapse transcript"
            >
              <PanelRightClose className="size-4" />
            </Button>
          </CollapsibleTrigger>
          <span className="flex items-center gap-2 text-[13px] font-semibold tracking-[-0.02em]">
            Transcript
          </span>
          {canEdit ? (
            <Button
              variant="admin-icon"
              size="none"
              type="button"
              className="ml-auto"
              onClick={() => setChatOpen(true)}
              title="Add a source"
              aria-label="Add a source"
            >
              <Plus className="size-4" />
            </Button>
          ) : null}
        </div>

        <CollapsibleContent
          forceMount
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <ScrollArea className="min-h-0 flex-1" viewportClassName="h-full">
            <div className="flex flex-col gap-5 p-4 pb-20">
              {transcripts.length ? (
                transcripts.map((transcript) => (
                  <SourceCard
                    key={transcript.id}
                    transcript={transcript}
                    mediaUrl={media[transcript.storagePath]}
                    canEdit={canEdit}
                    actions={actions}
                    onOpenPoint={setSheet}
                  />
                ))
              ) : (
                <EmptyState
                  icon={Sparkles}
                  title="No transcript yet"
                  description="Drop a recording, voice note, PDF or photo on the assistant and the points land here."
                />
              )}
            </div>
          </ScrollArea>
        </CollapsibleContent>

        {canEdit && !chatOpen ? (
          <>
            {total ? null : (
              <span
                aria-hidden
                className="bg-gd-primary pointer-events-none absolute right-3 bottom-3 z-20 h-11 w-28 animate-ping rounded-full opacity-20 motion-reduce:hidden"
              />
            )}
            <Button
              variant="bare"
              size="none"
              type="button"
              onClick={() => setChatOpen(true)}
              title="Ask AI"
              className={cn(
                "bg-gd-panel-dark absolute right-3 bottom-3 z-30 inline-flex h-11 items-center gap-2 rounded-full pr-4 pl-1.5 text-[13px] font-semibold text-white shadow-[0_12px_30px_rgba(20,23,26,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(20,23,26,0.34)]",
                FOCUS_RING,
              )}
            >
              <span className="bg-gd-primary grid size-8 shrink-0 place-items-center rounded-full text-[#06251a]">
                <Bot className="size-4.5" />
              </span>
              Ask AI
            </Button>
          </>
        ) : null}

        {chatOpen ? (
          <AiChat
            projectId={projectId}
            weekId={weekId}
            hasPoints={total > 0}
            addSource={actions.addSource}
            ask={actions.ask}
            onClose={() => setChatOpen(false)}
          />
        ) : null}

        {sheet ? (
          <PointSheet
            point={sheet}
            editable={canEdit}
            save={actions.savePoint}
            onClose={() => setSheet(null)}
          />
        ) : null}
      </div>
    </Collapsible>
  );
}

function seedDoc(point: TranscriptPoint): IdeaDoc {
  if (point.doc && point.doc.content.length) return point.doc;

  const at = stamp(point.atSeconds);
  const heading = [point.speaker, at].filter(Boolean).join(" · ");

  return {
    ...EMPTY_DOC,
    content: [
      ...(heading
        ? [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: heading }],
            },
          ]
        : []),
      { type: "paragraph", content: [{ type: "text", text: point.body }] },
    ],
  } as IdeaDoc;
}

export function PointSheet({
  point,
  editable,
  save,
  onClose,
}: {
  point: TranscriptPoint;
  editable: boolean;
  save: TranscriptActions["savePoint"];
  onClose: () => void;
}) {
  const editor = useRef<IdeaEditorHandle>(null);
  const [doc, setDoc] = useState<IdeaDoc>(() => seedDoc(point));
  const [state, submit, saving] = useActionState(save, IDLE_FORM);

  useEffect(() => {
    if (state.status === "success") onClose();
  }, [state.status, onClose]);

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        overlayClassName="z-60 bg-black/45 supports-backdrop-filter:backdrop-blur-[2px]"
        className="z-60 flex h-[min(88dvh,780px)] w-[calc(100%-1.5rem)] max-w-[min(calc(100vw-1.5rem),56rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-white p-0 shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:max-w-[min(calc(100vw-1.5rem),56rem)]"
      >
        <div className="bg-gd-panel-dark flex shrink-0 items-center gap-2 px-3 py-2 text-white">
          <Button
            variant="bare"
            size="none"
            type="button"
            onClick={onClose}
            aria-label="Back"
            className={cn(
              "grid size-7 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white",
              FOCUS_RING,
            )}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <DialogTitle className="text-brand font-mono text-[10px] font-semibold tracking-[0.14em] uppercase">
            Transcript point
          </DialogTitle>
          <DialogDescription className="sr-only">
            {point.body}
          </DialogDescription>
          <span className="ml-auto truncate text-[10px] text-white/60">
            {[point.speaker, stamp(point.atSeconds)]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <IdeaEditor
            ref={editor}
            initialDoc={doc}
            editable={editable}
            contentClassName="mx-auto w-full max-w-2xl"
            placeholder="What this point means for the week."
            onChange={(next) => setDoc(next as IdeaDoc)}
          />
        </div>

        <form
          action={submit}
          className="flex shrink-0 items-center gap-2 border-t border-black/[0.08] bg-[#fbfbf7] px-3 py-2"
        >
          <input type="hidden" name="pointId" value={point.id} />
          <input type="hidden" name="body" value={point.body} />
          <input type="hidden" name="speaker" value={point.speaker ?? ""} />
          <input type="hidden" name="tag" value={point.tag ?? ""} />
          <input type="hidden" name="doc" value={JSON.stringify(doc)} />

          {state.status === "error" && state.message ? (
            <span role="alert" className="text-[11px] text-red-600">
              {state.message}
            </span>
          ) : null}

          <Button
            variant="admin-ghost"
            size="admin-sm"
            type="button"
            onClick={onClose}
            className="ml-auto"
          >
            Cancel
          </Button>
          {editable ? (
            <Button
              variant="admin-cta"
              size="admin-sm"
              type="submit"
              disabled={saving}
              data-button-fill
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              <span className="button-fill-fx__label">Save changes</span>
            </Button>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SourceCard({
  transcript,
  mediaUrl,
  canEdit,
  actions,
  onOpenPoint,
}: {
  transcript: WeekTranscript;
  mediaUrl: string | undefined;
  canEdit: boolean;
  actions: TranscriptActions;
  onOpenPoint: (point: TranscriptPoint) => void;
}) {
  const Icon = KIND_ICON[transcript.kind] ?? FileText;
  const [, drop] = useActionState(actions.removeSource, IDLE_FORM);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <span className="bg-gd-green/12 text-gd-green-deep grid size-8.5 shrink-0 place-items-center rounded-[10px]">
            <Icon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold">
              {transcript.name}
            </span>
            <span className="mt-0.5 block font-mono text-[10px] text-black/45">
              {[
                kindNoun(transcript.kind),
                transcript.durationSeconds === null
                  ? null
                  : duration(transcript.durationSeconds),
                transcript.points.length
                  ? `${transcript.points.length} points`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          {canEdit ? (
            <form action={drop}>
              <input type="hidden" name="transcriptId" value={transcript.id} />
              <Button
                variant="admin-icon-danger"
                size="none"
                type="submit"
                title="Remove source"
                aria-label={`Remove ${transcript.name}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </form>
          ) : null}
        </div>

        <SourcePreview
          kind={transcript.kind}
          name={transcript.name}
          url={mediaUrl}
          seed={transcript.id}
        />

        {transcript.status === "failed" ? (
          <p className="border-t border-black/[0.06] px-3 py-2 text-[11px] text-red-700">
            {transcript.failure ?? "That file could not be read."}
          </p>
        ) : null}
      </div>

      {transcript.points.length ? (
        <div className="flex flex-col gap-2.5">
          <span className="flex items-center justify-between font-mono text-[9px] tracking-[0.14em] text-black/40 uppercase">
            <span>Key points · by AI</span>
            <span>{transcript.points.length}</span>
          </span>
          {transcript.points.map((point) => (
            <PointCard
              key={point.id}
              point={point}
              canEdit={canEdit}
              actions={actions}
              onOpen={() => onOpenPoint(point)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SourcePreview({
  kind,
  name,
  url,
  seed,
}: {
  kind: TranscriptKind;
  name: string;
  url: string | undefined;
  seed: string;
}) {
  if (!url) return null;

  if (kind === "audio" || kind === "voice") {
    return (
      <div className="px-3 pb-2.5">
        <div className="mb-2 flex items-center gap-0.5">
          {waveform(seed).map((height, index) => (
            <span
              key={index}
              style={{ height }}
              className="bg-gd-green/40 block flex-1 rounded-sm"
            />
          ))}
        </div>
        <audio controls preload="none" src={url} className="h-8 w-full" />
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div className="px-3 pb-2.5">
        <video
          controls
          preload="metadata"
          src={url}
          className="max-h-44 w-full rounded-lg bg-black"
        />
      </div>
    );
  }

  if (kind === "image") {
    return (
      <div className="px-3 pb-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name}
          className="max-h-44 w-full rounded-lg border border-black/[0.07] object-cover"
        />
      </div>
    );
  }

  return (
    <div className="px-3 pb-2.5">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-black/[0.09] bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-black/70 transition hover:border-black/25 hover:text-black",
          FOCUS_RING,
        )}
      >
        <ExternalLink className="size-3.5" />
        Open {kind === "pdf" ? "PDF" : "file"}
      </a>
    </div>
  );
}

function PointCard({
  point,
  canEdit,
  actions,
  onOpen,
}: {
  point: TranscriptPoint;
  canEdit: boolean;
  actions: TranscriptActions;
  onOpen: () => void;
}) {
  const at = stamp(point.atSeconds);
  const [, send] = useActionState(actions.sendToWork, IDLE_FORM);
  const [, drop] = useActionState(actions.removePoint, IDLE_FORM);

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-3 py-3 transition duration-150 hover:border-black/18 hover:shadow-[0_4px_12px_rgba(20,23,26,0.05)]">
      <div className="flex flex-wrap items-center gap-2.5">
        {at ? (
          <span className="bg-gd-green/12 text-gd-green-deep shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[9.5px]">
            {at}
          </span>
        ) : null}
        {point.speaker ? (
          <span className="truncate text-[11px] font-semibold text-black/60">
            {point.speaker}
          </span>
        ) : null}
        {point.tag ? (
          <span
            className={cn(
              "shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[8.5px] tracking-[0.08em] uppercase",
              TONE_SOFT.muted,
            )}
          >
            {point.tag}
          </span>
        ) : null}

        <span className="ml-auto flex shrink-0 items-center gap-0.5">
          <Button
            variant="admin-icon"
            size="none"
            type="button"
            onClick={onOpen}
            title="Open details"
            aria-label={`Open ${point.body.slice(0, 40)}`}
          >
            <Maximize2 className="size-3.5" />
          </Button>

          {canEdit && point.cardId ? (
            <span
              title="Already on the Work Board"
              className="text-gd-green-deep grid size-7 place-items-center"
            >
              <Check className="size-3.5" />
            </span>
          ) : null}

          {canEdit && !point.cardId ? (
            <form action={send}>
              <input type="hidden" name="pointId" value={point.id} />
              <Button
                variant="admin-icon"
                size="none"
                type="submit"
                title="Send to Work Board"
                aria-label="Send to Work Board"
              >
                <ArrowRight className="size-3.5" />
              </Button>
            </form>
          ) : null}

          {canEdit ? (
            <form action={drop}>
              <input type="hidden" name="pointId" value={point.id} />
              <Button
                variant="admin-icon-danger"
                size="none"
                type="submit"
                title="Remove point"
                aria-label="Remove point"
              >
                <X className="size-3.5" />
              </Button>
            </form>
          ) : null}
        </span>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-5 text-black/80">
        {point.body}
      </p>
    </div>
  );
}

function waveform(seed: string) {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index)) % 100000;
  }
  const bars: string[] = [];
  for (let index = 0; index < 36; index += 1) {
    value = (value * 1103515245 + 12345) % 2147483648;
    bars.push(`${5 + (value % 17)}px`);
  }
  return bars;
}

type ChatLine =
  | { who: "me"; text: string }
  | { who: "ai"; text: string }
  | { who: "file"; name: string };

function AiChat({
  projectId,
  weekId,
  hasPoints,
  addSource,
  ask,
  onClose,
}: {
  projectId: string;
  weekId: string;
  hasPoints: boolean;
  addSource: TranscriptActions["addSource"];
  ask: AskAction;
  onClose: () => void;
}) {
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [question, setQuestion] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [busy, setBusy] = useState<"ask" | "upload" | null>(null);
  const [, startTask] = useTransition();
  const asking = busy === "ask";
  const uploading = busy === "upload";

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines, busy]);

  const chips = hasPoints
    ? ["What did the client ask for?", "Summarise this in three lines"]
    : ["What can you do?"];

  function say(text: string) {
    setLines((current) => [...current, { who: "ai", text }]);
  }

  function askNow(value: string) {
    const clean = value.trim();
    if (!clean || busy) return;
    setLines((current) => [...current, { who: "me", text: clean }]);
    setBusy("ask");

    const data = new FormData();
    data.set("weekId", weekId);
    data.set("question", clean);

    startTask(async () => {
      const result = await ask(IDLE_FORM, data);
      say(result.answer ?? result.message ?? "Nothing came back.");
      setBusy(null);
    });
  }

  function ingest(file: File) {
    setLines((current) => [...current, { who: "file", name: file.name }]);
    setBusy("upload");

    const data = new FormData();
    data.set("projectId", projectId);
    data.set("weekId", weekId);
    data.set("file", file);

    startTask(async () => {
      const result = await addSource(IDLE_FORM, data);
      say(result.message ?? "Done.");
      setBusy(null);
    });
  }

  return (
    <div className="absolute inset-x-2 bottom-2 z-30 flex h-[min(38rem,calc(100%-1rem))] flex-col overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(20,23,26,0.28)]">
      <div className="bg-gd-panel-dark flex shrink-0 items-center gap-2.5 px-3 py-2.5 text-white">
        <span className="from-gd-mint-bright to-gd-green grid size-7 place-items-center rounded-full bg-gradient-to-br text-[#06251a]">
          <Sparkles className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] leading-tight font-semibold">
            AI assistant
          </span>
          <span className="block text-[10px] text-white/50">
            Reads whatever you give it
          </span>
        </span>
        <Button
          variant="bare"
          size="none"
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className={cn(
            "ml-auto grid size-7 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white",
            FOCUS_RING,
          )}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div
        ref={bodyRef}
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-[#faf9f4] p-3"
      >
        {lines.length ? (
          lines.map((line, index) =>
            line.who === "file" ? (
              <span
                key={index}
                className="flex max-w-[86%] items-center gap-2 self-end rounded-[14px] rounded-br-[5px] border border-black/10 bg-white px-3 py-2 text-[12.5px]"
              >
                <Paperclip className="text-gd-green-deep size-3.5 shrink-0" />
                <span className="truncate">{line.name}</span>
              </span>
            ) : (
              <span
                key={index}
                className={cn(
                  "max-w-[86%] rounded-[14px] px-3 py-2 text-[12.5px] leading-relaxed",
                  line.who === "ai"
                    ? "self-start rounded-bl-[5px] border border-black/[0.08] bg-white text-black/80"
                    : "bg-gd-panel-dark self-end rounded-br-[5px] text-white",
                )}
              >
                {line.text}
              </span>
            ),
          )
        ) : (
          <p className="px-1 py-2 text-[12px] leading-relaxed text-black/45">
            Attach a recording, voice note, PDF, photo or document and the
            points are written into the transcript.
          </p>
        )}

        {uploading || asking ? (
          <span className="flex items-center gap-1.5 self-start rounded-[14px] rounded-bl-[5px] border border-black/[0.08] bg-white px-3 py-2 text-[12px] text-black/55">
            <Loader2 className="size-3 animate-spin" />
            {uploading ? "Listening…" : "Reading the transcript…"}
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap gap-1.5 bg-[#faf9f4] px-3 pb-2">
        {chips.map((chip) => (
          <Button
            key={chip}
            variant="bare"
            size="none"
            type="button"
            disabled={asking || uploading}
            onClick={() => askNow(chip)}
            className={cn(
              "hover:border-gd-green hover:text-gd-green-deep rounded-full border border-black/12 bg-white px-2.5 py-1 text-[11px] text-black/65 transition",
              FOCUS_RING,
            )}
          >
            {chip}
          </Button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 border-t border-black/[0.08] bg-white p-2">
        <Button
          variant="admin-icon"
          size="none"
          type="button"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
          title="Attach a file"
          aria-label="Attach a file"
        >
          <Paperclip className="size-4" />
        </Button>
        <input
          ref={fileInput}
          type="file"

          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) ingest(file);
          }}
        />
        <Input
          variant="bare"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            askNow(question);
            setQuestion("");
          }}
          disabled={asking || uploading}
          placeholder="Ask a question, or attach a file…"
          className="h-8 flex-1 text-[13px]"
        />
        <Button
          variant="admin-icon"
          size="none"
          type="button"
          disabled={asking || uploading || !question.trim()}
          onClick={() => {
            askNow(question);
            setQuestion("");
          }}
          title="Send"
          aria-label="Send"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
