"use client";

import { useEffect, useState } from "react";

import { SectionHead } from "@/components/gamma/section-head";
import { cardLight } from "@/lib/gamma-ui";
import { handled } from "@/lib/gamma-content";
import { cn } from "@/lib/utils";

type HandledState = "live" | "loading" | "empty";

type FeedRow = {
  id: number;
  label: string;
  result: string;
};

const SEED: FeedRow[] = handled.events.slice(0, 3).map((event, index) => ({
  id: index,
  label: event.label,
  result: event.result,
}));

const SKELETONS = [
  { bars: ["38%", "70%"], delays: ["0ms", "200ms"] },
  { bars: ["30%", "58%"], delays: ["300ms", "500ms"] },
  { bars: ["44%", "64%"], delays: ["600ms", "800ms"] },
];

export function HandledSection({ state = "live" }: { state?: HandledState }) {
  const [feed, setFeed] = useState<FeedRow[]>(SEED);

  useEffect(() => {
    if (state !== "live") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let next = SEED.length;
    const timer = window.setInterval(() => {
      const event = handled.events[next % handled.events.length];
      const row: FeedRow = {
        id: next,
        label: event.label,
        result: event.result,
      };
      next += 1;
      setFeed((rows) => [...rows, row].slice(-6));
    }, 2500);

    return () => window.clearInterval(timer);
  }, [state]);

  const count =
    state === "loading"
      ? handled.loadingCount
      : `${state === "empty" ? 0 : feed.length} events`;

  return (
    <section
      aria-labelledby="handled-heading"
      className="bg-ground border-line border-t py-[clamp(72px,9vw,128px)]"
    >
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <SectionHead
          id="handled-heading"
          eyebrow={handled.eyebrow}
          one={handled.heading.one}
          two={handled.heading.two}
          lead={handled.lead}
        />

        <div className="mt-[clamp(32px,4vw,52px)] grid items-start gap-[clamp(32px,4vw,56px)] lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <p className="t-body text-dim max-w-[46ch] text-pretty">
            {handled.body}
          </p>

          <div
            aria-busy={state === "loading"}
            className={cn(cardLight, "px-7 pt-6 pb-2")}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="t-eyebrow text-dim">{handled.panelLabel}</span>
              <span className="t-eyebrow text-dim">{count}</span>
            </div>

            <div
              className={cn(
                "mt-4 flex h-[340px] flex-col overflow-hidden",
                "[mask-image:linear-gradient(to_bottom,transparent,#000_28%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_28%)]",
                state === "empty" ? "justify-center" : "justify-end",
              )}
            >
              {state === "live" &&
                feed.map((row) => (
                  <div
                    key={row.id}
                    className="border-line-soft grid animate-[g-rise_600ms_cubic-bezier(.16,1,.3,1)_both] grid-cols-[8px_1fr] gap-[14px] border-t py-4"
                  >
                    <span
                      aria-hidden
                      className="bg-brand mt-[5px] size-2 rounded-full"
                    />
                    <div>
                      <p className="t-meta text-dim font-mono">{row.label}</p>
                      <p className="t-body text-ink mt-1">{row.result}</p>
                    </div>
                  </div>
                ))}

              {state === "loading" && (
                <>
                  {SKELETONS.map((skeleton) => (
                    <div
                      key={skeleton.bars[0]}
                      className="border-line-soft grid grid-cols-[8px_1fr] gap-[14px] border-t py-4"
                    >
                      <span
                        aria-hidden
                        className="bg-line mt-[5px] size-2 rounded-full"
                      />
                      <div aria-hidden className="flex flex-col gap-[10px]">
                        <span
                          className="bg-line-soft h-[10px] animate-[g-pulse_1600ms_ease-in-out_infinite] rounded-[3px]"
                          style={{
                            width: skeleton.bars[0],
                            animationDelay: skeleton.delays[0],
                          }}
                        />
                        <span
                          className="bg-line-soft h-[12px] animate-[g-pulse_1600ms_ease-in-out_infinite] rounded-[3px]"
                          style={{
                            width: skeleton.bars[1],
                            animationDelay: skeleton.delays[1],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="t-meta text-dim pt-5">{handled.loading}</p>
                </>
              )}

              {state === "empty" && (
                <div className="border-line-soft border-t pt-8 text-center">
                  <h3 className="t-h4 text-ink normal-case">
                    {handled.empty.heading}
                  </h3>
                  <p className="t-body text-ink-soft mx-auto mt-3 max-w-[38ch]">
                    {handled.empty.body}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
