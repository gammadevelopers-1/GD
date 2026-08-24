"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  BoardSurface,
  type UploadAction,
} from "@/components/admin/projects/board-surface";
import { Modal } from "@/components/admin/projects/modal";
import { SuggestionsPanel } from "@/components/admin/projects/suggestions-panel";
import { useBoardDoc } from "@/components/admin/projects/use-board-doc";
import type { IdeaEditorHandle } from "@/components/admin/projects/idea-editor";
import type { SimpleFormState } from "@/lib/projects/form-state";
import type { IdeaDoc } from "@/lib/projects/idea-doc";
import type { SuggestionGroup } from "@/lib/projects/suggestions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Mode = "idea" | "work";
type OrganiseMode = "replace" | "append";
type OrganiseState = SimpleFormState & { doc?: IdeaDoc };

type SaveAction = (projectId: string, doc: string) => Promise<SimpleFormState>;

export function ProjectWorkspace({
  projectId,
  initialMode,
  idea,
  work,
  canEdit,
  aiReady,
  suggestions,
  saveIdea,
  saveWork,
  organise,
  upload,
}: {
  projectId: string;
  initialMode: Mode;
  idea: { doc: IdeaDoc; updatedAt: string | null; updatedBy: string | null };
  work: { doc: IdeaDoc; updatedAt: string | null; updatedBy: string | null };
  canEdit: boolean;
  aiReady: boolean;
  suggestions: SuggestionGroup[];
  saveIdea: SaveAction;
  saveWork: SaveAction;
  organise: (projectId: string, mode: OrganiseMode) => Promise<OrganiseState>;
  upload: UploadAction;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [workFilled, setWorkFilled] = useState(work.doc.content.length > 0);

  const ideaHandle = useRef<IdeaEditorHandle>(null);
  const workHandle = useRef<IdeaEditorHandle>(null);

  const ideaDoc = useBoardDoc(projectId, idea.doc, saveIdea);
  const workDoc = useBoardDoc(projectId, work.doc, saveWork);
  const workOnChange = workDoc.onChange;

  const onWorkChange = useCallback(
    (doc: unknown) => {
      const content = (doc as IdeaDoc | undefined)?.content;
      setWorkFilled(Array.isArray(content) && content.length > 0);
      workOnChange(doc);
    },
    [workOnChange],
  );

  const unsaved = ideaDoc.unsaved || workDoc.unsaved;
  const flushAll = ideaDoc.flush;
  const flushWork = workDoc.flush;

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState !== "hidden") return;
      flushAll();
      flushWork();
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
  }, [flushAll, flushWork, unsaved]);

  const goTo = useCallback((next: Mode) => {
    setMode(next);
    setConfirming(false);
    if (next === "work") setShowSuggestions(false);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "ideas");
    if (next === "work") url.searchParams.set("board", "work");
    else url.searchParams.delete("board");
    window.history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showSuggestions) setShowSuggestions(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSuggestions]);

  async function runOrganise(target: OrganiseMode) {
    setConfirming(false);
    setAiError(null);
    setBusy(true);

    const current = ideaHandle.current?.getDoc();
    if (current) {
      const saved = await saveIdea(projectId, JSON.stringify(current));
      if (saved.status === "error") {
        setBusy(false);
        setAiError(saved.message ?? "Your notes could not be saved first.");
        return;
      }
      ideaDoc.markSaved(current);
    }

    const result = await organise(projectId, target);
    setBusy(false);

    if (result.status === "error" || !result.doc) {
      setAiError(result.message ?? "The work board could not be organised.");
      return;
    }

    workDoc.markSaved(result.doc);
    workHandle.current?.replaceContent(result.doc);
    setWorkFilled(result.doc.content.length > 0);
    goTo("work");
  }

  const organiseLabel = workFilled ? "Organise again" : "Organise with AI";

  return (
    <div className="flex min-h-0 flex-1 flex-col border-y border-black/[0.07] bg-white">
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div
          inert={mode === "work"}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <BoardSurface
            projectId={projectId}
            initialDoc={idea.doc}
            canEdit={canEdit}
            placeholder="Start writing — plans, decisions, research, anything."
            status={ideaDoc.status}
            message={ideaDoc.message}
            updatedAt={idea.updatedAt}
            updatedBy={idea.updatedBy}
            onChange={ideaDoc.onChange}
            onRetry={ideaDoc.flush}
            upload={upload}
            editorRef={ideaHandle}
            lead={<BoardName>Idea Board</BoardName>}
            actions={
              suggestions.length ? (
                <Button
                  variant="bare"
                  size="none"
                  type="button"
                  onClick={() => setShowSuggestions((value) => !value)}
                  aria-expanded={showSuggestions}
                  title="Unfinished work from earlier weeks"
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition",
                    showSuggestions
                      ? "border-black/25 bg-black/[0.04] text-black"
                      : "border-black/[0.09] bg-white text-black/65 hover:border-black/25 hover:text-black",
                  )}
                >
                  <Sparkles className="size-3.5" />
                  <span className="hidden sm:inline">Unfinished</span>
                  <span className="rounded-full bg-black/[0.07] px-1.5 text-[10px] font-semibold">
                    {suggestions.reduce(
                      (total, group) => total + group.items.length,
                      0,
                    )}
                  </span>
                </Button>
              ) : null
            }
          />

          <SuggestionsPanel
            groups={suggestions}
            open={showSuggestions}
            onClose={() => setShowSuggestions(false)}
          />

          <Button
            variant="bare"
            size="none"
            type="button"
            onClick={() => goTo("work")}
            title="Open the Work Board"
            className="group absolute top-1/2 right-0 z-20 flex -translate-y-1/2 items-center gap-2 rounded-l-xl bg-[#15181b] py-4 pr-2.5 pl-2 text-white shadow-[0_10px_30px_rgba(20,23,26,0.18)] transition hover:pr-3.5 focus-visible:ring-2 focus-visible:ring-[#2fe85c]/60 focus-visible:outline-none"
          >
            <ChevronLeft className="size-3.5 shrink-0 text-[#2fe85c] transition group-hover:-translate-x-0.5" />
            <span className="text-[11px] font-semibold tracking-[0.04em] [writing-mode:vertical-rl]">
              Work Board
            </span>
          </Button>
        </div>

        <Button
          variant="bare"
          size="none"
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => goTo("idea")}
          className={cn(
            "absolute inset-0 z-30 bg-black/10 transition-opacity duration-200 ease-in-out supports-backdrop-filter:backdrop-blur-xs motion-reduce:transition-none",
            mode === "work" ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />

        <div
          inert={mode !== "work"}
          className={cn(
            "absolute inset-y-0 right-0 left-4 z-40 flex flex-col overflow-hidden rounded-l-2xl border-l border-black/[0.09] bg-white shadow-lg transition-transform duration-200 ease-in-out will-change-transform motion-reduce:transition-none sm:left-10 lg:left-16",
            mode === "work"
              ? "translate-x-0"
              : "pointer-events-none translate-x-full",
          )}
        >
          <BoardSurface
            projectId={projectId}
            initialDoc={work.doc}
            canEdit={canEdit}
            placeholder="Organise your Idea Board with AI, or write the plan here yourself."
            status={workDoc.status}
            message={workDoc.message}
            updatedAt={work.updatedAt}
            updatedBy={work.updatedBy}
            onChange={onWorkChange}
            onRetry={workDoc.flush}
            upload={upload}
            editorRef={workHandle}
            lead={
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  variant="bare"
                  size="none"
                  type="button"
                  onClick={() => goTo("idea")}
                  title="Back to the Idea Board"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/[0.09] bg-white px-2.5 text-xs font-medium text-black/65 transition hover:border-black/25 hover:text-black"
                >
                  <ArrowLeft className="size-3.5" />
                  <span className="hidden sm:inline">Idea Board</span>
                </Button>
                <BoardName>Work Board</BoardName>
              </div>
            }
            actions={
              canEdit && aiReady ? (
                <div className="relative">
                  <Button
                    variant="bare"
                    size="none"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      workFilled
                        ? setConfirming(true)
                        : void runOrganise("replace")
                    }
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#15181b] px-2.5 text-xs font-semibold text-[#2fe85c] transition hover:bg-black disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="size-3.5" />
                    )}
                    {busy ? "Organising…" : organiseLabel}
                  </Button>

                  <Modal
                    open={confirming}
                    onClose={() => setConfirming(false)}
                    title="Organise the work board"
                  >
                    <p className="text-[13px] leading-6 text-black/60">
                      This board already has content. Replace it, or add the new
                      plan underneath?
                    </p>

                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                      <Button
                        variant="admin-secondary"
                        size="none"
                        type="button"
                        onClick={() => setConfirming(false)}
                        className="h-9 px-3.5 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="admin-secondary"
                        size="none"
                        type="button"
                        onClick={() => void runOrganise("append")}
                        className="h-9 px-3.5 text-xs"
                      >
                        Append below
                      </Button>
                      <Button
                        variant="admin-primary"
                        size="none"
                        type="button"
                        onClick={() => void runOrganise("replace")}
                        className="h-9 px-3.5 text-xs"
                      >
                        Replace
                      </Button>
                    </div>
                  </Modal>
                </div>
              ) : null
            }
          />

          {aiError ? (
            <div
              role="alert"
              className="flex shrink-0 items-start gap-2 border-t border-red-200 bg-red-50 px-4 py-2.5 text-[12px] text-red-700"
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span className="flex-1">{aiError}</span>
              <Button
                variant="bare"
                size="none"
                type="button"
                onClick={() => setAiError(null)}
                className="font-semibold underline underline-offset-2"
              >
                Dismiss
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BoardName({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 font-mono text-[10px] tracking-[0.14em] text-black/35 uppercase">
      {children}
    </span>
  );
}
