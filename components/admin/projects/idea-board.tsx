"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  Paperclip,
  Sparkles,
} from "lucide-react";
import {
  IdeaEditor,
  type IdeaEditorHandle,
} from "@/components/admin/projects/idea-editor";
import { useAutosave } from "@/components/admin/projects/use-autosave";
import type { SimpleFormState } from "@/lib/projects/form-state";
import type { IdeaDoc } from "@/lib/projects/idea-doc";
import type { SuggestionGroup } from "@/lib/projects/suggestions";
import { CARD_STATUS_CHIP, CARD_STATUS_LABEL } from "@/lib/projects/board";
import { formatDate } from "@/lib/projects/format";
import {
  IDEA_ATTACHMENT_MAX_BYTES,
  IDEA_ATTACHMENT_TYPES,
} from "@/lib/projects/idea-media";
import { cn } from "@/lib/utils";

type UploadResult = SimpleFormState & {
  path?: string;
  name?: string;
  mime?: string;
  size?: number;
};

export function IdeaBoard({
  projectId,
  initialDoc,
  canEdit,
  updatedAt,
  updatedBy,
  suggestions,
  save,
  upload,
}: {
  projectId: string;
  initialDoc: IdeaDoc;
  canEdit: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
  suggestions: SuggestionGroup[];
  save: (projectId: string, doc: string) => Promise<SimpleFormState>;
  upload: (state: UploadResult, formData: FormData) => Promise<UploadResult>;
}) {
  const editorRef = useRef<IdeaEditorHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const latest = useRef<unknown>(initialDoc);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const savedSnapshot = useRef(JSON.stringify(initialDoc));
  const perform = useCallback(async () => {
    const snapshot = JSON.stringify(latest.current);
    if (snapshot === savedSnapshot.current) {
      return { status: "success" as const, message: null };
    }
    const result = await save(projectId, snapshot);
    if (result.status !== "error") savedSnapshot.current = snapshot;
    return result;
  }, [projectId, save]);
  const { status, message, schedule, flush } = useAutosave(perform, 1200);

  const unsaved = status === "dirty" || status === "saving";
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
    };
  }, [flush, unsaved]);

  const onChange = useCallback(
    (doc: unknown) => {
      latest.current = doc;
      if (JSON.stringify(doc) === savedSnapshot.current) return;
      schedule();
    },
    [schedule],
  );

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
    editorRef.current?.insertAttachment({
      path: result.path,
      name: result.name ?? file.name,
      mime: result.mime ?? file.type,
      size: result.size ?? file.size,
    });
  }

  return (
    <div className="flex min-h-[calc(100dvh-15rem)] flex-col gap-4 xl:flex-row">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
        <header className="flex items-center gap-3 border-b border-black/[0.07] px-4 py-2.5">
          <SaveState
            status={status}
            message={message}
            canEdit={canEdit}
            updatedAt={updatedAt}
            updatedBy={updatedBy}
            onRetry={flush}
          />
          <div className="ml-auto flex items-center gap-2">
            {uploadError ? (
              <span role="alert" className="text-[11px] text-red-600">
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
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/[0.09] bg-white px-2.5 text-xs font-medium text-black/65 transition hover:border-black/25 hover:text-black disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Paperclip className="size-3.5" />
                  )}
                  Attach
                </button>
              </>
            ) : null}
          </div>
        </header>

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
            ref={editorRef}
            initialDoc={initialDoc}
            editable={canEdit}
            onChange={onChange}
          />
        </div>
      </section>

      <Suggestions groups={suggestions} />
    </div>
  );
}

function SaveState({
  status,
  message,
  canEdit,
  updatedAt,
  updatedBy,
  onRetry,
}: {
  status: string;
  message: string | null;
  canEdit: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
  onRetry: () => void;
}) {
  if (!canEdit) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-black/40">
        <Lock className="size-3" />
        View only
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-2 text-[11px] text-red-600">
        <AlertTriangle className="size-3.5" />
        {message ?? "Not saved."}
        <button
          type="button"
          onClick={onRetry}
          className="rounded font-semibold underline underline-offset-2"
        >
          Retry
        </button>
      </span>
    );
  }

  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-black/45">
        <Loader2 className="size-3 animate-spin" />
        Saving…
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-black/45">
        <Check className="size-3 text-[#0f7a37]" />
        Saved
      </span>
    );
  }

  if (status === "dirty") {
    return <span className="text-[11px] text-black/35">Unsaved changes</span>;
  }

  return (
    <span className="text-[11px] text-black/35">
      {updatedAt
        ? `Last edited ${formatDate(updatedAt.slice(0, 10))}${updatedBy ? ` by ${updatedBy}` : ""}`
        : "Nothing written yet"}
    </span>
  );
}

function Suggestions({ groups }: { groups: SuggestionGroup[] }) {
  const [open, setOpen] = useState(true);

  if (!groups.length) return null;

  const [latest, ...older] = groups;

  return (
    <aside className="w-full shrink-0 xl:w-72">
      <div className="rounded-2xl border border-black/[0.07] bg-[#f8f8f3] p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-[#08743d]" />
          <h2 className="text-[12px] font-semibold tracking-[-0.01em]">
            Unfinished from week {latest.weekNumber}
          </h2>
        </div>

        <ul className="mt-3 space-y-2">
          {latest.items.map((item) => (
            <SuggestionRow key={item.cardId} item={item} />
          ))}
        </ul>

        {older.length ? (
          <>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-black/45 transition hover:text-black"
            >
              <ChevronDown
                className={cn("size-3 transition", open && "rotate-180")}
              />
              Earlier weeks
            </button>
            {open
              ? older.map((group) => (
                  <div key={group.weekNumber} className="mt-3">
                    <p className="font-mono text-[9px] tracking-[0.14em] text-black/30 uppercase">
                      Week {group.weekNumber}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {group.items.map((item) => (
                        <SuggestionRow key={item.cardId} item={item} />
                      ))}
                    </ul>
                  </div>
                ))
              : null}
          </>
        ) : null}
      </div>
    </aside>
  );
}

function SuggestionRow({ item }: { item: SuggestionGroup["items"][number] }) {
  const [open, setOpen] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="w-full rounded-xl border border-black/[0.06] bg-white px-3 py-2.5 text-left transition hover:border-black/[0.14]"
      >
        <span className="block text-[12px] font-medium text-black/75">
          {item.title}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
              CARD_STATUS_CHIP[item.status],
            )}
          >
            {CARD_STATUS_LABEL[item.status]}
          </span>
          <span className="text-[10px] text-black/35">
            Week {item.weekNumber} · due {formatDate(item.weekDueOn)}
          </span>
        </span>
        {open ? (
          <span className="mt-2 block border-t border-black/[0.06] pt-2 text-[11px] leading-4 text-black/50">
            {item.reason ? <span className="block">{item.reason}</span> : null}
            <span className="block text-black/35">
              Added by {item.createdBy ?? "someone on the team"}
            </span>
          </span>
        ) : null}
      </button>
    </li>
  );
}
