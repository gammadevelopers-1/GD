"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import type { IdeaEditorHandle } from "@/components/admin/projects/idea-editor";
import type { SimpleFormState } from "@/lib/projects/form-state";
import {
  IDEA_ATTACHMENT_MAX_BYTES,
  IDEA_ATTACHMENT_TYPES,
} from "@/lib/projects/idea-media";

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

const ACCEPT = [...IDEA_ATTACHMENT_TYPES].join(",");

export function useAttachment({
  projectId,
  upload,
  editorRef,
  canEdit,
}: {
  projectId: string;
  upload: UploadAction;
  editorRef: RefObject<IdeaEditorHandle | null>;
  canEdit: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > IDEA_ATTACHMENT_MAX_BYTES) {
        setError("Files are limited to 10 MB.");
        return;
      }
      if (!IDEA_ATTACHMENT_TYPES.has(file.type)) {
        setError("That file type cannot be added.");
        return;
      }

      setUploading(true);
      const data = new FormData();
      data.set("projectId", projectId);
      data.set("file", file);
      const result = await upload({ status: "idle", message: null }, data);
      setUploading(false);

      if (result.status === "error" || !result.path) {
        setError(result.message ?? "The file could not be added.");
        return;
      }

      editorRef.current?.insertAttachment({
        path: result.path,
        name: result.name ?? file.name,
        mime: result.mime ?? file.type,
        size: result.size ?? file.size,
      });
    },
    [projectId, upload, editorRef],
  );

  const onPick = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) void addFile(file);
    },
    [addFile],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (!canEdit) return;
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      event.preventDefault();
      void addFile(file);
    },
    [canEdit, addFile],
  );

  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      if (canEdit && event.dataTransfer.types.includes("Files")) {
        event.preventDefault();
      }
    },
    [canEdit],
  );

  const open = useCallback(() => inputRef.current?.click(), []);

  // The input comes back already rendered, so the ref never leaves the hook.
  const input = canEdit ? (
    <input
      ref={inputRef}
      type="file"
      className="sr-only"
      accept={ACCEPT}
      onChange={onPick}
    />
  ) : null;

  return {
    input,
    uploading,
    error,
    onDrop,
    onDragOver,
    open: canEdit ? open : undefined,
  };
}
