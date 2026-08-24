"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { testimonials } from "@/lib/content/home";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const AVATARS = [
  "bg-brand text-[#0f1512]",
  "bg-[#0a7a45] text-white",
  "bg-[#10b981] text-[#0f1512]",
  "bg-[#047857] text-white",
];

const SWAP_MS = 210;

export function TestimonialsSection() {
  const scope = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [delayed, setDelayed] = useState(0);
  const [paused, setPaused] = useState(false);
  const shown = reduced ? active : delayed;
  const current = testimonials.items[shown];
  const swapping = active !== shown;

  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % testimonials.items.length),
      5200,
    );
    return () => window.clearInterval(id);
  }, [reduced, paused]);

  useEffect(() => {
    if (reduced || active === delayed) return;
    const id = window.setTimeout(() => setDelayed(active), SWAP_MS);
    return () => window.clearTimeout(id);
  }, [active, delayed, reduced]);

  useGSAP(
    () => {
      if (reduced || !card.current) return;

      gsap.fromTo(
        card.current,
        { scale: 0.94 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: card.current,
            start: "top 90%",
            end: "top 50%",
            scrub: 1,
          },
        },
      );
    },
    { scope, dependencies: [reduced] },
  );

  return (
    <section
      ref={scope}
      className="marketing-section relative isolate overflow-hidden text-[#eef1ec] [background:radial-gradient(ellipse_60%_50%_at_20%_0%,rgba(47,232,92,0.14),transparent_66%),radial-gradient(ellipse_60%_60%_at_88%_40%,rgba(16,185,129,0.20),transparent_70%),linear-gradient(180deg,#141021_0%,#0c0f16_100%)]"
    >
      <div className="marketing-container relative z-1">
        <Reveal>
          <SectionHeading
            eyebrow={testimonials.eyebrow}
            title={testimonials.title}
            className="dark-heading mx-auto max-w-[720px] text-center [&>h2]:text-[clamp(30px,4.4vw,54px)] [&>h2]:leading-[1.04] [&>h2]:tracking-[-0.04em] [&>h2]:whitespace-pre-line [&>span]:justify-center"
          />
        </Reveal>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
          <Reveal delay={0.08}>
            <div
              className="relative px-5 pt-2.5 pb-6"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div
                aria-hidden
                className="absolute top-6 right-[46px] bottom-0.5 left-[30px] -rotate-4 rounded-[22px] border border-white/[0.08] bg-white/[0.06]"
              />
              <div
                aria-hidden
                className="absolute top-3.5 right-[26px] -bottom-0.5 left-[22px] rotate-[2.4deg] rounded-[22px] border border-white/[0.12] bg-white/[0.10]"
              />

              <div ref={card} className="relative">
                <figure
                  className={cn(
                    "text-foreground relative block rounded-[22px] bg-white px-7.5 py-7 shadow-[0_44px_90px_rgba(0,0,0,0.45)]",
                    "[transition:opacity_.2s_ease,translate_.34s_cubic-bezier(.16,1,.3,1),scale_.34s_cubic-bezier(.16,1,.3,1),rotate_.34s_cubic-bezier(.16,1,.3,1)]",
                    swapping
                      ? "translate-y-4 scale-[0.97] -rotate-[1.2deg] opacity-0"
                      : "translate-y-0 scale-100 rotate-0 opacity-100 hover:-translate-y-1 hover:-rotate-[0.6deg]",
                  )}
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 24 40"
                    className="absolute -top-3.5 right-6.5 h-[42px] w-6.5 rotate-[24deg] text-[#c3c7bd]"
                    fill="none"
                  >
                    <path
                      d="M17 11v18a5 5 0 0 1-10 0V9a3.2 3.2 0 0 1 6.4 0v18a1.4 1.4 0 0 1-2.8 0V12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>

                  <figcaption className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid size-11.5 shrink-0 place-items-center rounded-full font-mono text-sm font-semibold",
                        AVATARS[shown],
                      )}
                    >
                      {current.initials}
                    </span>
                    <span className="min-w-0 leading-[1.35]">
                      <span className="flex items-center gap-1.25 whitespace-nowrap">
                        <span className="text-[15.5px] font-semibold">
                          {current.name}
                        </span>
                        <svg
                          aria-hidden
                          viewBox="0 0 22 22"
                          className="size-4 shrink-0"
                          fill="none"
                        >
                          <path
                            d="M11 1.5l2.3 1.7 2.8-.3 1 2.7 2.4 1.5-.9 2.7.9 2.7-2.4 1.5-1 2.7-2.8-.3L11 20.5l-2.3-1.7-2.8.3-1-2.7L2.5 15l.9-2.7-.9-2.7 2.4-1.5 1-2.7 2.8.3L11 1.5z"
                            fill="#2fb457"
                          />
                          <path
                            d="m7.6 11 2.2 2.2 4.6-4.8"
                            stroke="#fff"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="block text-[13px] text-[#6d736a]">
                        {current.handle}
                      </span>
                    </span>
                  </figcaption>

                  <blockquote className="mt-4.5 text-[19px] leading-[1.55] font-medium tracking-[-0.01em] text-[#1b1f24]">
                    “{current.quote}”
                  </blockquote>
                  <p className="mt-4 border-t border-[rgba(20,23,26,0.07)] pt-3.75 text-[13px] text-[#8a8f86]">
                    {current.role}
                  </p>
                </figure>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <h3 className="font-display text-2xl font-semibold tracking-[-0.02em]">
              {testimonials.listTitle}
            </h3>
            <p className="mb-4.5 text-[13px] text-[#8f968e]">
              {testimonials.listBody}
            </p>

            <div className="flex flex-col gap-2">
              {testimonials.items.map((item, i) => (
                <Button
                  variant="bare"
                  size="none"
                  key={item.name}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={active === i}
                  className={cn(
                    "focus-visible:ring-brand/50 flex cursor-pointer items-center gap-3.25 rounded-[14px] border px-3.75 py-3.25 text-left transition-all duration-250 hover:translate-x-1.25 hover:border-[rgba(47,232,92,0.45)] focus-visible:ring-2 focus-visible:outline-none",
                    active === i
                      ? "border-[rgba(47,232,92,0.35)] bg-[rgba(47,232,92,0.10)]"
                      : "border-white/[0.08] bg-transparent",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full font-mono text-[13px] font-semibold",
                      AVATARS[i],
                    )}
                  >
                    {item.initials}
                  </span>
                  <span className="flex-1 leading-[1.3]">
                    <span className="block text-[14.5px] font-semibold">
                      {item.name}
                    </span>
                    <span className="block text-[12.5px] text-[#8f968e]">
                      {item.role}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "bg-brand size-1.75 rounded-full transition-opacity duration-250",
                      active === i ? "opacity-100" : "opacity-0",
                    )}
                  />
                </Button>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
