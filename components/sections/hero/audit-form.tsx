"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { hero } from "@/lib/content/home";
import { site } from "@/lib/content/site";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useHero } from "./hero-provider";

export function AuditForm() {
  const { phase, status, result, runAudit } = useHero();
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptLength, setPromptLength] = useState(0);
  const [promptMode, setPromptMode] = useState<"typing" | "deleting">("typing");
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();

  const busy = phase === "loading";
  const finished = phase === "done";
  const prompt = hero.typingPrompts[promptIndex];
  const typedPrompt = reduced
    ? hero.typingPrompts[0]
    : prompt.slice(0, promptLength);

  useEffect(() => {
    if (reduced || value || busy) return;

    let delay = 58;
    let advance = () => setPromptLength((length) => length + 1);

    if (promptMode === "typing" && promptLength >= prompt.length) {
      delay = 1450;
      advance = () => setPromptMode("deleting");
    } else if (promptMode === "deleting" && promptLength > 0) {
      delay = 24;
      advance = () => setPromptLength((length) => length - 1);
    } else if (promptMode === "deleting") {
      delay = 280;
      advance = () => {
        setPromptIndex((index) => (index + 1) % hero.typingPrompts.length);
        setPromptMode("typing");
      };
    }

    const timer = window.setTimeout(advance, delay);
    return () => window.clearTimeout(timer);
  }, [busy, prompt, promptLength, promptMode, reduced, value]);

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
    <div className="relative mx-auto mt-7 max-w-[630px]">
      <form onSubmit={submit}>
        <div className="audit-form-shell border-border focus-within:border-accent/45 flex flex-wrap items-center gap-2 rounded-2xl border bg-white/95 p-3 shadow-[0_14px_40px_rgba(20,23,26,0.09)] backdrop-blur-md sm:flex-nowrap sm:rounded-full sm:py-1.5 sm:pr-1.5 sm:pl-5.5">
          <label htmlFor="audit-input" className="sr-only">
            Describe your business
          </label>
          <div className="relative min-w-0 flex-1">
            {!value && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 flex max-w-full items-center overflow-hidden text-[15px] whitespace-nowrap text-[#747774]"
              >
                <span className="overflow-hidden text-ellipsis">
                  {typedPrompt}
                </span>
                <i className="bg-accent ml-0.5 h-[1.05em] w-px shrink-0 animate-pulse not-italic" />
              </span>
            )}
            <input
              ref={inputRef}
              id="audit-input"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              aria-placeholder={hero.typingPrompts[0]}
              maxLength={300}
              disabled={busy}
              className="text-foreground relative h-11 w-full border-0 bg-transparent text-[15.5px] outline-none disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="bg-brand h-11 w-full shrink-0 cursor-pointer rounded-full px-6 text-sm font-medium text-[#14171a] transition-all hover:not-disabled:-translate-y-px hover:not-disabled:bg-[#26d150] hover:not-disabled:shadow-[0_8px_22px_rgba(47,232,92,0.34)] disabled:cursor-default disabled:opacity-50 sm:w-auto"
          >
            {busy ? "Analyzing…" : hero.cta}
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
        ) : status && !finished ? (
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
        <div
          ref={resultRef}
          className="relative left-1/2 mt-3 w-[min(940px,calc(100vw-32px))] -translate-x-1/2 text-left lg:absolute lg:top-full "
        >
          <section className="audit-result-strip group relative grid items-center gap-4 overflow-hidden rounded-[24px] border border-white/80 p-4 shadow-[0_22px_70px_rgba(20,23,26,0.13),0_3px_16px_rgba(5,150,105,0.08)] backdrop-blur-xl md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:gap-5">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 right-[10%] size-52 rounded-full bg-[radial-gradient(circle,rgba(47,232,92,0.18),transparent_70%)]"
            />
            <div
              aria-hidden
              className="absolute inset-x-12 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(47,232,92,0.88),transparent)]"
            />

            <div className="relative flex items-center gap-3 md:min-w-[170px]">
              <span className="bg-brand/18 border-brand/35 grid size-9 shrink-0 place-items-center rounded-full border transition-transform duration-300 group-hover:scale-110">
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="size-4 text-[#087844]"
                  fill="none"
                >
                  <path
                    d="m5.5 10.2 2.8 2.8 6.2-6.3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className="font-mono text-[9px] font-semibold tracking-[0.18em] text-[#168154] uppercase">
                  Audit complete
                </p>
                <p className="mt-0.5 text-[12px] font-medium text-[#536159]">
                  {result.problems.length} found · short version
                </p>
              </div>
            </div>

            <div className="relative border-[#dfe7df] md:border-l md:pl-5">
              <p className="font-mono text-[9px] font-semibold tracking-[0.16em] text-[#738079] uppercase">
                Recommended first move
              </p>
              <h2 className="mt-1 max-w-[54ch] text-[15px] leading-[1.45] font-semibold tracking-[-0.012em] text-[#111714] md:text-[16px]">
                {result.headline}
              </h2>
            </div>

            <div className="audit-result-delivery relative flex min-w-[205px] items-center gap-3 rounded-2xl bg-[#151a17] px-3.5 py-3 shadow-[0_12px_28px_rgba(20,23,26,0.15)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_34px_rgba(20,23,26,0.22)]">
              <span className="bg-brand grid size-8 shrink-0 place-items-center rounded-xl text-[#101512]">
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="size-3.5"
                  fill="none"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="6.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10 6.5V10l2.5 1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className="font-mono text-[8px] tracking-[0.15em] text-[#8ea096] uppercase">
                  Delivery target
                </p>
                <p className="mt-0.5 text-[13px] font-medium text-[#f1f4ef]">
                  First version in about {result.weeks} weeks.
                </p>
              </div>
            </div>

            <Link
              href={site.calendly}
              className="bg-brand relative inline-flex h-11 items-center justify-center rounded-full px-5 text-[13px] font-medium whitespace-nowrap text-[#14171a] transition-all hover:-translate-y-0.5 hover:bg-[#26d150] hover:shadow-[0_8px_24px_rgba(47,232,92,0.28)]"
            >
              Book full audit
            </Link>
          </section>
        </div>
      ) : null}
    </div>
  );
}
