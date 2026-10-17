import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/common/reveal";
import { Section } from "@/components/common/section";
import { SectionHeading } from "@/components/common/section-heading";
import { whatWeFix } from "@/lib/content/home";
import { services } from "@/lib/content/services";

export function ServicesSection() {
  return (
    <Section id="services" tone="dark" divide="both" className="scroll-mt-24">
      <Reveal className="max-w-[680px]">
        <SectionHeading
          eyebrow={whatWeFix.eyebrow}
          title={whatWeFix.title}
          className="max-w-none"
        />
        <p className="marketing-section-copy marketing-section-copy--dark mt-4">
          {whatWeFix.body}
        </p>
      </Reveal>

      <div className="mt-14 border-t border-white/10">
        {services.map((service, i) => (
          <Reveal key={service.slug} delay={i * 0.05}>
            <Link
              href={`/services/${service.slug}`}
              className="group/row focus-visible:ring-brand/50 flex items-baseline gap-5 border-b border-white/10 py-7 transition-colors duration-300 hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:outline-none sm:gap-8 sm:py-8"
            >
              <span className="font-mono text-[11px] text-white/30 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>

              <span className="min-w-0 flex-1">
                <span className="font-display t-h3 block">{service.title}</span>
                <span className="text-gd-dark-muted t-body mt-2 block max-w-[58ch]">
                  {service.symptom}
                </span>
              </span>

              <span className="text-brand shrink-0 self-center transition-transform duration-300 group-hover/row:translate-x-1">
                <ArrowUpRight className="size-5" strokeWidth={1.8} />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
