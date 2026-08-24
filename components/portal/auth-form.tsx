"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import type { PortalAuthState } from "@/app/(portal)/portal/sign-in/actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";

const FIELD =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.055] px-4 text-[15px] text-white transition outline-none placeholder:text-white/25 focus:border-brand/60 focus:ring-4 focus:ring-brand/10";

export type Field = {
  name: string;
  label: string;
  type: "email" | "password";
  autoComplete?: string;
  placeholder?: string;
};

export function AuthForm({
  action,
  fields,
  submit,
}: {
  action: (
    state: PortalAuthState,
    formData: FormData,
  ) => Promise<PortalAuthState>;
  fields: Field[];
  submit: string;
}) {
  const [state, formAction, pending] = useActionState<
    PortalAuthState,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="space-y-5">
      {fields.map((field, index) => (
        <label key={field.name} className="block space-y-2">
          <span className="text-[13px] font-medium text-white/70">
            {field.label}
          </span>
          {field.type === "password" ? (
            <PasswordInput
              name={field.name}
              tone="dark"
              required
              autoFocus={index === 0}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              className={FIELD}
            />
          ) : (
            <Input
              variant="bare"
              name={field.name}
              type={field.type}
              required
              autoFocus={index === 0}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              className={FIELD}
            />
          )}
        </label>
      ))}

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-400/10 px-3.5 py-3 text-sm text-red-200"
        >
          {state.error}
        </p>
      ) : null}

      <Button
        variant="bare"
        size="none"
        type="submit"
        disabled={pending}
        data-button-fill
        className="button-fill-fx button-fill-fx--lift group bg-brand flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-[#101512] shadow-[0_12px_35px_rgba(47,232,92,0.2)] transition hover:shadow-[0_18px_45px_rgba(47,232,92,0.3)] disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle className="relative size-4 animate-spin" />
        ) : (
          <>
            <span className="button-fill-fx__label">{submit}</span>
            <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  );
}
