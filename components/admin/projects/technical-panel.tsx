"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import {
  type TechnicalField,
  type TechnicalValues,
  IDLE_TECHNICAL_FORM,
  NOTES_MAX,
  linkLabel,
  toHref,
} from "@/lib/projects/technical";
import type { TechnicalFormState } from "@/lib/projects/technical";
import { formatDate } from "@/lib/projects/format";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  FOCUS_RING,
  INPUT,
  PANEL,
} from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export type TechnicalDetails = TechnicalValues & {
  updatedBy: string | null;
  updatedAt: string | null;
};

type SaveAction = (
  state: TechnicalFormState,
  formData: FormData,
) => Promise<TechnicalFormState>;

type Row = {
  field: TechnicalField;
  label: string;
  kind: "link" | "text" | "notes";
  placeholder: string;
};

const ROWS: Row[] = [
  {
    field: "repositoryUrl",
    label: "Repository",
    kind: "link",
    placeholder: "https://github.com/gamma/project",
  },
  {
    field: "hostingUrl",
    label: "Hosting / deployment project",
    kind: "link",
    placeholder: "https://vercel.com/gamma/project",
  },
  {
    field: "liveDomain",
    label: "Live domain",
    kind: "link",
    placeholder: "client.com",
  },
  {
    field: "stagingDomain",
    label: "Staging domain",
    kind: "link",
    placeholder: "staging.client.com",
  },
  {
    field: "designUrl",
    label: "Design file",
    kind: "link",
    placeholder: "https://figma.com/file/…",
  },
  {
    field: "stackNotes",
    label: "Stack notes",
    kind: "notes",
    placeholder: "Frameworks, services and anything load-bearing about the build.",
  },
  {
    field: "onboardingNotes",
    label: "Onboarding notes",
    kind: "notes",
    placeholder: "What someone needs on their first day on this project.",
  },
];

export function TechnicalPanel({
  projectId,
  details,
  canEdit,
  isArchived,
  save,
}: {
  projectId: string;
  details: TechnicalDetails | null;
  canEdit: boolean;
  isArchived: boolean;
  save: SaveAction;
}) {
  const [editing, setEditing] = useState(false);
  const values = details ?? blankDetails();
  const editable = canEdit && !isArchived;

  if (editing && editable) {
    return (
      <TechnicalForm
        projectId={projectId}
        values={values}
        save={save}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <section className={cn(PANEL, "p-6 sm:p-7")}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-[16px] font-semibold tracking-[-0.025em]">
          Working links
        </h2>
        {editable ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={cn(BUTTON_SECONDARY, "h-9 text-xs")}
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
        ) : null}
      </header>

      <dl className="mt-6 divide-y divide-black/[0.06]">
        {ROWS.map((row) => (
          <ValueRow
            key={row.field}
            row={row}
            value={values[row.field]}
            canEdit={editable}
            onAdd={() => setEditing(true)}
          />
        ))}
      </dl>

      {details?.updatedAt ? (
        <p className="mt-6 text-[11px] text-black/35">
          Last saved {formatDate(details.updatedAt.slice(0, 10))}
          {details.updatedBy ? ` by ${details.updatedBy}` : ""}.
        </p>
      ) : null}

      {isArchived ? (
        <p className="mt-4 text-[12px] text-black/45">
          This project is archived, so these are read-only.
        </p>
      ) : null}
      {!canEdit ? (
        <p className="mt-4 text-[12px] text-black/45">
          Only people assigned to this project can edit these.
        </p>
      ) : null}
    </section>
  );
}

function ValueRow({
  row,
  value,
  canEdit,
  onAdd,
}: {
  row: Row;
  value: string;
  canEdit: boolean;
  onAdd: () => void;
}) {
  const href = row.kind === "link" && value ? toHref(value) : null;

  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[220px_1fr] sm:gap-6 sm:py-3.5">
      <dt className="pt-px text-[13px] text-black/45">{row.label}</dt>
      <dd className="min-w-0">
        {!value ? (
          canEdit ? (
            <button
              type="button"
              onClick={onAdd}
              className={cn(
                "rounded text-[13px] text-black/35 transition hover:text-[#08743d]",
                FOCUS_RING,
              )}
            >
              Add
            </button>
          ) : (
            <span className="text-[13px] text-black/25">Not added</span>
          )
        ) : href ? (
          <div className="group flex min-w-0 items-center gap-2">
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                "flex min-w-0 items-center gap-1.5 rounded text-[13px] font-medium text-[#08743d] hover:underline",
                FOCUS_RING,
              )}
            >
              <span className="truncate">{linkLabel(value)}</span>
              <ExternalLink className="size-3 shrink-0 opacity-55" />
            </a>
            <CopyButton value={href} label={row.label} />
          </div>
        ) : row.kind === "notes" ? (
          <p className="text-[13px] leading-6 whitespace-pre-wrap text-black/70">
            {value}
          </p>
        ) : (
          <div className="group flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate text-[13px] text-black/70">
              {value}
            </span>
            <CopyButton value={value} label={row.label} />
          </div>
        )}
      </dd>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-md text-black/25 opacity-100 transition duration-150 hover:bg-black/[0.05] hover:text-black active:scale-95 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100",
        FOCUS_RING,
      )}
    >
      {copied ? (
        <Check className="size-3 text-[#08743d]" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  );
}

function TechnicalForm({
  projectId,
  values,
  save,
  onDone,
}: {
  projectId: string;
  values: TechnicalValues;
  save: SaveAction;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    save,
    IDLE_TECHNICAL_FORM,
  );
  const current = state.values ?? values;
  const errors = state.fieldErrors;

  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className={cn(PANEL, "p-6 sm:p-7")}>
      <input type="hidden" name="projectId" value={projectId} />

      <h2 className="text-[16px] font-semibold tracking-[-0.025em]">
        Working links
      </h2>

      <div className="mt-6 space-y-5">
        {ROWS.map((row, index) =>
          row.kind === "notes" ? (
            <label key={row.field} className="block space-y-1.5">
              <span className="text-[13px] text-black/55">
                {row.label} <Optional />
              </span>
              <textarea
                name={row.field}
                defaultValue={current[row.field]}
                placeholder={row.placeholder}
                rows={4}
                maxLength={NOTES_MAX}
                aria-invalid={errors[row.field] ? true : undefined}
                aria-describedby={
                  errors[row.field] ? `${row.field}-error` : undefined
                }
                className={cn(
                  INPUT,
                  "resize-y py-2.5 leading-6",
                  errors[row.field] && "border-red-300 focus:border-red-400",
                )}
              />
              <FieldError field={row.field} message={errors[row.field]} />
            </label>
          ) : (
            <label key={row.field} className="block space-y-1.5">
              <span className="text-[13px] text-black/55">
                {row.label} <Optional />
              </span>
              <input
                name={row.field}
                defaultValue={current[row.field]}
                placeholder={row.placeholder}
                autoFocus={index === 0}
                aria-invalid={errors[row.field] ? true : undefined}
                aria-describedby={
                  errors[row.field] ? `${row.field}-error` : undefined
                }
                className={cn(
                  INPUT,
                  "h-10",
                  errors[row.field] && "border-red-300 focus:border-red-400",
                )}
              />
              <FieldError field={row.field} message={errors[row.field]} />
            </label>
          ),
        )}
      </div>

      {state.status !== "idle" && state.message ? (
        <p
          className={cn(
            "mt-4 flex items-start gap-1.5 text-[12px]",
            state.status === "success" ? "text-[#08743d]" : "text-red-700",
          )}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="mt-px size-3.5 shrink-0" />
          ) : (
            <AlertCircle className="mt-px size-3.5 shrink-0" />
          )}
          {state.message}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className={cn(BUTTON_PRIMARY, "h-10")}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          className={cn(BUTTON_SECONDARY, "h-10")}
        >
          <X className="size-3.5" />
          Cancel
        </button>
      </div>
    </form>
  );
}

function Optional() {
  return <span className="text-black/30">(optional)</span>;
}

function FieldError({
  field,
  message,
}: {
  field: TechnicalField;
  message?: string;
}) {
  if (!message) return null;
  return (
    <span
      id={`${field}-error`}
      className="flex items-start gap-1.5 text-[11px] text-red-700"
    >
      <AlertCircle className="mt-px size-3 shrink-0" />
      {message}
    </span>
  );
}

function blankDetails(): TechnicalDetails {
  return {
    repositoryUrl: "",
    hostingUrl: "",
    liveDomain: "",
    stagingDomain: "",
    designUrl: "",
    stackNotes: "",
    onboardingNotes: "",
    updatedBy: null,
    updatedAt: null,
  };
}
