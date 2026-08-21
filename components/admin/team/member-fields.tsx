"use client";

import {
  EMPLOYMENT_LABELS,
  EMPLOYMENT_TYPES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  TEAM_ROLES,
  type TeamFieldErrors,
  type TeamFormValues,
} from "@/lib/team/records";
import { INPUT } from "@/lib/admin-ui";
import { FormSelect } from "@/components/common/form-select";
import { FormDatePicker } from "@/components/common/form-date-picker";
import { cn } from "@/lib/utils";

export type MemberFieldDefaults = Partial<TeamFormValues>;

export function MemberFields({
  defaults,
  errors,
  lockEmail = false,
}: {
  defaults: MemberFieldDefaults;
  errors: TeamFieldErrors;
  lockEmail?: boolean;
}) {
  return (
    <div className="space-y-6">
      <Group title="Person">
        <Field label="Full name" error={errors.fullName}>
          <input
            name="fullName"
            required
            maxLength={120}
            defaultValue={defaults.fullName ?? ""}
            className={cn(INPUT, "h-10")}
          />
        </Field>

        <Field label="Work email" error={errors.email}>
          <input
            name="email"
            type="email"
            required
            readOnly={lockEmail}
            defaultValue={defaults.email ?? ""}
            placeholder="name@gammadevelopers.ai"
            className={cn(INPUT, "h-10", lockEmail && "bg-black/[0.03]")}
          />
        </Field>

        <Field label="Job title" error={errors.jobTitle}>
          <input
            name="jobTitle"
            required
            maxLength={120}
            defaultValue={defaults.jobTitle ?? ""}
            placeholder="Delivery engineer"
            className={cn(INPUT, "h-10")}
          />
        </Field>

        <Field label="Phone (optional)" error={errors.phone}>
          <input
            name="phone"
            defaultValue={defaults.phone ?? ""}
            placeholder="+92 300 0000000"
            className={cn(INPUT, "h-10")}
          />
        </Field>
      </Group>

      <Group title="Access">
        <div className="sm:col-span-2">
          <fieldset>
            <legend className="text-[12px] text-black/55">Role</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {TEAM_ROLES.map((role) => (
                <label
                  key={role}
                  className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 transition has-checked:border-[#16a34a] has-checked:bg-[#16a34a]/[0.06]"
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    required
                    defaultChecked={(defaults.role ?? "member") === role}
                    className="mt-0.5 size-4 shrink-0 accent-[#16a34a]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-black/80">
                      {ROLE_LABELS[role]}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-black/45">
                      {ROLE_DESCRIPTIONS[role]}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {errors.role ? <ErrorText>{errors.role}</ErrorText> : null}
          </fieldset>
        </div>
      </Group>

      <Group title="Employment">
        <Field label="Type (optional)" error={errors.employmentType}>
          <FormSelect
            name="employmentType"
            defaultValue={defaults.employmentType ?? ""}
            triggerClassName={cn(INPUT, "h-10")}
            options={[
              { value: "", label: "Not recorded" },
              ...EMPLOYMENT_TYPES.map((type) => ({
                value: type,
                label: EMPLOYMENT_LABELS[type],
              })),
            ]}
          />
        </Field>

        <Field label="Start date (optional)" error={errors.startDate}>
          <FormDatePicker
            name="startDate"
            defaultValue={defaults.startDate ?? ""}
            triggerClassName={cn(INPUT, "h-10")}
          />
        </Field>

        <Field
          label="Monthly salary, PKR (optional)"
          error={errors.salaryAmount}
        >
          <input
            name="salaryAmount"
            inputMode="decimal"
            defaultValue={defaults.salaryAmount ?? ""}
            placeholder="0"
            className={cn(INPUT, "h-10 font-mono")}
          />
        </Field>

        <Field label="CNIC (optional)" error={errors.cnic}>
          <input
            name="cnic"
            defaultValue={defaults.cnic ?? ""}
            placeholder="00000-0000000-0"
            className={cn(INPUT, "h-10 font-mono")}
          />
        </Field>
      </Group>

      <Group title="Bank account">
        <Field label="Account title (optional)" error={errors.bankAccountTitle}>
          <input
            name="bankAccountTitle"
            maxLength={120}
            defaultValue={defaults.bankAccountTitle ?? ""}
            className={cn(INPUT, "h-10")}
          />
        </Field>

        <Field label="Bank (optional)" error={errors.bankName}>
          <input
            name="bankName"
            maxLength={120}
            defaultValue={defaults.bankName ?? ""}
            className={cn(INPUT, "h-10")}
          />
        </Field>

        <Field
          label="Account number or IBAN (optional)"
          error={errors.bankAccountNumber}
          wide
        >
          <input
            name="bankAccountNumber"
            defaultValue={defaults.bankAccountNumber ?? ""}
            placeholder="PK00XXXX0000000000000000"
            className={cn(INPUT, "h-10 font-mono")}
          />
        </Field>
      </Group>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
        {title}
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  wide = false,
  children,
}: {
  label: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block space-y-1.5", wide && "sm:col-span-2")}>
      <span className="text-[12px] text-black/55">{label}</span>
      {children}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 block text-[11.5px] text-red-700">{children}</span>
  );
}
