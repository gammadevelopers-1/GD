"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  Loader2,
  Lock,
  Maximize2,
  Minimize2,
  PenLine,
} from "lucide-react";
import {
  IdeaEditor,
  type IdeaEditorHandle,
} from "@/components/admin/projects/idea-editor";
import type { AskIdeaAi } from "@/components/admin/projects/idea-ai-panel";
import { useBoardDoc } from "@/components/admin/projects/use-board-doc";
import type { IdeaDoc } from "@/lib/projects/idea-doc";
import type { SimpleFormState } from "@/lib/projects/form-state";
import { formatDate } from "@/lib/projects/format";
import {
  type UploadResult,
  useAttachment,
} from "@/components/admin/projects/use-attachment";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type { UploadResult };

export function WeekIdeaBoard({
  projectId,
  weekId,
  weekNumber,
  initialDoc,
  canEdit,
  openTasks,
  updatedAt,
  updatedBy,
  expanded,
  workOpen,
  onExpandedChange,
  onOpenWork,
  save,
  upload,
  askAi,
  onDocChange,
  workBoard,
  transcript,
  editorRef,
}: {
  projectId: string;
  weekId: string;
  weekNumber: number;
  initialDoc: IdeaDoc;
  canEdit: boolean;
  openTasks: number;
  updatedAt: string | null;
  updatedBy: string | null;
  expanded: boolean;
  workOpen: boolean;
  onExpandedChange: (value: boolean) => void;
  onOpenWork: () => void;
  save: (weekId: string, doc: string) => Promise<SimpleFormState>;
  upload: (state: UploadResult, formData: FormData) => Promise<UploadResult>;
  askAi?: AskIdeaAi;
  onDocChange?: (doc: IdeaDoc) => void;
  workBoard?: ReactNode;
  transcript?: ReactNode;
  editorRef?: RefObject<IdeaEditorHandle | null>;
}) {
  const own = useRef<IdeaEditorHandle>(null);
  const editor = editorRef ?? own;
  const attach = useAttachment({
    projectId,
    upload,
    editorRef: editor,
    canEdit,
  });
  const board = useBoardDoc(weekId, initialDoc, save);
  const { flush, unsaved } = board;

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!unsaved) return;
      event.preventDefault();
      event.returnValue = "";
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("beforeunload", onLeave);
      flush();
    };
  }, [flush, unsaved]);

  useEffect(() => {
    if (!expanded || workOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExpandedChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, workOpen, onExpandedChange]);

  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [expanded]);

  return (
    <div
      role={expanded ? "dialog" : undefined}
      aria-label={expanded ? `Week ${weekNumber} idea board` : undefined}
      aria-modal={expanded || undefined}
      className={cn(
        "relative isolate flex flex-col overflow-hidden border border-black/[0.07] bg-white",
        expanded
          ? "fixed inset-0 z-50 rounded-none"
          : "h-[clamp(32rem,68dvh,44rem)] rounded-xl",
      )}
    >
      <div
        inert={workOpen || undefined}
        className="flex shrink-0 items-center gap-2 border-b border-black/[0.07] bg-[#f1f1ea] px-3 py-1.5"
      >
        <span className="font-mono text-[10px] tracking-[0.14em] text-black/55 uppercase">
          Idea Board
        </span>

        <SaveState
          state={board}
          canEdit={canEdit}
          updatedAt={updatedAt}
          updatedBy={updatedBy}
        />

        {attach.error ? (
          <span role="alert" className="truncate text-[10px] text-red-600">
            {attach.error}
          </span>
        ) : null}

        {attach.input}

        <Button
          variant="bare"
          size="none"
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          title={expanded ? "Close full screen" : "Open full screen"}
          aria-label={expanded ? "Close full screen" : "Open full screen"}
          className="ml-auto grid size-7 place-items-center rounded-lg text-black/60 transition hover:bg-black/6 hover:text-black"
        >
          {expanded ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
        </Button>
      </div>

      <div
        inert={workOpen || undefined}
        className="flex min-h-0 flex-1 flex-col md:flex-row"
      >
        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col"
          onDrop={attach.onDrop}
          onDragOver={attach.onDragOver}
        >
          <IdeaEditor
            ref={editor}
            initialDoc={initialDoc}
            editable={canEdit}
            placeholder="Notes, links, half-formed plans — anything for this week."
            onChange={(next) => {
              onDocChange?.(next as IdeaDoc);
              board.onChange(next);
            }}
            onAttach={attach.open}
            attaching={attach.uploading}
            ai={askAi ? { projectId, ask: askAi } : undefined}
          />
        </div>
        {transcript}
      </div>

      <Button
        variant="bare"
        size="none"
        type="button"
        inert={workOpen || undefined}
        onClick={onOpenWork}
        aria-expanded={workOpen}
        aria-haspopup="dialog"
        aria-controls={`week-work-board-${weekId}`}
        title="Open the Work Board"
        className="group bg-gd-panel-dark focus-visible:ring-brand/60 absolute top-1/2 right-0 z-10 flex w-12 -translate-y-1/2 flex-col items-center gap-2 rounded-l-xl py-4 text-white shadow-[0_10px_30px_rgba(20,23,26,0.2)] transition-[box-shadow,background-color] duration-200 hover:shadow-[0_14px_36px_rgba(20,23,26,0.24)] focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none"
      >
        <ChevronLeft className="text-brand size-3.5 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transition-none" />
        <span className="text-[11px] font-semibold tracking-[0.04em] [writing-mode:vertical-rl]">
          Work Board
        </span>
        {openTasks ? (
          <span className="bg-brand/20 text-brand rounded-full px-1 py-0.5 font-mono text-[9px]">
            {openTasks}
          </span>
        ) : null}
      </Button>

      {workBoard}
    </div>
  );
}

function SaveState({
  state,
  canEdit,
  updatedAt,
  updatedBy,
}: {
  state: ReturnType<typeof useBoardDoc>;
  canEdit: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}) {
  if (!canEdit) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-black/55">
        <Lock className="size-2.5" />
        View only
      </span>
    );
  }
  if (state.status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] text-red-600">
        <AlertTriangle className="size-3" />
        {state.message ?? "Not saved."}
        <Button
          variant="bare"
          size="none"
          type="button"
          onClick={state.flush}
          className="font-semibold underline underline-offset-2"
        >
          Retry
        </Button>
      </span>
    );
  }
  if (state.status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-black/55">
        <Loader2 className="size-2.5 animate-spin" />
        Saving
      </span>
    );
  }
  if (state.status === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-black/55">
        <Check className="text-gd-green-edge size-2.5" />
        Saved
      </span>
    );
  }
  return <LastEdit updatedAt={updatedAt} updatedBy={updatedBy} />;
}

export function LastEdit({
  updatedAt,
  updatedBy,
}: {
  updatedAt: string | null;
  updatedBy: string | null;
}) {
  if (!updatedAt) return null;

  return (
    <span
      title={new Date(updatedAt).toLocaleString()}
      className="inline-flex min-w-0 items-center gap-1 text-[10px] text-black/55"
    >
      <PenLine className="size-2.5 shrink-0" />
      <span className="truncate">
        {updatedBy ? `${updatedBy} · ` : ""}
        {formatDate(updatedAt.slice(0, 10))}
      </span>
    </span>
  );
}
