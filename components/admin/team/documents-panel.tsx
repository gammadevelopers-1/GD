"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  AlertCircle,
  ExternalLink,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
} from "lucide-react";
import {
  archiveTeamDocument,
  uploadTeamDocument,
} from "@/app/(admin)/team/actions";
import { ConfirmAction, Modal } from "@/components/admin/projects/modal";
import { FormSelect } from "@/components/common/form-select";
import type { TeamDocument } from "@/data/team";
import { IDLE_FORM } from "@/lib/projects/form-state";
import { ICON_BUTTON_DANGER, INPUT, INPUT_SMALL, PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TYPE_LABELS: Record<string, string> = {
  contract: "Contract",
  id: "ID",
  certificate: "Certificate",
  other: "Other",
};

export function DocumentsPanel({
  profileId,
  documents,
}: {
  profileId: string;
  documents: TeamDocument[];
}) {
  const [state, action, pending] = useActionState(
    uploadTeamDocument,
    IDLE_FORM,
  );
  const [preview, setPreview] = useState<TeamDocument | null>(null);
  const uploadForm = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") uploadForm.current?.reset();
  }, [state]);

  return (
    <section className={cn(PANEL, "p-5")}>
      <h2 className="font-mono text-[9px] tracking-[0.16em] text-black/55 uppercase">
        Documents
      </h2>

      {documents.length ? (
        <ul className="mt-4 space-y-2">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-black/[0.07] bg-white px-3.5 py-2.5"
            >
              <FileText className="size-4 shrink-0 text-black/55" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-black/80">
                  {document.fileName}
                </p>
                <p className="text-[11px] text-black/60">
                  {TYPE_LABELS[document.documentType] ?? document.documentType}
                  {document.sizeBytes
                    ? ` · ${formatSize(document.sizeBytes)}`
                    : ""}
                </p>
              </div>

              {document.url ? (
                <button
                  type="button"
                  onClick={() => setPreview(document)}
                  className={cn(INPUT_SMALL, "h-7 cursor-pointer font-medium")}
                >
                  Preview
                </button>
              ) : null}

              <RemoveDocument profileId={profileId} documentId={document.id} />
            </li>
          ))}
        </ul>
      ) : null}

      <form
        action={action}
        ref={uploadForm}
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        <input type="hidden" name="profileId" value={profileId} />

        <label className="block space-y-1.5">
          <span className="text-[12px] text-black/55">Kind</span>
          <FormSelect
            name="documentType"
            triggerClassName={cn(INPUT, "h-10 w-40")}
            options={Object.entries(TYPE_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </label>

        <label className="block min-w-56 flex-1 space-y-1.5">
          <span className="text-[12px] text-black/55">File</span>
          <input
            type="file"
            name="file"
            required
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className={cn(
              INPUT,
              "h-10 py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-black/[0.06] file:px-2.5 file:py-1 file:text-xs file:font-medium",
            )}
          />
        </label>

        <Button
          variant="admin-primary"
          size="none"
          type="submit"
          disabled={pending}
          className="h-10"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Paperclip className="size-3.5" />
          )}
          Attach
        </Button>
      </form>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 text-[12px] text-red-700"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {state.message}
        </p>
      ) : null}

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        size="lg"
        title={preview?.fileName ?? "Document"}
      >
        {preview?.url ? (
          <div className="space-y-3">
            {preview.mimeType?.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt={preview.fileName}
                className="max-h-[60vh] w-full rounded-xl object-contain"
              />
            ) : (
              <iframe
                src={preview.url}
                title={preview.fileName}
                className="h-[60vh] w-full rounded-xl border border-black/[0.07]"
              />
            )}
            <a
              href={preview.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-black/60 hover:text-black"
            >
              <ExternalLink className="size-3.5" />
              Open in a new tab
            </a>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}

function RemoveDocument({
  profileId,
  documentId,
}: {
  profileId: string;
  documentId: string;
}) {
  const [removing, startRemoving] = useTransition();

  return (
    <ConfirmAction
      label={<Trash2 className="size-3.5" />}
      confirmLabel="Remove"
      question="Remove this document?"
      pending={removing}
      className={ICON_BUTTON_DANGER}
      onConfirm={() => {
        const data = new FormData();
        data.set("profileId", profileId);
        data.set("documentId", documentId);
        startRemoving(() => archiveTeamDocument(data));
      }}
    />
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
