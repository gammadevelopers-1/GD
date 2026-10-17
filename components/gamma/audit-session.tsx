import { SectionHead } from "@/components/gamma/section-head";
import { RevealOnScroll } from "@/components/gamma/reveal-on-scroll";
import { audit } from "@/lib/content/audit";
import { cn } from "@/lib/utils";

const { session } = audit;

export function AuditSession() {
  return (
    <section className="bg-dark py-[clamp(60px,6vw,92px)]">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <SectionHead
          tone="dark"
          eyebrow={session.eyebrow}
          one={session.heading.one}
          two={session.heading.two}
          lead={session.lead}
        />

        <RevealOnScroll className="mt-[clamp(48px,5.2vw,76px)]">
          <ol className="grid gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {session.track.map((stop) => {
              const after = "after" in stop && stop.after;

              return (
                <li
                  key={stop.time}
                  className={cn(
                    "relative",
                    after &&
                      "lg:border-dark-line lg:border-l lg:border-dashed lg:pl-6",
                  )}
                >
                  <div className="relative flex h-[9px] items-center">
                    {/* Runs into the gutter so the stops read as one track. */}
                    {!after ? (
                      <span
                        aria-hidden
                        className="bg-dark-line absolute top-1/2 right-[-24px] left-0 hidden h-px lg:block"
                      />
                    ) : null}
                    <span
                      aria-hidden
                      className={cn(
                        "ring-dark relative size-[9px] rounded-full ring-4",
                        after ? "bg-dim-dark" : "bg-brand",
                      )}
                    />
                  </div>

                  <p
                    className={cn(
                      "mt-5 font-mono text-[11px] tracking-[0.16em] uppercase",
                      after ? "text-dim-dark" : "text-brand",
                    )}
                  >
                    {stop.time}
                  </p>

                  <h3 className="t-h4 text-dark-head mt-3">{stop.title}</h3>

                  <p className="t-meta text-dim-dark mt-3 max-w-[34ch] leading-[1.65]">
                    {stop.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </RevealOnScroll>

        <p className="text-dark-body mt-[clamp(44px,4.8vw,68px)] flex items-center gap-3 text-[15px] leading-[1.5]">
          <span
            aria-hidden
            className="bg-brand size-[7px] shrink-0 rounded-full"
          />
          {session.footnote}
        </p>
      </div>
    </section>
  );
}
