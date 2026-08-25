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
import { FormSelect } from "@/components/common/form-select";
import { FormDatePicker } from "@/components/common/form-date-picker";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
              ? "border-brand/30 bg-brand/10 text-gd-green-deep"
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
          <Input
            variant="bare"
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
          <FormSelect
            id="clientId"
            name="clientId"
            defaultValue={values.clientId}
            ariaInvalid={Boolean(errors.clientId)}
            triggerClassName={inputClass(Boolean(errors.clientId))}
            options={[
              { value: "", label: "No client yet" },
              ...clients.map((client) => ({
                value: client.id,
                label: client.name,
              })),
            ]}
          />
        </Field>

        <Field name="status" label="Status" error={errors.status}>
          <FormSelect
            id="status"
            name="status"
            defaultValue={values.status || "discovery"}
            ariaInvalid={Boolean(errors.status)}
            triggerClassName={inputClass(Boolean(errors.status))}
            options={PROJECT_STATUSES.map((status) => ({
              value: status,
              label: PROJECT_STATUS_LABEL[status],
            }))}
          />
        </Field>

        <Field name="leadId" label="Project lead" error={errors.leadId}>
          <FormSelect
            id="leadId"
            name="leadId"
            defaultValue={values.leadId}
            ariaInvalid={Boolean(errors.leadId)}
            triggerClassName={inputClass(Boolean(errors.leadId))}
            options={[
              { value: "", label: "Not assigned yet" },
              ...people.map((person) => ({
                value: person.id,
                label: person.name,
              })),
            ]}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field name="startsOn" label="Start date" error={errors.startsOn}>
            <FormDatePicker
              id="startsOn"
              name="startsOn"
              defaultValue={values.startsOn}
              ariaInvalid={Boolean(errors.startsOn)}
              triggerClassName={inputClass(Boolean(errors.startsOn))}
            />
          </Field>
          <Field name="dueOn" label="Due date" error={errors.dueOn}>
            <FormDatePicker
              id="dueOn"
              name="dueOn"
              defaultValue={values.dueOn}
              ariaInvalid={Boolean(errors.dueOn)}
              triggerClassName={inputClass(Boolean(errors.dueOn))}
            />
          </Field>
        </div>

        <Field
          name="description"
          label="Description"
          error={errors.description}
          className="sm:col-span-2"
        >
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={values.description}
            maxLength={DESCRIPTION_MAX}
            variant="bare"
            aria-invalid={Boolean(errors.description)}
            className={cn(
              inputClass(Boolean(errors.description)),
              "h-auto resize-none py-3",
            )}
          />
        </Field>

        <div className="bg-gd-panel-dark rounded-2xl border border-black/[0.08] p-4 sm:col-span-2 sm:p-5">
          <div className="flex items-center gap-2">
            <Lock className="text-gd-mint-bright size-3.5" />
            <p className="text-gd-mint-bright font-mono text-[9px] tracking-[0.14em] uppercase">
              Owner only
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DarkField
              name="valueAmount"
              label="Project value"
              error={errors.valueAmount}
            >
              <Input
                variant="bare"
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
              <FormSelect
                id="valueCurrency"
                name="valueCurrency"
                defaultValue={values.valueCurrency || "USD"}
                ariaInvalid={Boolean(errors.valueCurrency)}
                triggerClassName={cn(
                  darkInputClass(Boolean(errors.valueCurrency)),
                  "[&>svg]:text-white/45",
                )}
                options={[
                  { value: "USD", label: "USD" },
                  { value: "PKR", label: "PKR" },
                ]}
              />
            </DarkField>
            <DarkField
              name="exchangeRate"
              label="PKR per 1 USD"
              error={errors.exchangeRate}
            >
              <Input
                variant="bare"
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
              <FormDatePicker
                id="bookedOn"
                name="bookedOn"
                defaultValue={values.bookedOn}
                ariaInvalid={Boolean(errors.bookedOn)}
                triggerClassName={cn(
                  darkInputClass(Boolean(errors.bookedOn)),
                  "data-[empty=true]:text-white/35 [&_svg]:text-white/70",
                )}
              />
            </DarkField>
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t border-black/[0.06] pt-5 sm:flex-row sm:justify-end">
        <Button
          asChild
          variant="admin-ghost"
          size="none"
          className="h-10 px-4 text-[13px]"
        >
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button
          variant="admin-cta"
          size="none"
          type="submit"
          disabled={pending}
          data-button-fill
          className="h-10 px-5 disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          <span className="button-fill-fx__label">
            {pending
              ? "Saving…"
              : mode === "create"
                ? "Create project"
                : "Save changes"}
          </span>
        </Button>
      </div>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition duration-150 hover:border-black/20 focus:border-black/35 focus-visible:ring-0",
    hasError ? "border-red-300 bg-red-50/40" : "border-black/[0.09]",
  );
}

function darkInputClass(hasError: boolean) {
  return cn(
    "h-11 w-full rounded-xl border bg-white/[0.06] px-3 text-sm text-white outline-none transition duration-150 hover:border-white/25 focus:border-white/40 focus-visible:ring-0",
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
