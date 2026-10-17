import { RevealOnScroll } from "@/components/gamma/reveal-on-scroll";
import { about } from "@/lib/content/about";

const { practice } = about;

export function AboutPractice() {
  return (
    <section className="bg-ground py-[clamp(60px,6vw,92px)]">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <div className="grid items-start gap-x-[clamp(40px,5vw,96px)] gap-y-[clamp(40px,4.4vw,60px)] lg:grid-cols-[0.82fr_1.18fr]">
          <div className="lg:sticky lg:top-[104px]">
            <p className="t-eyebrow text-dim flex items-center gap-3">
              <span aria-hidden className="bg-line-strong h-px w-8" />
              {practice.eyebrow}
            </p>

            <h2 className="font-display mt-5 text-[clamp(28px,3.5vw,44px)] leading-[0.98] font-bold tracking-[-0.045em] uppercase">
              <span className="text-ink block">{practice.heading.one}</span>
              <span className="text-green-ink block">
                {practice.heading.two}
              </span>
            </h2>

            <p className="text-ink-soft mt-6 max-w-[36ch] text-[16px] leading-[1.6] text-pretty">
              {practice.lead}
            </p>
          </div>

          <RevealOnScroll>
            <ol>
              {practice.beats.map((beat) => (
                <li
                  key={beat.n}
                  className="group border-line grid grid-cols-[46px_minmax(0,1fr)] items-start border-t pt-[clamp(24px,2.8vw,34px)] pb-[clamp(34px,3.6vw,50px)] last:pb-0"
                >
                  <span className="text-faint group-hover:text-green-ink pt-[6px] font-mono text-[11px] tracking-[0.16em] transition-colors duration-300 ease-out">
                    {beat.n}
                  </span>

                  <div>
                    <h3 className="font-display text-ink text-[clamp(19px,2.1vw,26px)] leading-[1.15] font-bold tracking-[-0.035em] uppercase">
                      {beat.title}
                    </h3>
                    <p className="text-ink-soft mt-4 max-w-[58ch] text-[16px] leading-[1.65] text-pretty">
                      {beat.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </RevealOnScroll>
        </div>

        <p className="font-display border-line mt-[clamp(44px,4.8vw,68px)] border-t pt-[clamp(34px,3.6vw,50px)] text-center text-[clamp(17px,2.1vw,26px)] leading-[1.35] font-semibold tracking-[-0.035em] text-balance">
          <span className="text-ink">
            Every system we put into a business is{" "}
          </span>
          <span className="text-green-ink">one we already run ourselves.</span>
        </p>
      </div>
    </section>
  );
}
