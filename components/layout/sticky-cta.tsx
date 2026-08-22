"use client";

import { useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

export function StickyCta() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number>(0);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (reduced || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    setLeaving(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => router.push("/contact"), 520);
  }

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-0 z-[200] flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] [background:linear-gradient(120deg,#101512_0%,#059669_58%,#2fe85c_100%)]",
          leaving ? "translate-x-0" : "translate-x-full",
        )}
      >
        <span className="font-display text-[clamp(28px,5vw,52px)] font-bold tracking-[-0.045em] text-[#eafff0]">
          Let’s talk →
        </span>
      </div>

      <Link
        href="/contact"
        onClick={handleClick}
        aria-label="Let’s talk business"
        data-button-fill
        className="button-fill-fx marketing-primary-button sticky-business-cta fixed top-1/2 right-0 z-[55] hidden min-h-[224px] w-[76px] -translate-y-1/2 grid-cols-[1fr_22px] items-center overflow-hidden rounded-l-[20px] px-3 py-6 lg:grid"
      >
        <span className="button-fill-fx__label rotate-180 justify-self-center [text-orientation:sideways] [writing-mode:vertical-rl]">
          Let’s Talk Business
        </span>
        <span
          aria-hidden
          className="sticky-cta-nudge relative z-[1] justify-self-center font-mono text-xl leading-none font-bold"
        >
          &lt;
        </span>
      </Link>
    </>
  );
}
