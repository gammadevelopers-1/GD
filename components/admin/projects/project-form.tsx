"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, Lock } from "lucide-react";
import {
  type ProjectField,
  type ProjectFormState,
  type ProjectFormValues,
  DESCRIPTION_MAX,
  IDLE_PROJECT_FORM,
  NAME_MAX,
} from "@/lib/projects/validation";
import { PROJECT_STATUSES, PROJECT_STATUS_LABEL } from "@/lib/projects/status";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

export function ProjectForm({
  mode,
  action,
  clients,
  people,
  defaults,
  projectId,
  cancelHref,
  returnTo,
}: {
  mode: "create" | "edit";
  action: (
    state: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
  clients: Option[];
  people: Option[];
  defaults: ProjectFormValues;
  projectId?: string;
  cancelHref: string;
  returnTo?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    ...IDLE_PROJECT_FORM,
    values: defaults,
  });

  const values = state.values ?? defaults;
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-5">
      {projectId ? (
        <input type="hidden" name="projectId" value={projectId} />
      ) : null}

      {returnTo ? <input type="hidden" name="from" value={returnTo} /> : null}

      {state.status !== "idle" && state.message ? (
        <div
          role="status"
          className={cn(
            "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
            state.status === "success"
              ? "border-[#2fe85c]/30 bg-[#2fe85c]/10 text-[#08743d]"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          )}
          <span>{state.message}</span>
        </div>
      ) : null}

      <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2">
        <Field
          name="name"
          label="Project name"
          error={errors.name}
          required
          className="sm:col-span-2"
        >
          <input
            id="name"
            name="name"
            defaultValue={values.name}
            maxLength={NAME_MAX}
            required
            placeholder="Client portal rebuild"
            aria-invalid={Boolean(errors.name)}
            className={inputClass(Boolean(errors.name))}
          />
        </Field>

        <Field name="clientId" label="Client" error={errors.clientId}>
          <select
            id="clientId"
            name="clientId"
            defaultValue={values.clientId}
            aria-invalid={Boolean(errors.clientId)}
            className={inputClass(Boolean(errors.clientId))}
          >
            <option value="">No client yet</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </Field>

        <Field name="status" label="Status" error={errors.status}>
          <select
            id="status"
            name="status"
            defaultValue={values.status || "discovery"}
            className={inputClass(Boolean(errors.status))}
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </Field>

        <Field name="leadId" label="Project lead" error={errors.leadId}>
          <select
            id="leadId"
            name="leadId"
            defaultValue={values.leadId}
            aria-invalid={Boolean(errors.leadId)}
            className={inputClass(Boolean(errors.leadId))}
          >
            <option value="">Not assigned yet</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field name="startsOn" label="Start date" error={errors.startsOn}>
            <input
              id="startsOn"
              name="startsOn"
              type="date"
              defaultValue={values.startsOn}
              aria-invalid={Boolean(errors.startsOn)}
              className={inputClass(Boolean(errors.startsOn))}
            />
          </Field>
          <Field name="dueOn" label="Due date" error={errors.dueOn}>
            <input
              id="dueOn"
              name="dueOn"
              type="date"
              defaultValue={values.dueOn}
              aria-invalid={Boolean(errors.dueOn)}
              className={inputClass(Boolean(errors.dueOn))}
            />
          </Field>
        </div>

        <Field
          name="description"
          label="Description"
          error={errors.description}
          className="sm:col-span-2"
        >
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={values.description}
            maxLength={DESCRIPTION_MAX}
            aria-invalid={Boolean(errors.description)}
            className={cn(
              inputClass(Boolean(errors.description)),
              "h-auto resize-none py-3",
            )}
          />
        </Field>

        <div className="rounded-2xl border border-black/[0.08] bg-[#15181b] p-4 sm:col-span-2 sm:p-5">
          <div className="flex items-center gap-2">
            <Lock className="size-3.5 text-[#69ee88]" />
            <p className="font-mono text-[9px] tracking-[0.14em] text-[#69ee88] uppercase">
              Owner only
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DarkField
              name="valueAmount"
              label="Project value"
              error={errors.valueAmount}
            >
              <input
                id="valueAmount"
                name="valueAmount"
                inputMode="decimal"
                defaultValue={values.valueAmount}
                placeholder="24000"
                aria-invalid={Boolean(errors.valueAmount)}
                className={darkInputClass(Boolean(errors.valueAmount))}
              />
            </DarkField>
            <DarkField
              name="valueCurrency"
              label="Currency"
              error={errors.valueCurrency}
            >
              <select
                id="valueCurrency"
                name="valueCurrency"
                defaultValue={values.valueCurrency || "USD"}
                className={darkInputClass(Boolean(errors.valueCurrency))}
              >
                <option value="USD">USD</option>
                <option value="PKR">PKR</option>
              </select>
            </DarkField>
            <DarkField
              name="exchangeRate"
              label="PKR per 1 USD"
              error={errors.exchangeRate}
            >
              <input
                id="exchangeRate"
                name="exchangeRate"
                inputMode="decimal"
                defaultValue={values.exchangeRate}
                placeholder="279.40"
                aria-invalid={Boolean(errors.exchangeRate)}
                className={darkInputClass(Boolean(errors.exchangeRate))}
              />
            </DarkField>
            <DarkField
              name="bookedOn"
              label="Booked on"
              error={errors.bookedOn}
            >
              <input
                id="bookedOn"
                name="bookedOn"
                type="date"
                defaultValue={values.bookedOn}
                aria-invalid={Boolean(errors.bookedOn)}
                className={darkInputClass(Boolean(errors.bookedOn))}
              />
            </DarkField>
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t border-black/[0.06] pt-5 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-black/45 transition duration-150 hover:bg-black/[0.045] hover:text-black/75 focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          data-button-fill
          className="button-fill-fx button-fill-fx--lift inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#15181b] px-5 text-sm font-semibold text-white transition [--button-fill-color:#2fe85c] [--button-fill-hover-text:#101512] disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          <span className="button-fill-fx__label">
            {pending
              ? "Saving…"
              : mode === "create"
                ? "Create project"
                : "Save changes"}
          </span>
        </button>
      </div>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition duration-150 hover:border-black/20 focus:border-[#16a34a] focus-visible:ring-2 focus-visible:ring-[#16a34a]/20",
    hasError ? "border-red-300 bg-red-50/40" : "border-black/[0.09]",
  );
}

function darkInputClass(hasError: boolean) {
  return cn(
    "h-11 w-full rounded-xl border bg-white/[0.06] px-3 text-sm text-white outline-none transition duration-150 hover:border-white/25 focus:border-[#2fe85c]/60 focus-visible:ring-2 focus-visible:ring-[#2fe85c]/20",
    hasError ? "border-red-400/60 bg-red-500/10" : "border-white/[0.09]",
  );
}

function Field({
  name,
  label,
  error,
  hint,
  className,
  required,
  children,
}: {
  name: ProjectField;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <label
        htmlFor={name}
        className="flex items-center gap-1 text-xs font-medium text-black/55"
      >
        {label}
        {required ? (
          <>
            <span aria-hidden className="text-red-600">
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-700">
          <AlertCircle className="size-3" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-black/35">{hint}</p>
      ) : null}
    </div>
  );
}

function DarkField({
  name,
  label,
  error,
  children,
}: {
  name: ProjectField;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={name} className="text-[11px] font-medium text-white/50">
        {label}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-300">
          <AlertCircle className="size-3" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
