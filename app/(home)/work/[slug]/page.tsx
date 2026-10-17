import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import {
  getNextCase,
  getPublishedCase,
  getPublishedCases,
} from "@/data/case-studies";
import { caseLabels, type CaseStudy } from "@/lib/content/cases";
import { site } from "@/lib/content/site";

// A case study written in the console gets its page without a deploy, so
// unknown slugs are rendered on demand rather than 404ed.
export const dynamicParams = true;
export const revalidate = 300;

export async function generateStaticParams() {
  const items = await getPublishedCases();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = await getPublishedCase(slug);
  if (!study) return {};

  return {
    title: `${study.title} · ${site.name}`,
    description: study.body,
    openGraph: {
      title: study.title,
      description: study.body,
      images: [study.image],
    },
  };
}

/** The eyebrow rail every section below the hero opens with. */
function SectionLabel({
  children,
  dark,
}: {
  children: string;
  dark?: boolean;
}) {
  return (
    <p
      className={
        dark
          ? "t-eyebrow text-dim-dark flex items-center gap-3"
          : "t-eyebrow text-dim flex items-center gap-3"
      }
    >
      <span
        aria-hidden
        className={`h-px w-8 ${dark ? "bg-dark-line-strong" : "bg-line-strong"}`}
      />
      {children}
    </p>
  );
}

function Hero({ study }: { study: CaseStudy }) {
  return (
    <section
      id="hero"
      className="bg-dark relative isolate flex flex-col overflow-hidden"
    >
      {/* Same rays and grid as the index hero, so arriving on a case study
          feels like the next room rather than a different building. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "conic-gradient(from 16deg at -8% -16%, transparent 0deg, rgba(47,232,92,0.20) 7deg, transparent 16deg, transparent 24deg, rgba(47,232,92,0.28) 31deg, transparent 40deg, transparent 49deg, rgba(47,232,92,0.14) 56deg, transparent 65deg, transparent 74deg, rgba(47,232,92,0.18) 81deg, transparent 90deg)",
          filter: "blur(26px)",
          maskImage:
            "radial-gradient(125% 115% at 0% 0%, #000 0%, rgba(0,0,0,0.5) 44%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(125% 115% at 0% 0%, #000 0%, rgba(0,0,0,0.5) 44%, transparent 80%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.55]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(236,236,228,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(236,236,228,0.028) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(80% 74% at 50% 42%, #000 0%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(80% 74% at 50% 42%, #000 0%, transparent 78%)",
        }}
      />

      {/* Clears the fixed StickyNav, which is dark while this hero is behind it. */}
      <div aria-hidden className="h-[72px] shrink-0" />

      <div className="mx-auto w-full max-w-[1280px] px-6 pt-[clamp(28px,3.4vw,48px)] pb-[clamp(40px,4.6vw,68px)]">
        <Link
          href="/work"
          className="text-dim-dark hover:text-dark-head t-eyebrow inline-flex items-center gap-2 transition-colors duration-200"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          {caseLabels.back}
        </Link>

        <p className="t-eyebrow text-brand mt-[clamp(26px,3vw,40px)]">
          {study.category}
        </p>

        <div
          className={
            study.heroImage
              ? "grid items-center gap-x-[clamp(40px,5vw,88px)] gap-y-10 lg:grid-cols-[1.1fr_0.9fr]"
              : ""
          }
        >
          <h1
            className={`font-display text-dark-head mt-5 leading-[0.98] font-bold tracking-[-0.045em] text-balance uppercase ${
              study.heroImage
                ? "text-[clamp(32px,4.2vw,54px)]"
                : "max-w-[22ch] text-[clamp(32px,5vw,66px)]"
            }`}
          >
            {study.title}
          </h1>

          {study.heroImage ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[18px] border border-white/[0.09]">
              <Image
                src={study.heroImage}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 540px, 92vw"
                className="object-cover object-top"
              />
            </div>
          ) : null}
        </div>

        {study.stats.length ? (
          <dl className="mt-[clamp(34px,4vw,56px)] grid gap-x-10 gap-y-8 border-t border-white/[0.09] pt-[clamp(26px,3vw,40px)] sm:grid-cols-3">
            {study.stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="font-display text-brand block text-[clamp(30px,3.6vw,46px)] leading-none font-bold tracking-[-0.04em]">
                    {stat.value}
                  </span>
                  <span className="text-dim-dark mt-3 block max-w-[26ch] text-[13.5px] leading-[1.5]">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}

function About({ study }: { study: CaseStudy }) {
  if (!study.about) return null;

  const meta = [
    { label: caseLabels.industry, value: study.sector },
    { label: caseLabels.location, value: study.region },
    { label: caseLabels.builtBy, value: site.name },
  ];

  return (
    <section className="bg-ground">
      <div className="mx-auto grid w-full max-w-[1280px] gap-x-[clamp(40px,5vw,96px)] gap-y-10 px-6 py-[clamp(52px,5.6vw,88px)] lg:grid-cols-[1.45fr_1fr]">
        <div>
          <SectionLabel>{caseLabels.about}</SectionLabel>
          <p className="text-ink mt-6 max-w-[62ch] text-[clamp(16.5px,1.5vw,19px)] leading-[1.65] text-pretty">
            {study.about}
          </p>
        </div>

        <dl className="border-line divide-line grid divide-y self-start rounded-[16px] border">
          {meta.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-6 px-5 py-4"
            >
              <dt className="t-eyebrow text-dim">{row.label}</dt>
              <dd className="text-ink text-right text-[14.5px] font-medium">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Leak({ study }: { study: CaseStudy }) {
  if (!study.leak) return null;

  return (
    <section className="bg-ground">
      <div className="mx-auto w-full max-w-[1280px] px-6 pb-[clamp(52px,5.6vw,88px)]">
        <div className="border-line border-t pt-[clamp(40px,4.4vw,68px)]">
          <SectionLabel>{caseLabels.leak}</SectionLabel>

          <h2 className="font-display text-ink mt-6 max-w-[24ch] text-[clamp(24px,3.1vw,40px)] leading-[1.05] font-bold tracking-[-0.04em] text-balance uppercase">
            {study.leak.heading}
          </h2>

          <div className="mt-[clamp(26px,3vw,40px)] grid gap-6 md:grid-cols-2 md:gap-x-[clamp(40px,4.4vw,80px)]">
            {study.leak.body.map((para) => (
              <p
                key={para.slice(0, 40)}
                className="text-ink-soft text-[16px] leading-[1.7] text-pretty"
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Built({ study }: { study: CaseStudy }) {
  if (!study.built) return null;

  return (
    <section className="bg-dark relative isolate overflow-hidden">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 -z-10 size-[620px] rounded-full bg-[radial-gradient(circle,rgba(47,232,92,0.13),transparent_68%)]"
      />

      <div className="mx-auto w-full max-w-[1280px] px-6 py-[clamp(56px,6vw,96px)]">
        <SectionLabel dark>{caseLabels.built}</SectionLabel>

        <h2 className="font-display text-dark-head mt-6 max-w-[24ch] text-[clamp(24px,3.1vw,40px)] leading-[1.05] font-bold tracking-[-0.04em] text-balance uppercase">
          {study.built.heading}
        </h2>

        <ul className="mt-[clamp(34px,4vw,58px)] grid gap-px overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.08] md:grid-cols-2">
          {study.built.items.map((item, i) => (
            <li
              key={item.label}
              className="bg-dark flex flex-col gap-2.5 p-[clamp(22px,2.3vw,32px)]"
            >
              <span className="text-brand/70 font-mono text-[10.5px] tracking-[0.16em]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-dark-head text-[16.5px] leading-[1.3] font-semibold tracking-[-0.015em]">
                {item.label}
              </h3>
              <p className="text-dim-dark text-[14.5px] leading-[1.62] text-pretty">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Gallery({ study }: { study: CaseStudy }) {
  if (!study.gallery.length) return null;

  return (
    <section className="bg-ground">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-[clamp(52px,5.6vw,88px)]">
        <SectionLabel>{caseLabels.gallery}</SectionLabel>

        <ul className="mt-[clamp(28px,3.2vw,48px)] grid gap-5 md:grid-cols-2">
          {study.gallery.map((shot) => (
            <li key={shot.src}>
              <figure>
                <div className="border-line bg-surface relative aspect-[16/10] overflow-hidden rounded-[16px] border">
                  <Image
                    src={shot.src}
                    alt={shot.caption}
                    fill
                    sizes="(min-width: 768px) 620px, 92vw"
                    className="object-cover object-top"
                  />
                </div>
                <figcaption className="t-meta text-dim mt-3">
                  {shot.caption}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Results({ study }: { study: CaseStudy }) {
  if (!study.results) return null;

  return (
    <section className="bg-ground">
      <div className="mx-auto w-full max-w-[1280px] px-6 pb-[clamp(52px,5.6vw,88px)]">
        <div className="border-line border-t pt-[clamp(40px,4.4vw,68px)]">
          <SectionLabel>{caseLabels.results}</SectionLabel>

          <h2 className="font-display text-ink mt-6 max-w-[24ch] text-[clamp(24px,3.1vw,40px)] leading-[1.05] font-bold tracking-[-0.04em] text-balance uppercase">
            {study.results.heading}
          </h2>

          <p className="text-ink-soft mt-6 max-w-[68ch] text-[16.5px] leading-[1.7] text-pretty">
            {study.results.lead}
          </p>

          <ul className="mt-[clamp(30px,3.4vw,50px)] grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {study.results.points.map((point) => (
              <li
                key={point.text}
                className="border-line bg-surface hover:border-green-ink/30 rounded-[14px] border p-[clamp(20px,2vw,26px)] transition-colors duration-300 ease-out"
              >
                {point.value ? (
                  <p className="font-display text-green-ink text-[clamp(22px,2.4vw,30px)] leading-none font-bold tracking-[-0.035em]">
                    {point.value}
                  </p>
                ) : null}
                <p
                  className={`text-[14.5px] leading-[1.6] text-pretty ${
                    point.value ? "text-ink-soft mt-3" : "text-ink"
                  }`}
                >
                  {point.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Human({ study }: { study: CaseStudy }) {
  if (!study.human) return null;

  return (
    <section className="bg-ground">
      <div className="mx-auto w-full max-w-[1280px] px-6 pb-[clamp(52px,5.6vw,88px)]">
        <div className="bg-gd-panel border-line rounded-[18px] border p-[clamp(26px,3.2vw,52px)]">
          <SectionLabel>{caseLabels.human}</SectionLabel>
          <p className="text-ink mt-6 max-w-[66ch] text-[clamp(16.5px,1.6vw,20px)] leading-[1.6] text-pretty">
            {study.human}
          </p>
        </div>
      </div>
    </section>
  );
}

function Takeaway({ study }: { study: CaseStudy }) {
  if (!study.takeaway) return null;

  return (
    <section className="bg-ground">
      <div className="mx-auto w-full max-w-[1280px] px-6 pb-[clamp(56px,6vw,92px)]">
        <div className="border-line border-t pt-[clamp(40px,4.4vw,68px)]">
          <SectionLabel>{caseLabels.takeaway}</SectionLabel>

          <p className="font-display text-ink mt-7 max-w-[26ch] text-[clamp(26px,3.6vw,48px)] leading-[1.05] font-bold tracking-[-0.04em] text-balance">
            {study.takeaway.line}
          </p>

          <p className="text-ink-soft mt-7 max-w-[62ch] text-[16.5px] leading-[1.7] text-pretty">
            {study.takeaway.body}
          </p>
        </div>
      </div>
    </section>
  );
}

async function Closer({ study }: { study: CaseStudy }) {
  const next = await getNextCase(study.slug);

  return (
    <section className="bg-dark relative isolate overflow-hidden">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[70%]"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 100%, rgba(47,232,92,0.16) 0%, rgba(47,232,92,0.04) 46%, transparent 76%)",
        }}
      />

      <div className="mx-auto w-full max-w-[1280px] px-6 py-[clamp(56px,6vw,96px)]">
        <div className="flex flex-col items-start gap-y-7">
          <h2 className="font-display text-dark-head max-w-[22ch] text-[clamp(24px,3.4vw,44px)] leading-[1.05] font-bold tracking-[-0.04em] text-balance uppercase">
            {study.cta}
          </h2>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href={site.book}
              className="bg-brand text-ink hover:bg-brand-hover focus-visible:outline-dark-head inline-flex h-[54px] items-center rounded-full px-8 text-[15px] font-semibold shadow-[0_18px_44px_-18px_rgba(47,232,92,0.7)] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px]"
            >
              {caseLabels.cta.label}
            </a>
            <p className="t-meta text-dim-dark">{caseLabels.cta.note}</p>
          </div>
        </div>

        {next ? (
          <Link
            href={`/work/${next.slug}`}
            className="group mt-[clamp(44px,5vw,76px)] flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-t border-white/[0.09] pt-[clamp(26px,3vw,40px)]"
          >
            <div className="min-w-0">
              <p className="t-eyebrow text-dim-dark">{caseLabels.next}</p>
              <p className="font-display text-dark-head group-hover:text-brand mt-3 max-w-[30ch] text-[clamp(18px,2vw,26px)] leading-[1.15] font-bold tracking-[-0.035em] text-pretty uppercase transition-colors duration-200">
                {next.title}
              </p>
            </div>
            <span className="bg-brand text-ink grid size-12 shrink-0 place-items-center rounded-full transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1">
              <ArrowRight aria-hidden className="size-4" />
            </span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = await getPublishedCase(slug);
  if (!study) notFound();

  return (
    <main id="top">
      <Hero study={study} />
      <About study={study} />
      <Leak study={study} />
      <Built study={study} />
      <Gallery study={study} />
      <Results study={study} />
      <Human study={study} />
      <Takeaway study={study} />
      <Closer study={study} />
    </main>
  );
}
