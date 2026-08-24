"use client";

import { useActionState, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { LinkSpentNotice } from "@/components/auth/link-spent-notice";
import { PasswordInput } from "@/components/ui/password-input";
import { PASSWORD_MIN } from "@/lib/team/records";
import { setPassword, type SetPasswordState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: SetPasswordState = {};

const FIELD =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.055] px-4 text-[15px] text-white transition outline-none placeholder:text-white/25 focus:border-[#2fe85c]/60 focus:ring-4 focus:ring-[#2fe85c]/10 disabled:cursor-not-allowed disabled:opacity-40";

const TOGGLE = "text-white/40 hover:text-white focus-visible:ring-[#2fe85c]/45";

export function SetPasswordForm({
  token,
  email,
  locked = false,
  kind = "member",
  signInHref,
}: {
  token: string;
  email: string;
  locked?: boolean;
  kind?: "member" | "client";
  signInHref: string;
}) {
  const [state, action, pending] = useActionState(setPassword, initialState);
  const [password, setPasswordValue] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [touched, setTouched] = useState({
    password: false,
    confirmation: false,
  });

  const tooShort = password.length > 0 && password.length < PASSWORD_MIN;
  const mismatch = confirmation.length > 0 && confirmation !== password;
  const isLocked = locked || state.spent === true;
  const valid =
    !isLocked && password.length >= PASSWORD_MIN && confirmation === password;

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="kind" value={kind} />

      {state.spent ? <LinkSpentNotice signInHref={signInHref} /> : null}

      {email ? (
        <label className="block space-y-2">
          <span className="text-[13px] font-medium text-white/70">
            Your work email
          </span>
          <Input
            variant="bare"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            readOnly
            tabIndex={-1}
            className={`${FIELD} cursor-default text-white/55`}
          />
        </label>
      ) : null}

      <label className="block space-y-2">
        <span className="text-[13px] font-medium text-white/70">
          Set password
        </span>
        <PasswordInput
          name="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          placeholder={`At least ${PASSWORD_MIN} characters`}
          className={FIELD}
          toggleClassName={TOGGLE}
          value={password}
          onChange={(event) => setPasswordValue(event.target.value)}
          onBlur={() => setTouched((was) => ({ ...was, password: true }))}
          disabled={isLocked}
          required
          autoFocus={!isLocked}
        />
        {tooShort && touched.password ? (
          <Hint>
            {PASSWORD_MIN - password.length} more character
            {PASSWORD_MIN - password.length === 1 ? "" : "s"} needed.
          </Hint>
        ) : null}
      </label>

      <label className="block space-y-2">
        <span className="text-[13px] font-medium text-white/70">
          Confirm password
        </span>
        <PasswordInput
          name="confirmation"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          placeholder="Type it again"
          className={FIELD}
          toggleClassName={TOGGLE}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          onBlur={() => setTouched((was) => ({ ...was, confirmation: true }))}
          disabled={isLocked}
          required
        />
        {mismatch ? <Hint>Those two passwords do not match.</Hint> : null}
      </label>

      {state.error && !state.spent ? (
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
        disabled={pending || !valid}
        data-button-fill
        className="button-fill-fx button-fill-fx--lift group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2fe85c] px-4 text-sm font-semibold text-[#101512] shadow-[0_12px_35px_rgba(47,232,92,0.2)] transition hover:shadow-[0_18px_45px_rgba(47,232,92,0.3)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {pending ? (
          <LoaderCircle className="relative size-4 animate-spin" />
        ) : (
          <>
            <span className="button-fill-fx__label">Set password</span>
            <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="block text-[12.5px] text-red-300">{children}</span>;
}
