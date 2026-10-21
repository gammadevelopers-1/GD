import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";

import { ObjectionAccordion } from "@/components/common/objection-accordion";
import { PageHero } from "@/components/common/page-hero";
import { Reveal } from "@/components/common/reveal";
import { Section } from "@/components/common/section";
import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import { serviceBySlug, services } from "@/lib/content/services";
import { site } from "@/lib/content/site";
import { pageMeta } from "@/lib/seo";
import { BreadcrumbJsonLd, ServiceJsonLd } from "@/components/common/json-ld";

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) return {};

  return pageMeta({
    title: service.name,
    description: service.title,
    path: `/services/${slug}`,
  });
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) notFound();

  return (
    <main id="top">
      <ServiceJsonLd
        name={service.name}
        description={service.title}
        path={`/services/${slug}`}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: "Home", path: "/" },
          { name: service.name, path: `/services/${slug}` },
        ]}
      />

      <PageHero eyebrow={service.name} title={service.title}>
        <p className="font-display text-gd-light-muted mt-6 max-w-[54ch] text-[clamp(17px,2vw,21px)] leading-[1.4] font-medium tracking-[-0.02em]">
          {service.symptom}
        </p>
      </PageHero>

      <Section tone="light" divide="bottom">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow={service.leak.title}
              title="The gap nobody owns."
              className="max-w-none"
            />
            <p className="marketing-section-copy mt-4">{service.leak.body}</p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="border-border bg-surface rounded-[20px] border p-7">
              <span className="font-mono text-[10.5px] tracking-[0.14em] text-black/40 uppercase">
                {service.math.title}
              </span>
              <ol className="mt-5 flex flex-col gap-3.5">
                {service.math.steps.map((step, i) => (
                  <li
                    key={step}
                    className="text-gd-light-muted flex gap-3 text-[14px] leading-[1.55]"
                  >
                    <span className="font-display text-gd-light-headline shrink-0 tabular-nums">
                      {i + 1}.
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="font-display text-gd-light-headline mt-6 border-t border-black/[0.08] pt-5 text-[18px] leading-[1.35] font-semibold tracking-[-0.025em]">
                {service.math.result}
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section tone="dark" divide="bottom">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow={service.build.title}
              title="What we actually build."
              className="max-w-none"
            />
            <ul className="mt-7 flex flex-col gap-3.5">
              {service.build.points.map((point) => (
                <li
                  key={point}
                  className="text-gd-dark-muted flex items-start gap-3 text-[15px] leading-[1.55]"
                >
                  <span className="text-brand mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-[rgba(47,232,92,0.14)]">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.05] p-7">
              <h3 className="font-display text-[18px] font-semibold tracking-[-0.025em]">
                {service.manual.title}
              </h3>
              <p className="text-gd-dark-muted mt-3 text-[14px] leading-[1.6]">
                {service.manual.body}
              </p>
              <ul className="mt-5 flex flex-col gap-2.5 border-t border-white/10 pt-5">
                {service.manual.points.map((point) => (
                  <li
                    key={point}
                    className="text-gd-dark-muted text-[14px] leading-[1.5]"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section tone="light" divide="bottom">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow="Before you ask" title="Fair questions." />
            {service.source ? (
              <p className="mt-7 max-w-[46ch] text-[13px] leading-[1.6] text-black/45">
                {service.source}
              </p>
            ) : null}
          </Reveal>
          <Reveal delay={0.08}>
            <ObjectionAccordion items={service.objections} />
          </Reveal>
        </div>
      </Section>

      <Section tone="dark" divide="top">
        <Reveal className="flex flex-wrap items-end justify-between gap-8">
          <h2 className="font-display max-w-[18ch] text-[clamp(26px,3.6vw,42px)] leading-[1.05] font-semibold tracking-[-0.04em]">
            See where this is leaking for you.
          </h2>
          <Button asChild variant="marketing" size="marketing-lg">
            <Link href={site.book} data-button-fill>
              <span className="button-fill-fx__label">Book the audit</span>
            </Link>
          </Button>
        </Reveal>
      </Section>
    </main>
  );
}
