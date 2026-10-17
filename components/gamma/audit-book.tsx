import { CalendlyEmbed } from "@/components/common/calendly-embed";
import { audit } from "@/lib/content/audit";
import { site } from "@/lib/content/site";

const { book } = audit;

export function AuditBook() {
  return (
    <section id="book" className="bg-ground py-[clamp(60px,6vw,92px)]">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <div className="flex flex-col items-center text-center">
          <p className="t-eyebrow text-dim flex items-center gap-3">
            <span aria-hidden className="bg-line-strong h-px w-8" />
            {book.eyebrow}
            <span aria-hidden className="bg-line-strong h-px w-8" />
          </p>

          <h2 className="font-display mt-6 text-[clamp(32px,4.4vw,56px)] leading-[0.98] font-bold tracking-[-0.045em] uppercase">
            <span className="text-ink">{book.heading.one} </span>
            <span className="text-green-ink">{book.heading.two}</span>
          </h2>

          <p className="text-ink-soft mt-5 max-w-[56ch] text-[17px] leading-[1.6] text-pretty">
            {book.lead}
          </p>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {book.assurances.map((line) => (
              <li
                key={line}
                className="text-ink flex items-center gap-2.5 text-[14px] font-medium"
              >
                <span
                  aria-hidden
                  className="text-green-ink grid size-[18px] shrink-0 place-items-center rounded-full bg-[rgba(13,119,40,0.1)] text-[11px] leading-none"
                >
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* Gradient hairline so the calendar reads as the page's destination. */}
        <div className="mt-[clamp(40px,4.4vw,64px)] rounded-[16px] bg-[linear-gradient(180deg,rgba(13,119,40,0.3),rgba(20,23,26,0.07)_55%,rgba(20,23,26,0.05))] p-px shadow-[0_1px_2px_rgba(20,23,26,0.05),0_40px_90px_-56px_rgba(13,119,40,0.55)]">
          <div className="overflow-hidden rounded-[15px] bg-white">
            <CalendlyEmbed url={site.calendly} />
          </div>
        </div>

        <p className="t-meta text-dim mt-6 text-center">
          {book.fallback}{" "}
          <a
            href={`mailto:${site.email}`}
            className="text-ink hover:text-green-ink font-medium underline underline-offset-4 transition-colors duration-200"
          >
            {site.email}
          </a>
        </p>
      </div>
    </section>
  );
}
