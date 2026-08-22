import { AmbientField } from "@/components/common/ambient-field";
import { CountUp } from "@/components/common/count-up";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { outcomes } from "@/lib/content/home";

export function OutcomesSection() {
  return (
    <section className="marketing-section relative isolate overflow-hidden text-[#f2f3ed] [background:radial-gradient(ellipse_62%_48%_at_16%_0%,rgba(16,185,129,0.20),transparent_68%),radial-gradient(ellipse_54%_46%_at_88%_14%,rgba(5,150,105,0.20),transparent_70%),linear-gradient(180deg,#101419_0%,#090c10_100%)]">
      <AmbientField
        variant="mint"
        className="ambient-dark opacity-70 mix-blend-screen"
      />

      <div className="marketing-container relative z-1">
        <Reveal>
          <SectionHeading
            eyebrow={outcomes.eyebrow}
            title={outcomes.title}
            className="dark-heading"
          />
          <p className="marketing-section-copy marketing-section-copy--dark mt-4">
            {outcomes.body}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {outcomes.stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.09} className="h-full">
              <article className="h-full rounded-[18px] border border-white/10 bg-white/[0.055] p-6.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-1.75 hover:border-[rgba(47,232,92,0.5)] hover:shadow-[0_26px_60px_-24px_rgba(47,232,92,0.35),inset_0_1px_0_rgba(255,255,255,0.10)]">
                <div className="font-display text-brand text-[clamp(44px,4.6vw,62px)] leading-none font-bold tracking-[-0.045em]">
                  <CountUp
                    value={stat.value}
                    decimals={"decimals" in stat ? stat.decimals : 0}
                    suffix={"suffix" in stat ? stat.suffix : ""}
                  />
                  {"unit" in stat ? (
                    <span className="font-body ml-1.5 text-xl font-medium text-[#8f968e]">
                      {stat.unit}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3.5 text-[14.5px] leading-[1.5] text-[#c5c8bd]">
                  {stat.body}
                </p>
                <p className="mt-5 font-mono text-[10.5px] tracking-[0.14em] text-[#737a72] uppercase">
                  {stat.label}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
