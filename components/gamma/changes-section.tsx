import { SectionHead } from "@/components/gamma/section-head";
import { changes } from "@/lib/gamma-content";
import { cardDark } from "@/lib/gamma-ui";
import { cn } from "@/lib/utils";

const BARS = [4, 5, 7, 9, 12, 16, 20, 25, 31, 37, 43, 48];

/** Rising bars for the hours tile. */
function Spark() {
  return (
    <svg
      viewBox="0 0 154 52"
      aria-hidden
      className="text-brand hidden h-16 w-[186px] shrink-0 sm:block"
    >
      {BARS.map((h, i) => (
        <rect
          key={i}
          x={i * 13}
          y={52 - h}
          width="5"
          height={h}
          rx="2.5"
          fill="currentColor"
          opacity={0.35 + (i / (BARS.length - 1)) * 0.65}
        />
      ))}
    </svg>
  );
}

/** Arrow-up-right badge for the conversion tile. */
function Rise() {
  return (
    <span
      aria-hidden
      className="bg-brand text-ink grid size-16 shrink-0 place-items-center rounded-full"
    >
      <svg viewBox="0 0 20 20" className="size-[20px]">
        <path
          d="M5.5 14.5 14.5 5.5M7.5 5.5h7v7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

const ACCENT: Record<string, React.ReactNode> = {
  trend: <Spark />,
  conversion: <Rise />,
};

export function ChangesSection() {
  const [trend, retention, conversion] = changes.tiles;

  const tile = (item: (typeof changes.tiles)[number]) => (
    <article
      key={item.id}
      className={cn(
        cardDark,
        "flex items-center justify-between gap-6 overflow-hidden p-[clamp(24px,2.6vw,34px)]",
      )}
    >
      <div>
        <p className="t-eyebrow text-dim-dark">{item.label}</p>
        <p className="t-stat text-dark-head mt-4">{item.stat}</p>
        <p className="t-meta text-dim-dark mt-4 max-w-[24ch] leading-[1.5]">
          {item.note}
        </p>
      </div>
      {ACCENT[item.id]}
    </article>
  );

  return (
    <section className="bg-dark py-[clamp(60px,6vw,92px)]">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <SectionHead
          tone="dark"
          eyebrow={changes.eyebrow}
          one={changes.heading.one}
          two={changes.heading.two}
          lead={changes.lead}
        />

        <div className="mt-[clamp(40px,4.4vw,64px)] grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.62fr)]">
          <article className="bg-ground relative flex flex-col overflow-hidden rounded-[14px] p-[clamp(26px,3vw,40px)]">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(20,23,26,0.045)_0_1px,transparent_1px_10px)]"
            />

            <span className="text-green-ink t-eyebrow relative w-fit rounded-full bg-[rgba(13,119,40,0.1)] px-3 py-[6px]">
              {changes.feature.pill}
            </span>

            <p className="font-display text-ink relative mt-[clamp(36px,4.2vw,64px)] text-[clamp(56px,7vw,104px)] leading-[0.85] font-bold tracking-[-0.05em] tabular-nums">
              {changes.feature.stat}
            </p>

            <p className="t-body text-ink-soft relative mt-auto max-w-[32ch] pt-[clamp(24px,3vw,40px)] text-pretty">
              {changes.feature.body}
            </p>
          </article>

          <div className="grid gap-4 sm:grid-rows-[1.02fr_1fr]">
            {tile(trend)}
            <div className="grid gap-4 sm:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
              {tile(retention)}
              {tile(conversion)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
