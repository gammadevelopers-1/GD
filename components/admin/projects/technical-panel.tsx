"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FlaskConical,
  GitBranch,
  Globe,
  Layers,
  Loader2,
  LockKeyhole,
  Palette,
  Pencil,
  Server,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import { Spotlight } from "@/components/admin/spotlight";
import {
  type TechnicalField,
  type TechnicalValues,
  IDLE_TECHNICAL_FORM,
  NOTES_MAX,
  TECHNICAL_LABELS,
  linkLabel,
  toHref,
} from "@/lib/projects/technical";
import type { TechnicalFormState } from "@/lib/projects/technical";
import { formatDate } from "@/lib/projects/format";
import {
  BUTTON_GHOST,
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

const LINK_FIELDS: Array<{
  field: TechnicalField;
  icon: typeof GitBranch;
  hint: string;
}> = [
  { field: "repositoryUrl", icon: GitBranch, hint: "Where the code lives" },
  { field: "hostingUrl", icon: Server, hint: "Vercel or hosting dashboard" },
  { field: "liveDomain", icon: Globe, hint: "What the client sees" },
  { field: "stagingDomain", icon: FlaskConical, hint: "Where work is reviewed" },
  { field: "designUrl", icon: Palette, hint: "Figma or design file" },
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

  const filled = countFilled(values);

  return (
    <Spotlight className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        <section className={cn(PANEL, "p-5")}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-black/[0.045]">
                <Layers className="size-4 text-black/45" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
                  Working links
                </h2>
                <p className="text-[11px] text-black/40">
                  Everything needed to start on this project on day one.
                </p>
              </div>
            </div>
            {editable ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className={cn(BUTTON_SECONDARY, "h-9 text-xs")}
              >
                <Pencil className="size-3.5" />
                Edit details
              </button>
            ) : null}
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {LINK_FIELDS.map(({ field, icon, hint }) => (
              <LinkCard
                key={field}
                icon={icon}
                label={TECHNICAL_LABELS[field]}
                hint={hint}
                value={values[field]}
                canEdit={editable}
                onAdd={() => setEditing(true)}
              />
            ))}
            <ContactCard
              value={values.technicalContact}
              canEdit={editable}
              onAdd={() => setEditing(true)}
            />
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <NotesCard
            icon={Layers}
            title="Stack notes"
            body={values.stackNotes}
            empty="No stack notes. What is this built with, and what should someone know before touching it?"
            canEdit={editable}
            onAdd={() => setEditing(true)}
          />
          <NotesCard
            icon={BookOpen}
            title="Onboarding notes"
            body={values.onboardingNotes}
            empty="No onboarding notes. What does a new person need on their first day?"
            canEdit={editable}
            onAdd={() => setEditing(true)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <section className={cn(PANEL, "p-5")}>
          <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
            Ready for a new joiner
          </h2>
          <p className="mt-1.5 text-[11px] text-black/40">
            {filled.done} of {filled.total} filled in.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/[0.07]">
            <div
              className="h-full rounded-full bg-[#2fe85c] transition-[width] duration-500"
              style={{ width: `${Math.round((filled.done / filled.total) * 100)}%` }}
            />
          </div>
          <ul className="mt-4 space-y-1.5">
            {filled.rows.map((row) => (
              <li
                key={row.label}
                className="flex items-center gap-2.5 text-[12px]"
              >
                <span
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded border",
                    row.done
                      ? "border-[#16a34a] bg-[#16a34a] text-white"
                      : "border-black/15 bg-white text-transparent",
                  )}
                >
                  <Check className="size-2.5" />
                </span>
                <span className={row.done ? "text-black/35" : "text-black/65"}>
                  {row.label}
                </span>
              </li>
            ))}
          </ul>

          {details?.updatedAt ? (
            <p className="mt-4 border-t border-black/[0.06] pt-3 text-[11px] text-black/38">
              Last saved {formatDate(details.updatedAt.slice(0, 10))}
              {details.updatedBy ? ` by ${details.updatedBy}` : ""}.
            </p>
          ) : null}

          {isArchived ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-4 text-amber-800">
              This project is archived, so its details are read-only. Restore it
              to make changes.
            </p>
          ) : null}
          {!canEdit ? (
            <p className="mt-4 rounded-xl border border-black/[0.07] bg-white/60 px-3 py-2.5 text-[11px] leading-4 text-black/50">
              Only people assigned to this project can edit these.
            </p>
          ) : null}
        </section>

        <section className={cn(PANEL, "p-5")}>
          <div className="mb-3 flex items-center gap-2.5">
            <LockKeyhole className="size-4 text-black/35" />
            <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
              Secrets go below
            </h2>
          </div>
          <p className="flex items-start gap-2 text-[12px] leading-5 text-black/50">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
            Nothing on this card is encrypted and everyone on the project can
            read it, so API keys, tokens, passwords and database URLs are
            rejected here. They belong in the encrypted vault underneath.
          </p>
        </section>
      </div>
    </Spotlight>
  );
}

function LinkCard({
  icon: Icon,
  label,
  hint,
  value,
  canEdit,
  onAdd,
}: {
  icon: typeof GitBranch;
  label: string;
  hint: string;
  value: string;
  canEdit: boolean;
  onAdd: () => void;
}) {
  const href = value ? toHref(value) : null;

  if (!value || !href) {
    return (
      <div className="group/empty flex min-h-[76px] flex-col justify-center rounded-2xl border border-dashed border-black/[0.11] bg-white/30 px-3.5 py-3">
        <p className="flex items-center gap-2 text-[11px] text-black/35">
          <Icon className="size-3.5" />
          {label}
        </p>
        {canEdit ? (
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              "mt-1.5 w-fit rounded text-[12px] font-semibold text-black/45 transition hover:text-[#08743d]",
              FOCUS_RING,
            )}
          >
            Not added — add it
          </button>
        ) : (
          <p className="mt-1.5 text-[12px] text-black/35">Not added</p>
        )}
      </div>
    );
  }

  return (
    <div className="group/link min-h-[76px] rounded-2xl border border-black/[0.065] bg-white/55 px-3.5 py-3 transition duration-200 hover:border-black/[0.14] hover:bg-white hover:shadow-[0_10px_26px_rgba(20,23,26,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[11px] text-black/40">
          <Icon className="size-3.5" />
          {label}
        </p>
        <CopyButton value={href} label={label} />
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(
          "mt-1.5 flex items-center gap-1.5 rounded text-[13px] font-medium text-[#08743d] hover:underline",
          FOCUS_RING,
        )}
      >
        <span className="truncate">{linkLabel(value)}</span>
        <ExternalLink className="size-3 shrink-0 opacity-60" />
      </a>
      <p className="mt-0.5 truncate text-[10px] text-black/30">{hint}</p>
    </div>
  );
}

function ContactCard({
  value,
  canEdit,
  onAdd,
}: {
  value: string;
  canEdit: boolean;
  onAdd: () => void;
}) {
  if (!value) {
    return (
      <div className="flex min-h-[76px] flex-col justify-center rounded-2xl border border-dashed border-black/[0.11] bg-white/30 px-3.5 py-3">
        <p className="flex items-center gap-2 text-[11px] text-black/35">
          <UserRound className="size-3.5" />
          {TECHNICAL_LABELS.technicalContact}
        </p>
        {canEdit ? (
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              "mt-1.5 w-fit rounded text-[12px] font-semibold text-black/45 transition hover:text-[#08743d]",
              FOCUS_RING,
            )}
          >
            Not added — add it
          </button>
        ) : (
          <p className="mt-1.5 text-[12px] text-black/35">Not added</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[76px] rounded-2xl border border-black/[0.065] bg-white/55 px-3.5 py-3 transition duration-200 hover:border-black/[0.14] hover:bg-white">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[11px] text-black/40">
          <UserRound className="size-3.5" />
          {TECHNICAL_LABELS.technicalContact}
        </p>
        <CopyButton value={value} label="technical contact" />
      </div>
      <p className="mt-1.5 text-[13px] font-medium break-words text-black/70">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-black/30">
        Who to ask on the client side
      </p>
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
        "grid size-6 shrink-0 place-items-center rounded-md text-black/30 transition duration-150 hover:bg-black/[0.05] hover:text-black active:scale-95",
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

function NotesCard({
  icon: Icon,
  title,
  body,
  empty,
  canEdit,
  onAdd,
}: {
  icon: typeof Layers;
  title: string;
  body: string;
  empty: string;
  canEdit: boolean;
  onAdd: () => void;
}) {
  return (
    <section className={cn(PANEL, "p-5")}>
      <div className="mb-3 flex items-center gap-2.5">
        <Icon className="size-4 text-black/35" />
        <h3 className="text-[14px] font-semibold tracking-[-0.025em]">
          {title}
        </h3>
      </div>
      {body ? (
        <p className="text-[13px] leading-6 whitespace-pre-wrap text-black/60">
          {body}
        </p>
      ) : (
        <>
          <p className="text-[13px] leading-5 text-black/38">{empty}</p>
          {canEdit ? (
            <button
              type="button"
              onClick={onAdd}
              className={cn(BUTTON_GHOST, "mt-3 h-8 px-0")}
            >
              Add notes
            </button>
          ) : null}
        </>
      )}
    </section>
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

  // A save that worked closes the form, and the page behind it already has
  // the new values from revalidatePath.
  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="space-y-4">
        <section className={cn(PANEL, "p-5")}>
          <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
            Working links
          </h2>
          <p className="mt-1.5 text-[11px] text-black/40">
            Leave a field empty to clear it.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              name="repositoryUrl"
              label={TECHNICAL_LABELS.repositoryUrl}
              placeholder="https://github.com/gamma/project"
              value={current.repositoryUrl}
              error={errors.repositoryUrl}
              autoFocus
            />
            <Field
              name="hostingUrl"
              label={TECHNICAL_LABELS.hostingUrl}
              placeholder="https://vercel.com/gamma/project"
              value={current.hostingUrl}
              error={errors.hostingUrl}
            />
            <Field
              name="liveDomain"
              label={TECHNICAL_LABELS.liveDomain}
              placeholder="client.com"
              value={current.liveDomain}
              error={errors.liveDomain}
            />
            <Field
              name="stagingDomain"
              label={TECHNICAL_LABELS.stagingDomain}
              placeholder="staging.client.com"
              value={current.stagingDomain}
              error={errors.stagingDomain}
            />
            <Field
              name="designUrl"
              label={TECHNICAL_LABELS.designUrl}
              placeholder="https://figma.com/file/…"
              value={current.designUrl}
              error={errors.designUrl}
            />
            <Field
              name="technicalContact"
              label={TECHNICAL_LABELS.technicalContact}
              placeholder="Name, email or phone"
              value={current.technicalContact}
              error={errors.technicalContact}
            />
          </div>
        </section>

        <section className={cn(PANEL, "p-5")}>
          <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
            Notes
          </h2>
          <div className="mt-5 space-y-4">
            <TextareaField
              name="stackNotes"
              label={TECHNICAL_LABELS.stackNotes}
              placeholder="Next.js 16, Supabase, Tailwind. Anything unusual about how it runs locally."
              value={current.stackNotes}
              error={errors.stackNotes}
            />
            <TextareaField
              name="onboardingNotes"
              label={TECHNICAL_LABELS.onboardingNotes}
              placeholder="What a new person needs on day one — access to request, who to ask, where to start."
              value={current.onboardingNotes}
              error={errors.onboardingNotes}
            />
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <section className={cn(PANEL, "h-fit p-5")}>
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
            <ShieldAlert className="mt-px size-4 shrink-0 text-amber-600" />
            <p className="text-[11px] leading-4 text-amber-800">
              These fields are not encrypted. API keys, tokens, passwords and
              database URLs are rejected here — they belong in Credentials.
            </p>
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

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className={cn(BUTTON_PRIMARY, "h-10 flex-1")}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save details
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
        </section>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  value,
  error,
  autoFocus,
}: {
  name: TechnicalField;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-black/55">{label}</span>
      <input
        name={name}
        defaultValue={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn(INPUT, "h-10", error && "border-red-300 focus:border-red-400")}
      />
      {error ? (
        <span
          id={`${name}-error`}
          className="flex items-start gap-1.5 text-[11px] text-red-700"
        >
          <AlertCircle className="mt-px size-3 shrink-0" />
          {error}
        </span>
      ) : null}
    </label>
  );
}

function TextareaField({
  name,
  label,
  placeholder,
  value,
  error,
}: {
  name: TechnicalField;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-black/55">{label}</span>
      <textarea
        name={name}
        defaultValue={value}
        placeholder={placeholder}
        rows={4}
        maxLength={NOTES_MAX}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn(
          INPUT,
          "resize-y py-2.5 leading-6",
          error && "border-red-300 focus:border-red-400",
        )}
      />
      {error ? (
        <span
          id={`${name}-error`}
          className="flex items-start gap-1.5 text-[11px] text-red-700"
        >
          <AlertCircle className="mt-px size-3 shrink-0" />
          {error}
        </span>
      ) : null}
    </label>
  );
}

function blankDetails(): TechnicalDetails {
  return {
    repositoryUrl: "",
    hostingUrl: "",
    liveDomain: "",
    stagingDomain: "",
    designUrl: "",
    technicalContact: "",
    stackNotes: "",
    onboardingNotes: "",
    updatedBy: null,
    updatedAt: null,
  };
}

function countFilled(values: TechnicalValues) {
  const rows = [
    { label: "Repository", done: Boolean(values.repositoryUrl) },
    { label: "Hosting", done: Boolean(values.hostingUrl) },
    { label: "Live domain", done: Boolean(values.liveDomain) },
    { label: "Design file", done: Boolean(values.designUrl) },
    { label: "Client technical contact", done: Boolean(values.technicalContact) },
    { label: "Stack notes", done: Boolean(values.stackNotes) },
    { label: "Onboarding notes", done: Boolean(values.onboardingNotes) },
  ];
  return {
    rows,
    done: rows.filter((row) => row.done).length,
    total: rows.length,
  };
}
