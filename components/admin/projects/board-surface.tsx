"use client";

import type { ReactNode, RefObject } from "react";
import { AlertTriangle, Check, Loader2, Lock } from "lucide-react";
import {
  IdeaEditor,
  type IdeaEditorHandle,
} from "@/components/admin/projects/idea-editor";
import type { IdeaDoc } from "@/lib/projects/idea-doc";
import type { AutosaveStatus } from "@/components/admin/projects/use-autosave";
import { formatDate } from "@/lib/projects/format";
import {
  type UploadAction,
  type UploadResult,
  useAttachment,
} from "@/components/admin/projects/use-attachment";

export type { UploadAction, UploadResult };

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
  const attach = useAttachment({
    projectId,
    upload,
    editorRef,
    canEdit,
  });

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
          {attach.error ? (
            <span role="alert" className="text-[11px] text-red-600">
              {attach.error}
            </span>
          ) : null}
          {attach.input}
          {actions}
        </div>
      </header>

      <div
        className="flex min-h-0 flex-1 flex-col"
        onDrop={attach.onDrop}
        onDragOver={attach.onDragOver}
      >
        <IdeaEditor
          ref={editorRef}
          initialDoc={initialDoc}
          editable={canEdit}
          placeholder={placeholder}
          onChange={onChange}
          onAttach={attach.open}
          attaching={attach.uploading}
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
