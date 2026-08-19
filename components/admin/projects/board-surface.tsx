"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";
import { AlertTriangle, Check, Loader2, Lock, Paperclip } from "lucide-react";
import {
  IdeaEditor,
  type IdeaEditorHandle,
} from "@/components/admin/projects/idea-editor";
import type { IdeaDoc } from "@/lib/projects/idea-doc";
import type { AutosaveStatus } from "@/components/admin/projects/use-autosave";
import { formatDate } from "@/lib/projects/format";
import {
  IDEA_ATTACHMENT_MAX_BYTES,
  IDEA_ATTACHMENT_TYPES,
} from "@/lib/projects/idea-media";
import type { SimpleFormState } from "@/lib/projects/form-state";

export type UploadResult = SimpleFormState & {
  path?: string;
  name?: string;
  mime?: string;
  size?: number;
};

export type UploadAction = (
  state: UploadResult,
  formData: FormData,
) => Promise<UploadResult>;

export function BoardSurface({
  projectId,
  initialDoc,
  canEdit,
  placeholder,
  status,
  message,
  updatedAt,
  updatedBy,
  onChange,
  onRetry,
  upload,
  lead,
  actions,
  editorRef,
}: {
  projectId: string;
  initialDoc: IdeaDoc;
  canEdit: boolean;
  placeholder: string;
  status: AutosaveStatus;
  message: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  onChange: (doc: unknown) => void;
  onRetry: () => void;
  upload: UploadAction;
  lead: ReactNode;
  actions?: ReactNode;
  editorRef: RefObject<IdeaEditorHandle | null>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="flex shrink-0 items-center gap-3 border-b border-black/[0.07] px-3 py-2 sm:px-4">
        {lead}

        <SaveState
          status={status}
          message={message}
          canEdit={canEdit}
          updatedAt={updatedAt}
          updatedBy={updatedBy}
          onRetry={onRetry}
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
                <span className="hidden sm:inline">Attach</span>
              </button>
            </>
          ) : null}
          {actions}
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
          placeholder={placeholder}
          onChange={onChange}
        />
      </div>
    </section>
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
  status: AutosaveStatus;
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
    <span className="truncate text-[11px] text-black/35">
      {updatedAt
        ? `Last edited ${formatDate(updatedAt.slice(0, 10))}${updatedBy ? ` by ${updatedBy}` : ""}`
        : "Nothing written yet"}
    </span>
  );
}
