import { SectionHead } from "@/components/gamma/section-head";
import { RevealOnScroll } from "@/components/gamma/reveal-on-scroll";
import { audit } from "@/lib/content/audit";
import { cardDark, cardLight } from "@/lib/gamma-ui";
import { cn } from "@/lib/utils";

const { scope } = audit;

/** Both columns render from the same pairs, so the rows always line up. */
function Column({ tone }: { tone: "people" | "system" }) {
  const system = tone === "system";

  return (
    <div
      className={cn(
        system ? cardDark : cardLight,
        "flex flex-col overflow-hidden p-[clamp(24px,2.6vw,34px)]",
      )}
    >
      <p className={cn("t-eyebrow", system ? "text-brand" : "text-dim")}>
        {scope.columns[tone]}
      </p>

      <ul className="mt-2 flex flex-col">
        {scope.pairs.map((pair) => (
          <li
            key={pair.people}
            className={cn(
              "flex min-h-[76px] items-center gap-4 border-b py-4 last:border-b-0",
              system ? "border-dark-line" : "border-line",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-[7px] shrink-0 rounded-full",
                system ? "bg-brand" : "bg-line-strong",
              )}
            />
            <span
              className={cn(
                "text-[clamp(16px,1.7vw,20px)] leading-[1.3] tracking-[-0.02em]",
                system
                  ? "text-dark-head font-semibold"
                  : "text-ink-soft font-medium",
              )}
            >
              {pair[tone]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AuditScope() {
  return (
    <section className="bg-ground py-[clamp(60px,6vw,92px)]">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <SectionHead
          eyebrow={scope.eyebrow}
          one={scope.heading.one}
          two={scope.heading.two}
          lead={scope.lead}
        />

        <RevealOnScroll className="mt-[clamp(40px,4.4vw,64px)]">
          <div className="grid gap-4 md:grid-cols-2">
            <Column tone="people" />
            <Column tone="system" />
          </div>
        </RevealOnScroll>

        <p className="font-display mt-[clamp(38px,4vw,58px)] text-center text-[clamp(16px,1.9vw,24px)] leading-[1.35] font-semibold tracking-[-0.035em] text-balance">
          <span className="text-ink">{scope.close.one} </span>
          <span className="text-green-ink">{scope.close.two}</span>
        </p>

        <p className="t-meta text-dim mx-auto mt-4 max-w-[56ch] text-center">
          {scope.note}
        </p>
      </div>
    </section>
  );
}
