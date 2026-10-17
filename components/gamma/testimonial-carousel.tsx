"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** Structural, so this client component does not pull the whole content
 *  module into the browser bundle. */
export type FeatureItem = {
  readonly quote: string;
  readonly company: string;
  readonly descriptor: string;
};

const INTERVAL = 7500;

/** The strongest quotes, one at a time, looping. Slides are stacked in one
 *  grid cell so the panel is always as tall as the longest of them and never
 *  resizes mid-rotation. */
export function TestimonialCarousel({
  items,
}: {
  items: readonly FeatureItem[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(
      () => setIndex((value) => (value + 1) % items.length),
      INTERVAL,
    );
    return () => clearInterval(id);
  }, [paused, items.length]);

  const slide = (active: boolean) =>
    cn(
      "col-start-1 row-start-1 transition-[opacity,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)]",
      active
        ? "opacity-100 translate-y-0"
        : "pointer-events-none translate-y-2 opacity-0",
    );

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Client quotes"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="bg-dark relative isolate overflow-hidden rounded-[20px] p-[clamp(26px,3.2vw,52px)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-28 -z-10 size-[560px] rounded-full bg-[radial-gradient(circle,rgba(47,232,92,0.22),rgba(47,232,92,0.05)_46%,transparent_70%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(47,232,92,0.4)_28%,rgba(47,232,92,0.12)_62%,transparent)]"
      />

      <span
        aria-hidden
        className="text-brand/55 mb-[clamp(18px,2vw,26px)] block text-[32px] leading-[0.5] font-bold select-none"
      >
        &ldquo;
      </span>

      <div className="grid">
        {items.map((item, i) => (
          <blockquote
            key={item.company}
            aria-hidden={i !== index}
            className={cn(
              slide(i === index),
              "text-dark-head max-w-[64ch] text-[clamp(18px,1.85vw,26px)] leading-[1.45] tracking-[-0.018em] text-pretty",
            )}
          >
            {item.quote}
          </blockquote>
        ))}
      </div>

      <div className="mt-[clamp(26px,3vw,40px)] flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-white/[0.08] pt-[clamp(20px,2.2vw,28px)]">
        <div className="grid">
          {items.map((item, i) => (
            <div
              key={item.company}
              aria-hidden={i !== index}
              className={cn(
                slide(i === index),
                "flex flex-wrap items-center gap-x-4 gap-y-1.5",
              )}
            >
              <p className="font-display text-dark-head text-[clamp(16px,1.4vw,19px)] leading-none font-bold tracking-[-0.03em] uppercase">
                {item.company}
              </p>
              <span aria-hidden className="bg-brand/45 h-px w-7" />
              <p className="t-eyebrow text-dim-dark">{item.descriptor}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          {items.map((item, i) => (
            <button
              key={item.company}
              type="button"
              aria-label={`Show the quote from ${item.company}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className="group grid h-6 place-items-center px-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              <span
                className={cn(
                  "block h-[3px] rounded-full transition-[width,background-color] duration-500 ease-out",
                  i === index
                    ? "bg-brand w-7"
                    : "group-hover:bg-dark-line-strong w-3 bg-white/20",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
