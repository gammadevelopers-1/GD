"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type RouteErrorKind = "not-found" | "forbidden" | "error";

const content = {
  "not-found": {
    code: "404",
    title: "This page slipped off the map.",
    description:
      "The address may be mistyped, moved, or no longer available. Let’s get you back somewhere useful.",
    primaryHref: "/",
    primaryLabel: "Back to website",
    secondaryHref: null,
    secondaryLabel: null,
  },
  forbidden: {
    code: "403",
    title: "That area is outside your access.",
    description:
      "You’re signed in, but your current role doesn’t include this workspace. If you need it, ask an owner to update your access.",
    primaryHref: "/",
    primaryLabel: "Back to website",
    secondaryHref: "/dashboard",
    secondaryLabel: "Go to dashboard",
  },
  error: {
    code: "500",
    title: "Something broke on our side.",
    description:
      "Nothing you did caused this, and nothing was lost. Try again",
    primaryHref: "/dashboard",
    primaryLabel: "Go to dashboard",
    secondaryHref: null,
    secondaryLabel: null,
  },
} as const;

export function RouteErrorState({
  kind,
  embedded = false,
  reset,
  reference,
}: {
  kind: RouteErrorKind;
  embedded?: boolean;
  reset?: () => void;
  reference?: string;
}) {
  const state = content[kind];

  return (
    <section
      aria-labelledby={`${kind}-title`}
      className={cn(
        "relative isolate flex min-h-dvh overflow-hidden bg-[#0b0e10] text-white",
        embedded ? "fixed inset-0 z-[100] w-full" : "relative",
      )}
    >
      <div aria-hidden="true" className="route-error-grid absolute inset-0" />
      <div
        aria-hidden="true"
        className="route-error-aurora route-error-aurora-one"
      />
      <div
        aria-hidden="true"
        className="route-error-aurora route-error-aurora-two"
      />

      <div className="relative z-10 flex min-h-dvh w-full items-center justify-center px-5 py-12 sm:px-8 sm:py-14 lg:px-10">
        <div className="relative w-full max-w-5xl text-center">
          <div className="relative">
            <p aria-hidden="true" className="route-error-code select-none">
              {state.code}
            </p>

            <div className="relative z-10 mx-auto -mt-10 max-w-3xl sm:-mt-16 lg:-mt-24">
              <h1
                id={`${kind}-title`}
                className="text-[clamp(2.1rem,6.2vw,5.5rem)] leading-[0.95] font-semibold tracking-[-0.065em] text-[#f0f2ed]"
              >
                {state.title}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/45 sm:text-[15px] sm:leading-7">
                {state.description}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {reset ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2fe85c] px-6 text-sm font-semibold text-[#0d1510] shadow-[0_12px_34px_rgba(47,232,92,0.18)] transition duration-300 outline-none hover:shadow-[0_18px_42px_rgba(47,232,92,0.3)] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b0e10] sm:w-auto"
                  >
                    Try again
                  </button>
                ) : null}
                <Link
                  href={state.primaryHref}
                  data-button-fill
                  className="button-fill-fx button-fill-fx--lift group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-[#2fe85c] px-6 text-sm font-semibold text-[#0d1510] shadow-[0_12px_34px_rgba(47,232,92,0.18)] transition duration-300 outline-none hover:shadow-[0_18px_42px_rgba(47,232,92,0.3)] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b0e10] sm:w-auto"
                >
                  <span className="button-fill-fx__label">
                    {state.primaryLabel}
                  </span>
                  <ArrowUpRight className="relative size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>

                {state.secondaryHref ? (
                  <Link
                    href={state.secondaryHref}
                    data-button-fill
                    className="button-fill-fx button-fill-fx--lift group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.045] px-6 text-sm font-medium text-white/65 transition duration-300 outline-none [--button-fill-color:#2fe85c] [--button-fill-hover-text:#101512] hover:border-transparent focus-visible:ring-2 focus-visible:ring-[#2fe85c] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b0e10] sm:w-auto"
                  >
                    <span className="button-fill-fx__label">
                      {state.secondaryLabel}
                    </span>
                    <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                ) : null}
              </div>

              {reference ? (
                <p className="mt-6 font-mono text-[11px] text-white/30">
                  Reference {reference}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
