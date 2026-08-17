"use client";

import { useActionState, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  FileUp,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { type SimpleFormState, IDLE_FORM } from "@/lib/projects/form-state";
import { isEnvKey, parseEnvBlob } from "@/lib/projects/env";
import {
  CREDENTIAL_ENVIRONMENTS,
  ENVIRONMENT_LABEL,
} from "@/lib/credentials/validation";
import {
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  FOCUS_RING,
  ICON_BUTTON,
  INPUT_SMALL,
} from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

type Row = { key: string; value: string; note: string };

const EMPTY_ROW: Row = { key: "", value: "", note: "" };

// Reading a .env happens here, in the browser, and fills the rows. Nothing is
// sent anywhere until Save, so an accidental file pick costs nothing and the
// contents can still be corrected first.
export function EnvComposer({
  projectId,
  groupId,
  action,
  onDone,
}: {
  projectId: string;
  groupId: string;
  action: (
    state: SimpleFormState,
    formData: FormData,
  ) => Promise<SimpleFormState>;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY_ROW }]);
  const [reveal, setReveal] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const filled = rows.filter((row) => row.key.trim() || row.value);

  function update(index: number, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((current) => [...current, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    setRows((current) =>
      current.length === 1 ? [{ ...EMPTY_ROW }] : current.filter((_, i) => i !== index),
    );
  }

  // Shared by the file picker, the drop zone and pasting into a Key field.
  function absorb(text: string, source: string) {
    const { pairs, skipped } = parseEnvBlob(text);
    if (!pairs.length) {
      setNote(`Nothing readable in ${source}.`);
      return;
    }

    setRows((current) => {
      const kept = current.filter((row) => row.key.trim() || row.value);
      const byKey = new Map(kept.map((row) => [row.key.trim(), row]));
      for (const pair of pairs) {
        const existing = byKey.get(pair.key);
        if (existing) existing.value = pair.value;
        else kept.push({ key: pair.key, value: pair.value, note: "" });
      }
      return kept.length ? kept : [{ ...EMPTY_ROW }];
    });

    setNote(
      `${pairs.length} key${pairs.length === 1 ? "" : "s"} read from ${source}` +
        (skipped.length ? ` · ${skipped.length} line${skipped.length === 1 ? "" : "s"} ignored` : ""),
    );
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setNote("That file is too large to be an ENV file.");
      return;
    }
    absorb(await file.text(), file.name);
  }

  return (
    <form
      action={formAction}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void readFile(event.dataTransfer.files?.[0]);
      }}
      className={cn(
        "space-y-3 border-b border-black/[0.06] px-3.5 py-3 transition-colors",
        dragging ? "bg-[#2fe85c]/[0.07]" : "bg-black/[0.012]",
      )}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="groupId" value={groupId} />
      <input
        type="hidden"
        name="rows"
        value={JSON.stringify(
          filled.map((row) => ({
            key: row.key.trim(),
            value: row.value,
            note: row.note.trim(),
          })),
        )}
      />
      <input
        ref={fileInput}
        type="file"
        className="sr-only"
        accept=".env,.txt,text/plain"
        onChange={(event) => {
          void readFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="hidden gap-2 px-1 text-[10px] font-medium text-black/35 sm:grid sm:grid-cols-[1fr_1.2fr_0.9fr_auto]">
        <span>Key</span>
        <span>Value</span>
        <span>Note (optional)</span>
        <span className="w-7" />
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => {
          const badKey = row.key.trim() !== "" && !isEnvKey(row.key.trim());
          return (
            <div
              key={index}
              className="grid gap-2 sm:grid-cols-[1fr_1.2fr_0.9fr_auto]"
            >
              <input
                value={row.key}
                onChange={(event) => update(index, { key: event.target.value })}
                onPaste={(event) => {
                  const text = event.clipboardData.getData("text");
                  // Pasting a whole file into the Key box splits it out, the
                  // way Vercel does. A single key pastes normally.
                  if (text.includes("\n") || /^\s*[\w.]+\s*=/.test(text)) {
                    event.preventDefault();
                    absorb(text, "the pasted text");
                  }
                }}
                placeholder="EXAMPLE_NAME"
                aria-label={`Key ${index + 1}`}
                aria-invalid={badKey}
                className={cn(
                  INPUT_SMALL,
                  "h-9 font-mono",
                  badKey && "border-red-300 bg-red-50/40",
                )}
              />
              <div className="relative">
                <input
                  value={row.value}
                  onChange={(event) => update(index, { value: event.target.value })}
                  type={reveal === index ? "text" : "password"}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Value"
                  aria-label={`Value ${index + 1}`}
                  className={cn(INPUT_SMALL, "h-9 w-full pr-9 font-mono")}
                />
                <button
                  type="button"
                  onClick={() => setReveal(reveal === index ? null : index)}
                  aria-label={reveal === index ? "Hide value" : "Show value"}
                  className={cn(
                    "absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-black/30 transition hover:text-black/70",
                    FOCUS_RING,
                  )}
                >
                  {reveal === index ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </button>
              </div>
              <input
                value={row.note}
                onChange={(event) => update(index, { note: event.target.value })}
                placeholder="Where to rotate it"
                aria-label={`Note ${index + 1}`}
                className={cn(INPUT_SMALL, "h-9")}
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label={`Remove row ${index + 1}`}
                className={cn(ICON_BUTTON, "size-9 justify-self-end")}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={addRow} className={cn(BUTTON_GHOST, "h-8")}>
          <Plus className="size-3.5" />
          Add another
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className={cn(BUTTON_GHOST, "h-8")}
        >
          <FileUp className="size-3.5" />
          Import .env
        </button>
        <span className="text-[10px] text-black/35">
          or drop a file here, or paste one into a Key box
        </span>
      </div>

      {note ? (
        <p className="rounded-lg bg-black/[0.035] px-2.5 py-1.5 text-[11px] text-black/55">
          {note}
        </p>
      ) : null}

      {state.status !== "idle" && state.message ? (
        <p
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-medium",
            state.status === "success" ? "text-[#08743d]" : "text-red-700",
          )}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="size-3" />
          ) : (
            <AlertCircle className="size-3" />
          )}
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-black/[0.06] pt-2.5">
        <select
          name="environment"
          aria-label="Environment"
          className={cn(INPUT_SMALL, "mr-auto h-8")}
        >
          {CREDENTIAL_ENVIRONMENTS.map((environment) => (
            <option key={environment} value={environment}>
              {ENVIRONMENT_LABEL[environment]}
            </option>
          ))}
        </select>
        <button type="button" onClick={onDone} className={cn(BUTTON_GHOST, "h-8")}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || !filled.length}
          className={cn(BUTTON_PRIMARY, "h-8 text-xs")}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Save {filled.length ? `${filled.length} variable${filled.length === 1 ? "" : "s"}` : ""}
        </button>
      </div>
    </form>
  );
}
