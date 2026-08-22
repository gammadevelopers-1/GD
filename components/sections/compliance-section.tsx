import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { compliance } from "@/lib/content/home";

export function ComplianceSection() {
  return (
    <section
      id="compliance"
      className="marketing-section border-border relative scroll-mt-24 overflow-hidden border-t bg-[#e9e8e2]"
    >
      <div className="marketing-container relative z-1">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-15">
          <Reveal>
            <SectionHeading
              eyebrow={compliance.eyebrow}
              title={compliance.title}
            />
            <p className="marketing-section-copy mt-4.5 max-w-[46ch]">
              {compliance.body}
            </p>

           

            <Link
              href="/contact"
              data-button-fill
              className="button-fill-fx marketing-primary-button group/trust mt-5.5 inline-flex h-12 items-center gap-2.25 overflow-hidden rounded-full px-6"
            >
              <span className="button-fill-fx__label inline-flex items-center gap-2.25">
                {compliance.cta}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover/trust:translate-x-1" />
              </span>
            </Link>
          </Reveal>

          <Reveal delay={0.1} stagger className="grid gap-3.5 sm:grid-cols-2">
            {compliance.standards.map((standard) => (
              <article
                key={standard.name}
                className="card-surface card-lift rounded-2xl p-5.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-gd-light-emerald grid size-8.5 shrink-0 place-items-center rounded-[10px] bg-[rgba(47,232,92,0.12)]">
                    <ShieldCheck className="size-4.25" strokeWidth={1.5} />
                  </span>
                  <h3 className="font-mono text-[13.5px] font-semibold">
                    {standard.name}
                  </h3>
                </div>
                <p className="text-muted-foreground mt-2 text-[13px] leading-[1.55]">
                  {standard.body}
                </p>
              </article>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
