"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { PASSWORD_MIN } from "@/lib/team/records";
import { setPassword, type SetPasswordState } from "./actions";

const initialState: SetPasswordState = {};

const FIELD =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.055] px-4 text-[15px] text-white transition outline-none placeholder:text-white/25 focus:border-[#2fe85c]/60 focus:ring-4 focus:ring-[#2fe85c]/10 disabled:cursor-not-allowed disabled:opacity-40";

export function SetPasswordForm({
  token,
  email,
  locked = false,
  kind = "member",
}: {
  token: string;
  email: string;
  locked?: boolean;
  kind?: "member" | "client";
}) {
  const [state, action, pending] = useActionState(setPassword, initialState);
  const [password, setPasswordValue] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [touched, setTouched] = useState({ password: false, confirmation: false });

  const tooShort = password.length > 0 && password.length < PASSWORD_MIN;
  const mismatch = confirmation.length > 0 && confirmation !== password;
  const valid =
    !locked && password.length >= PASSWORD_MIN && confirmation === password;

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="kind" value={kind} />

      {email ? (
        <label className="block space-y-2">
          <span className="text-[13px] font-medium text-white/70">
            Your work email
          </span>
          <input
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
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          placeholder={`At least ${PASSWORD_MIN} characters`}
          className={FIELD}
          value={password}
          onChange={(event) => setPasswordValue(event.target.value)}
          onBlur={() => setTouched((was) => ({ ...was, password: true }))}
          disabled={locked}
          required
          autoFocus={!locked}
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
        <input
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          placeholder="Type it again"
          className={FIELD}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          onBlur={() => setTouched((was) => ({ ...was, confirmation: true }))}
          disabled={locked}
          required
        />
        {mismatch ? <Hint>Those two passwords do not match.</Hint> : null}
      </label>

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-400/10 px-3.5 py-3 text-sm text-red-200"
        >
          {state.error}
        </p>
      ) : null}

      {state.spent ? (
        <Link
          href={kind === "client" ? "/portal/sign-in" : "/login"}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/12 text-sm font-medium text-white/70 transition hover:border-white/25 hover:text-white"
        >
          Go to sign in
          <ArrowRight className="size-4" />
        </Link>
      ) : null}

      <button
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
      </button>
    </form>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="block text-[12.5px] text-red-300">{children}</span>;
}
