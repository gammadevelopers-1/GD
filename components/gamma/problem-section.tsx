import { RevealOnScroll } from "@/components/gamma/reveal-on-scroll";
import { SectionHead } from "@/components/gamma/section-head";
import { problem } from "@/lib/gamma-content";
import { cardLight, edgeBar, plateLight } from "@/lib/gamma-ui";
import { cn } from "@/lib/utils";

type IconName = (typeof problem.buckets)[number]["icon"];

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Abstract UI marks, same language as the hero panels. CSS drives the motion. */
function Glyph({ icon, className }: { icon: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 44 44" aria-hidden className={cn("h-10 w-10", className)}>
      {icon === "transfer" && (
        <g {...stroke}>
          <rect x="1.5" y="11.5" width="15" height="21" rx="3.5" />
          <path d="M5 17.5h8M5 21.5h5.5" opacity="0.45" />
          <rect x="27.5" y="11.5" width="15" height="21" rx="3.5" />
          <path d="M31 17.5h8M31 21.5h5.5" opacity="0.45" />
          <path
            className="problem-flow"
            pathLength={1}
            d="M17.5 22h9"
            strokeWidth={1.6}
          />
          <path d="m24 19.4 2.6 2.6-2.6 2.6" opacity="0.7" />
        </g>
      )}

      {icon === "queue" && (
        <g {...stroke}>
          <rect x="2.5" y="7.5" width="26" height="15" rx="5" />
          <rect x="15.5" y="24.5" width="26" height="12" rx="5" opacity="0.4" />
          <path d="M20 30.5h13" opacity="0.4" />
          <g fill="currentColor" stroke="none">
            <circle className="problem-dot" cx="10" cy="15" r="1.5" />
            <circle
              className="problem-dot problem-dot--2"
              cx="15.5"
              cy="15"
              r="1.5"
            />
            <circle
              className="problem-dot problem-dot--3"
              cx="21"
              cy="15"
              r="1.5"
            />
          </g>
        </g>
      )}

      {icon === "report" && (
        <g {...stroke}>
          <rect x="2.5" y="5.5" width="39" height="33" rx="4" />
          <path d="M2.5 13.5h39" opacity="0.45" />
          <g fill="currentColor" stroke="none">
            <rect
              className="problem-bar"
              x="9"
              y="19"
              width="4.5"
              height="13"
              rx="1.5"
            />
            <rect
              className="problem-bar problem-bar--2"
              x="17.5"
              y="19"
              width="4.5"
              height="13"
              rx="1.5"
            />
            <rect
              className="problem-bar problem-bar--3"
              x="26"
              y="19"
              width="4.5"
              height="13"
              rx="1.5"
            />
          </g>
          <path d="M35 32V19" opacity="0.35" />
        </g>
      )}

      {icon === "clock" && (
        <g {...stroke}>
          <circle cx="22" cy="22" r="15.5" opacity="0.35" />
          <circle
            className="problem-sweep"
            cx="22"
            cy="22"
            r="15.5"
            pathLength={1}
            strokeWidth={1.6}
          />
          <path d="M22 13v9.4l6.4 3.8" />
        </g>
      )}
    </svg>
  );
}

export function ProblemSection() {
  return (
    <section id="problem" className="py-[clamp(60px,6vw,92px)]">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <SectionHead
          eyebrow={problem.eyebrow}
          one={problem.heading.one}
          two={problem.heading.two}
          lead={problem.lead}
        />

        <RevealOnScroll className="mt-[clamp(40px,4.4vw,64px)]">
          <ul className={cn(cardLight, "grid overflow-hidden sm:grid-cols-2")}>
            {problem.buckets.map((bucket, i) => (
              <li
                key={bucket.title}
                className={cn(
                  "group border-line relative grid grid-cols-1 items-start gap-x-[20px] gap-y-4 border-t p-[clamp(22px,2.3vw,30px)] first:border-t-0",
                  "sm:grid-cols-[60px_minmax(0,1fr)] sm:gap-y-0",
                  "sm:odd:border-r sm:[&:nth-child(2)]:border-t-0",
                )}
              >
                <span aria-hidden className={edgeBar} />

                <span className={cn(plateLight, "h-15 w-15")}>
                  <Glyph icon={bucket.icon} />
                </span>

                <div className="sm:pt-[4px]">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="t-h4 text-ink">{bucket.title}</h3>
                    <span className="t-eyebrow text-faint group-hover:text-green-ink shrink-0 transition-colors duration-300 ease-out">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="t-body text-ink-soft mt-[10px] max-w-[42ch] text-pretty">
                    {bucket.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </RevealOnScroll>

        <p className="font-display mt-[clamp(38px,4vw,58px)] text-center text-[clamp(15px,1.7vw,21px)] leading-[1.35] font-semibold tracking-[-0.035em] text-balance">
          <span className="text-ink">{problem.close.one} </span>
          <span className="text-green-ink">{problem.close.two}</span>
        </p>
      </div>
    </section>
  );
}
