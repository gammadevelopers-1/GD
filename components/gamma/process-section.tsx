import { RevealOnScroll } from "@/components/gamma/reveal-on-scroll";
import { SectionHead } from "@/components/gamma/section-head";
import { process } from "@/lib/gamma-content";
import { cardLight, edgeBar, plateLight } from "@/lib/gamma-ui";
import { cn } from "@/lib/utils";

export function ProcessSection() {
  return (
    <section className="bg-ground py-[clamp(60px,6vw,92px)]">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <SectionHead
          eyebrow={process.eyebrow}
          one={process.heading.one}
          two={process.heading.two}
          lead={process.lead}
        />

        <RevealOnScroll className="mt-[clamp(40px,4.4vw,64px)]">
          <ol className="grid gap-5 md:grid-cols-3">
            {process.steps.map((step) => {
              const featured = Boolean(step.badge);

              return (
                <li
                  key={step.num}
                  className={cn(
                    cardLight,
                    "group relative flex flex-col overflow-hidden p-[clamp(24px,2.4vw,32px)]",
                    featured &&
                      "border-green-ink/30 bg-[#fcfefc] shadow-[0_1px_2px_rgba(13,119,40,0.08),0_28px_64px_-38px_rgba(13,119,40,0.5)]",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(edgeBar, featured && "w-[3px] scale-y-100")}
                  />

                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={cn(
                        plateLight,
                        "h-14 w-14 font-mono text-[13px] font-semibold tracking-[0.1em]",
                        featured &&
                          "border-green-ink/25 bg-[rgba(13,119,40,0.07)]",
                      )}
                    >
                      {step.num}
                    </span>

                    {step.badge ? (
                      <span className="t-eyebrow text-green-ink rounded-full bg-[rgba(13,119,40,0.09)] px-2.5 py-[5px]">
                        {step.badge}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="t-h4 text-ink mt-6">{step.phase}</h3>
                  <p className="t-eyebrow text-dim mt-[6px]">{step.when}</p>
                  <p className="t-body text-ink-soft mt-4 mb-7 text-pretty">
                    {step.outcome}
                  </p>

                  <ul className="border-line mt-auto flex flex-col gap-2 border-t pt-5">
                    {step.ticks.map((tick) => (
                      <li
                        key={tick}
                        className="t-meta text-ink flex items-start gap-2.5 leading-[1.55]"
                      >
                        <span
                          aria-hidden
                          className="text-green-ink mt-[1px] shrink-0"
                        >
                          ✓
                        </span>
                        {tick}
                      </li>
                    ))}
                  </ul>

                  {step.cta ? (
                    <a
                      href={step.cta.href}
                      className="bg-brand text-ink hover:bg-brand-hover focus-visible:outline-ink mt-6 inline-flex h-[46px] w-full items-center justify-center rounded-full px-5 text-[14px] font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px]"
                    >
                      {step.cta.label}
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </RevealOnScroll>
      </div>
    </section>
  );
}
