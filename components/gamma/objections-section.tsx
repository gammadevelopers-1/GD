"use client";

import { useState } from "react";

import { SectionHead } from "@/components/gamma/section-head";
import { cardDark, cardLight, edgeBar, plateLight } from "@/lib/gamma-ui";
import { objections } from "@/lib/gamma-content";
import { cn } from "@/lib/utils";

export function ObjectionsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      aria-labelledby="objections-heading"
      className="bg-ground py-[clamp(60px,6vw,92px)]"
    >
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <SectionHead
          id="objections-heading"
          eyebrow={objections.eyebrow}
          one={objections.heading.one}
          two={objections.heading.two}
        />

        <div className="mt-[clamp(40px,4.4vw,64px)] grid items-start gap-4 lg:grid-cols-[1.24fr_0.76fr]">
          <div className={cn(cardLight, "overflow-hidden")}>
            {objections.items.map((item, index) => {
              const isOpen = openIndex === index;
              const panelId = `objection-panel-${index}`;

              return (
                <div
                  key={item.q}
                  className={cn(
                    "group border-line relative border-t transition-colors duration-300 ease-out first:border-t-0",
                    isOpen && "bg-[#fcfefc]",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(edgeBar, isOpen && "scale-y-100")}
                  />

                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="focus-visible:outline-ink grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-[clamp(20px,2.2vw,28px)] py-[21px] text-left focus-visible:outline-2 focus-visible:outline-offset-[-3px] sm:grid-cols-[36px_minmax(0,1fr)_auto]"
                    >
                      <span
                        className={cn(
                          "hidden font-mono text-[11px] tracking-[0.16em] transition-colors duration-300 ease-out sm:block",
                          isOpen ? "text-green-ink" : "text-faint",
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span
                        className={cn(
                          "text-[17px] leading-[1.4] font-medium tracking-[-0.015em] transition-colors duration-200 ease-out",
                          isOpen
                            ? "text-ink"
                            : "text-ink group-hover:text-green-ink",
                        )}
                      >
                        {item.q}
                      </span>

                      <span
                        aria-hidden
                        className={cn(
                          plateLight,
                          "size-9 text-[19px] leading-none transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(.16,1,.3,1)]",
                          isOpen &&
                            "border-green-ink/25 rotate-45 bg-[rgba(13,119,40,0.07)]",
                        )}
                      >
                        +
                      </span>
                    </button>
                  </h3>

                  <div
                    id={panelId}
                    hidden={!isOpen}
                    className="animate-[g-rise_300ms_cubic-bezier(.16,1,.3,1)_both] px-[clamp(20px,2.2vw,28px)] pb-7"
                  >
                    <p className="t-body text-ink-soft max-w-[58ch] text-pretty sm:pl-[52px]">
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sticky top-[92px] flex flex-col gap-4">
            <div className={cn(cardDark, "p-[clamp(26px,2.8vw,36px)]")}>
              <p className="t-eyebrow text-brand">{objections.aside.eyebrow}</p>
              <p className="t-h3 text-dark-head mt-5 leading-[1.3] text-pretty">
                {objections.aside.heading}
              </p>
              <p className="t-body text-dim-dark mt-5 text-pretty">
                {objections.aside.body}
              </p>
            </div>

            <a
              href={objections.cta.href}
              className={cn(
                cardLight,
                "group focus-visible:outline-ink flex items-center justify-between gap-4 p-[clamp(22px,2.4vw,30px)] transition-colors duration-300 ease-out hover:border-[rgba(13,119,40,0.28)] focus-visible:outline-2 focus-visible:outline-offset-[3px]",
              )}
            >
              <span>
                <span className="t-eyebrow text-dim block">
                  {objections.cta.eyebrow}
                </span>
                <span className="t-h4 text-ink mt-2 block">
                  {objections.cta.label}
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  plateLight,
                  "size-11 text-[18px] transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1",
                )}
              >
                &rarr;
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
