"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newsletter } from "@/lib/content/home";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done" }
  | { kind: "error"; message: string };

export function NewsletterForm() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setState({ kind: "sending" });

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          website: String(data.get("website") ?? ""),
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !result?.ok) {
        setState({
          kind: "error",
          message: result?.error || newsletter.error,
        });
        return;
      }

      form.reset();
      setState({ kind: "done" });
    } catch {
      setState({ kind: "error", message: newsletter.error });
    }
  }

  const busy = state.kind === "sending";

  return (
    <div>
      <form
        onSubmit={onSubmit}
        aria-label="Newsletter signup"
        className="focus-within:border-brand flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.05] py-1.25 pr-1.25 pl-3 transition-colors duration-200"
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Email address</span>
          <Input
            variant="bare"
            type="email"
            name="email"
            required
            disabled={busy}
            placeholder={newsletter.placeholder}
            className="w-full border-0 bg-transparent text-[13px] text-[#eceae2] outline-none placeholder:text-[#6d736a]"
          />
        </label>

        {/* Off-screen and hidden from assistive tech. Bots fill it, people
            never see it. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="pointer-events-none absolute -left-[9999px] size-px opacity-0"
        />

        <Button
          variant="bare"
          size="none"
          type="submit"
          disabled={busy}
          aria-label="Subscribe"
          className="bg-brand focus-visible:ring-brand/50 grid size-8.5 shrink-0 cursor-pointer place-items-center rounded-lg text-[#0f1512] transition-transform duration-200 hover:-translate-y-px focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
        >
          <svg
            aria-hidden
            viewBox="0 0 20 16"
            className="h-3.25 w-4"
            fill="none"
          >
            <path
              d="M2.5 8h14m-3.5-3.25L16.5 8 13 11.25"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </form>

      <p
        aria-live="polite"
        className={`mt-2.25 min-h-[15px] text-[11px] ${
          state.kind === "error" ? "text-[#ff8f8f]" : "text-[#6d736a]"
        }`}
      >
        {state.kind === "sending" ? newsletter.sending : null}
        {state.kind === "done" ? newsletter.success : null}
        {state.kind === "error" ? state.message : null}
      </p>
    </div>
  );
}
