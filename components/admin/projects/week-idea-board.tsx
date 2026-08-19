"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  Loader2,
  Lock,
  Maximize2,
  Minimize2,
  Paperclip,
  PenLine,
} from "lucide-react";
import {
  IdeaEditor,
  type IdeaEditorHandle,
} from "@/components/admin/projects/idea-editor";
import { useBoardDoc } from "@/components/admin/projects/use-board-doc";
import type { IdeaDoc } from "@/lib/projects/idea-doc";
import type { SimpleFormState } from "@/lib/projects/form-state";
import { formatDate } from "@/lib/projects/format";
import {
  IDEA_ATTACHMENT_MAX_BYTES,
  IDEA_ATTACHMENT_TYPES,
} from "@/lib/projects/idea-media";
import { cn } from "@/lib/utils";

export type UploadResult = SimpleFormState & {
  path?: string;
  name?: string;
  mime?: string;
  size?: number;
};

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
  onExpandedChange,
  onOpenWork,
  save,
  upload,
  onDocChange,
  workBoard,
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
  onExpandedChange: (value: boolean) => void;
  onOpenWork: () => void;
  save: (weekId: string, doc: string) => Promise<SimpleFormState>;
  upload: (state: UploadResult, formData: FormData) => Promise<UploadResult>;
  onDocChange?: (doc: IdeaDoc) => void;
  workBoard?: ReactNode;
  editorRef?: RefObject<IdeaEditorHandle | null>;
}) {
  const own = useRef<IdeaEditorHandle>(null);
  const editor = editorRef ?? own;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const board = useBoardDoc(weekId, initialDoc, save);
  const { flush, unsaved } = board;

  async function addFile(file: File) {
    setUploadError(null);
    if (file.size > IDEA_ATTACHMENT_MAX_BYTES) {
      setUploadError("Files are limited to 10 MB.");
      return;
    }
    if (!IDEA_ATTACHMENT_TYPES.has(file.type)) {
      setUploadError("That file type cannot be added.");
      return;
    }

    setUploading(true);
    const data = new FormData();
    data.set("projectId", projectId);
    data.set("file", file);
    const result = await upload({ status: "idle", message: null }, data);
    setUploading(false);

    if (result.status === "error" || !result.path) {
      setUploadError(result.message ?? "The file could not be added.");
      return;
    }

    editor.current?.insertAttachment({
      path: result.path,
      name: result.name ?? file.name,
      mime: result.mime ?? file.type,
      size: result.size ?? file.size,
    });
  }

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
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExpandedChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, onExpandedChange]);

  return (
    <div
      role={expanded ? "dialog" : undefined}
      aria-label={expanded ? `Week ${weekNumber} idea board` : undefined}
      aria-modal={expanded || undefined}
      className={cn(
        "relative flex flex-col overflow-hidden border border-black/[0.07] bg-white",
        expanded ? "fixed inset-0 z-50 rounded-none" : "h-90 rounded-xl",
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-black/[0.07] bg-[#f1f1ea] px-3 py-1.5">
        <span className="font-mono text-[10px] tracking-[0.14em] text-black/35 uppercase">
          Idea Board
        </span>

        <SaveState
          state={board}
          canEdit={canEdit}
          updatedAt={updatedAt}
          updatedBy={updatedBy}
        />

        {uploadError ? (
          <span role="alert" className="truncate text-[10px] text-red-600">
            {uploadError}
          </span>
        ) : null}

        {canEdit ? (
          <>
            <input
              ref={fileRef}
              type="file"
              className="sr-only"
              accept={[...IDEA_ATTACHMENT_TYPES].join(",")}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void addFile(file);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              title="Add an image, video, PDF or document"
              aria-label="Attach a file"
              className="ml-auto grid size-7 place-items-center rounded-lg text-black/45 transition hover:bg-black/[0.06] hover:text-black disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Paperclip className="size-3.5" />
              )}
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          title={expanded ? "Close full screen" : "Open full screen"}
          aria-label={expanded ? "Close full screen" : "Open full screen"}
          className={cn(
            "grid size-7 place-items-center rounded-lg text-black/45 transition hover:bg-black/[0.06] hover:text-black",
            canEdit ? null : "ml-auto",
          )}
        >
          {expanded ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
        </button>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col"
        onDrop={(event) => {
          if (!canEdit) return;
          const file = event.dataTransfer.files?.[0];
          if (!file) return;
          event.preventDefault();
          void addFile(file);
        }}
        onDragOver={(event) => {
          if (canEdit && event.dataTransfer.types.includes("Files")) {
            event.preventDefault();
          }
        }}
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
        />
      </div>

      {expanded ? null : (
        <button
          type="button"
          onClick={onOpenWork}
          title="Open the Work Board"
          className="group absolute top-1/2 right-0 z-10 flex -translate-y-1/2 items-center gap-2 rounded-l-xl bg-[#15181b] py-4 pr-2 pl-2 text-white shadow-[0_10px_30px_rgba(20,23,26,0.2)] transition hover:pr-3 focus-visible:ring-2 focus-visible:ring-[#2fe85c]/60 focus-visible:outline-none"
        >
          <ChevronLeft className="size-3.5 shrink-0 text-[#2fe85c] transition group-hover:-translate-x-0.5" />
          <span className="text-[11px] font-semibold tracking-[0.04em] [writing-mode:vertical-rl]">
            Work Board
          </span>
          {openTasks ? (
            <span className="rounded-full bg-[#2fe85c]/20 px-1 py-0.5 font-mono text-[9px] text-[#2fe85c]">
              {openTasks}
            </span>
          ) : null}
        </button>
      )}

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
      <span className="inline-flex items-center gap-1 text-[10px] text-black/40">
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
        <button
          type="button"
          onClick={state.flush}
          className="font-semibold underline underline-offset-2"
        >
          Retry
        </button>
      </span>
    );
  }
  if (state.status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-black/40">
        <Loader2 className="size-2.5 animate-spin" />
        Saving
      </span>
    );
  }
  if (state.status === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-black/40">
        <Check className="size-2.5 text-[#0f7a37]" />
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
      className="inline-flex min-w-0 items-center gap-1 text-[10px] text-black/40"
    >
      <PenLine className="size-2.5 shrink-0" />
      <span className="truncate">
        {updatedBy ? `${updatedBy} · ` : ""}
        {formatDate(updatedAt.slice(0, 10))}
      </span>
    </span>
  );
}
