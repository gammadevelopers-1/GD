import { leaks } from "@/lib/gamma-content";
import { cn } from "@/lib/utils";

export function LeaksSection() {
  return (
    <section
      id="services"
      className="bg-dark border-dark-line border-y py-[clamp(72px,9vw,128px)]"
    >
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <h2 className="t-h2 text-dark-head text-balance">
          {leaks.heading.one}
          <span className="text-brand block">{leaks.heading.two}</span>
        </h2>
        <p className="t-lead text-dark-body mt-6 max-w-[56ch] text-pretty">
          {leaks.lead}
        </p>

        <ol className="mt-[clamp(40px,5vw,64px)]">
          {leaks.rows.map((row) => (
            <li key={row.num}>
              <a
                href="#services"
                className={cn(
                  "group border-dark-line grid grid-cols-[48px_minmax(0,1fr)] gap-x-[20px] gap-y-[8px] rounded-[12px] border-b pt-[28px] pr-[12px] pb-[28px] pl-0",
                  "transition-[background-color,transform,color] duration-200 ease-[cubic-bezier(.16,1,.3,1)]",
                  "hover:bg-dark-row hover:translate-x-[6px]",
                  "focus-visible:outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
                )}
              >
                <span className="text-dim-dark group-hover:text-dark-head pt-[6px] font-mono text-[11px] tracking-[0.18em] transition-colors duration-200 ease-[cubic-bezier(.16,1,.3,1)]">
                  {row.num}
                </span>

                <span className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-[40px] gap-y-[12px]">
                  <span className="block">
                    <span className="t-eyebrow text-dim-dark group-hover:text-dark-head block transition-colors duration-200 ease-[cubic-bezier(.16,1,.3,1)]">
                      {row.label}
                    </span>
                    <span className="t-h3 text-dark-head mt-3 block leading-[1.2] text-pretty">
                      {row.quote}
                    </span>
                  </span>

                  <span className="flex items-start gap-4">
                    <span
                      aria-hidden
                      className="text-brand text-[20px] leading-[1.4]"
                    >
                      &rarr;
                    </span>
                    <span className="t-body text-dark-body group-hover:text-dark-head max-w-[48ch] text-pretty transition-colors duration-200 ease-[cubic-bezier(.16,1,.3,1)]">
                      {row.where}
                    </span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
