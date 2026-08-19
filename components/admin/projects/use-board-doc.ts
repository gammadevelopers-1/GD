"use client";

import { useCallback, useRef } from "react";
import { useAutosave } from "@/components/admin/projects/use-autosave";
import type { SimpleFormState } from "@/lib/projects/form-state";
import type { IdeaDoc } from "@/lib/projects/idea-doc";

export function useBoardDoc(
  projectId: string,
  initialDoc: IdeaDoc,
  save: (projectId: string, doc: string) => Promise<SimpleFormState>,
) {
  const latest = useRef<unknown>(initialDoc);
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

  const onChange = useCallback(
    (doc: unknown) => {
      latest.current = doc;
      if (JSON.stringify(doc) === savedSnapshot.current) return;
      schedule();
    },
    [schedule],
  );

  const markSaved = useCallback((doc: IdeaDoc) => {
    latest.current = doc;
    savedSnapshot.current = JSON.stringify(doc);
  }, []);

  const unsaved = status === "dirty" || status === "saving";

  return { status, message, onChange, flush, markSaved, unsaved };
}
