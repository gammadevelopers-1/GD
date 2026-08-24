"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { login, type LoginState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: LoginState = {};

export function LoginForm({ next = "/dashboard" }: { next?: string }) {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next} />

      <label className="block space-y-2">
        <span className="text-[13px] font-medium text-white/70">
          Work email
        </span>
        <Input
          variant="bare"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@gammadevelopers.ai"
          className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.055] px-4 text-[15px] text-white transition outline-none placeholder:text-white/25 focus:border-[#2fe85c]/60 focus:ring-4 focus:ring-[#2fe85c]/10"
          required
        />
      </label>

      <label className="block space-y-2">
        <span className="text-[13px] font-medium text-white/70">Password</span>
        <PasswordInput
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.055] px-4 text-[15px] text-white transition outline-none placeholder:text-white/25 focus:border-[#2fe85c]/60 focus:ring-4 focus:ring-[#2fe85c]/10"
          toggleClassName="text-white/40 hover:text-white focus-visible:ring-[#2fe85c]/45"
          required
        />
      </label>

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
        className="button-fill-fx button-fill-fx--lift group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2fe85c] px-4 text-sm font-semibold text-[#101512] shadow-[0_12px_35px_rgba(47,232,92,0.2)] transition hover:shadow-[0_18px_45px_rgba(47,232,92,0.3)] disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle className="relative size-4 animate-spin" />
        ) : (
          <>
            <span className="button-fill-fx__label">Sign in securely</span>
            <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  );
}
