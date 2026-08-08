"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { hero } from "@/lib/content/home";
import { site } from "@/lib/content/site";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useHero } from "./hero-provider";

export function AuditForm() {
  const { phase, status, result, runAudit, reset } = useHero();
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();

  const busy = phase === "loading";
  const finished = phase === "done";

  useGSAP(
    () => {
      if (reduced || !resultRef.current) return;
      gsap.from(resultRef.current.children, {
        opacity: 0,
        y: 12,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.08,
      });
    },
    { dependencies: [finished, reduced] },
  );

  useGSAP(
    () => {
      if (reduced || !statusRef.current || !status) return;
      gsap.fromTo(
        statusRef.current,
        { opacity: 0, y: 4, filter: "blur(3px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.34,
          ease: "power2.out",
        },
      );
    },
    { dependencies: [status, reduced] },
  );

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = value.trim();
    if (text.length < 8) {
      setLocalError("Tell us a bit more about the business.");
      return;
    }
    setLocalError("");
    void runAudit(text);
  }

  return (
    <div className="mx-auto mt-7 max-w-[630px]">
      <form onSubmit={submit}>
        <div className="border-border focus-within:border-accent/45 flex flex-wrap items-center gap-2 rounded-2xl border bg-white/95 p-3 shadow-[0_14px_40px_rgba(20,23,26,0.09)] backdrop-blur-md transition-colors duration-200 sm:flex-nowrap sm:rounded-full sm:py-1.5 sm:pr-1.5 sm:pl-5.5">
          <label htmlFor="audit-input" className="sr-only">
            Describe your business
          </label>
          <input
            id="audit-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={hero.placeholder}
            maxLength={300}
            disabled={busy}
            className="text-foreground placeholder:text-muted-foreground h-11 w-full flex-1 border-0 bg-transparent text-[15.5px] outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-brand h-11 w-full shrink-0 cursor-pointer rounded-full px-6 text-sm font-medium text-[#14171a] transition-all hover:not-disabled:-translate-y-px hover:not-disabled:bg-[#26d150] hover:not-disabled:shadow-[0_8px_22px_rgba(47,232,92,0.34)] disabled:cursor-default disabled:opacity-50 sm:w-auto"
          >
            {busy ? "Reading…" : hero.cta}
          </button>
        </div>
      </form>

      <p
        ref={statusRef}
        role="status"
        aria-live="polite"
        className="text-muted-foreground mt-3 min-h-[18px] font-mono text-[11px] tracking-[0.05em]"
      >
        {localError ? (
          <span className="text-[#b4402c]">{localError}</span>
        ) : status ? (
          <span
            className={phase === "error" ? "text-[#b4402c]" : "text-accent"}
          >
            {phase !== "error" && (
              <span className="bg-brand mr-2 inline-block size-[5px] animate-pulse rounded-full align-middle" />
            )}
            {status}
          </span>
        ) : null}
      </p>

      {finished && result ? (
        <div ref={resultRef} className="mt-6">
          <p className="text-muted-foreground mx-auto mb-5 max-w-[42ch] text-[15px]">
            <b className="text-foreground font-medium">{result.headline}</b>
            <br />
            First version in about {result.weeks} weeks.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={site.calendly}
              className="bg-brand inline-flex h-12 items-center rounded-full px-6 text-[15px] font-medium text-[#14171a] transition-all hover:-translate-y-0.5 hover:bg-[#26d150] hover:shadow-[0_8px_26px_rgba(47,232,92,0.3)]"
            >
              Book the full audit · 30 min
            </Link>
            <button
              type="button"
              onClick={() => {
                setValue("");
                reset();
              }}
              className="border-border hover:border-foreground inline-flex h-12 cursor-pointer items-center rounded-full border px-6 text-[15px] font-medium transition-all hover:-translate-y-0.5"
            >
              Try another business
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
