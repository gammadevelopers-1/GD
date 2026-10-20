import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import type {
  StoryMetaRow,
  StorySection,
} from "@/components/gamma/story-rail";
import type { CaseStudy } from "@/lib/content/cases";
import { testimonials } from "@/lib/gamma-content";
import { site } from "@/lib/content/site";

/**
 * The layout a long-form story uses: a dark hero, then the story itself in a
 * single column beside a sticky contents rail, then a closer.
 *
 * Everything between the hero and the closer is a plain block — no background,
 * no container of its own — because the page puts them all in one column next
 * to the rail. Sections that want to stand out do it with a panel inside that
 * column rather than by going full-bleed, which the rail would not survive.
 *
 * Case studies and products are the same shape, so they share this rather
 * than keeping two copies of three hundred lines of layout in step.
 */
export type Story = CaseStudy;

/** Labels differ a little between the two: a client had a leak, a product
 *  had a problem. Widened from the literal types the content files produce,
 *  or each set would only fit itself. */
export type StoryLabels = {
  readonly about: string;
  readonly leak: string;
  readonly built: string;
  readonly results: string;
  readonly human: string;
  readonly takeaway: string;
  readonly gallery: string;
  readonly testimonial: string;
  readonly industry: string;
  readonly location: string;
  readonly builtBy: string;
  readonly next: string;
  readonly back: string;
  readonly cta: { readonly label: string; readonly note: string };
};

/* ── shared bits ─────────────────────────────────────────────── */

/** Every block the rail can reach. The clearance stops the fixed nav from
 *  covering the heading when an anchor scrolls to it. */
const block = "scroll-mt-[108px]";

/** Section headings run the full width of the column. They used to be capped
 *  at 24ch inside a 1280px row, which left the right half empty and folded
 *  every heading onto three or four lines. */
const heading =
  "font-display mt-6 text-[clamp(25px,2.9vw,38px)] leading-[1.08] font-bold tracking-[-0.04em] text-balance uppercase";

const panel = "rounded-[20px] p-[clamp(24px,2.8vw,44px)]";

const TONE = {
  light: { text: "text-dim", rule: "bg-line" },
  dark: { text: "text-dim-dark", rule: "bg-dark-line" },
  green: { text: "text-green-ink/75", rule: "bg-green-ink/20" },
} as const;

/** The eyebrow every section opens with. The hairline runs out to the edge of
 *  the column, so the label row fills its width instead of trailing off. */
function SectionLabel({
  children,
  tone = "light",
}: {
  children: string;
  tone?: keyof typeof TONE;
}) {
  return (
    <p className={`t-eyebrow flex items-center gap-4 ${TONE[tone].text}`}>
      <span className="shrink-0">{children}</span>
      <span aria-hidden className={`h-px flex-1 ${TONE[tone].rule}`} />
    </p>
  );
}

/**
 * `**like this**` becomes a green emphasis, so a sentence can carry its own
 * weight without the layout guessing which one matters. The marker is
 * Markdown's, because the CMS editor already knows it.
 */
function Prose({ text }: { text: string }) {
  // split() with a capturing group puts the captures at the odd indices.
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? (
      <strong key={i} className="text-green-ink font-semibold">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

/* ── what the rail needs ─────────────────────────────────────── */

/** The rail may only offer "In their words" when there is a quote to scroll
 *  to, so it and the section resolve it the same way. */
export function storyQuote(study: Story) {
  if (!study.testimonial) return null;
  const quote = testimonials.items.find(
    (item) => item.company === study.testimonial,
  );
  return quote?.quote ? quote : null;
}

/** Sections in the order the page renders them, minus the ones this study has
 *  nothing for. The page and the rail both read this, so the rail can never
 *  list an anchor that is not on the page. */
export function storySections(
  study: Story,
  labels: StoryLabels,
): StorySection[] {
  const all: (StorySection | false)[] = [
    Boolean(storyQuote(study)) && { id: "words", label: labels.testimonial },
    Boolean(study.about) && { id: "about", label: labels.about },
    Boolean(study.leak) && { id: "leak", label: labels.leak },
    Boolean(study.built) && { id: "built", label: labels.built },
    study.gallery.length > 0 && { id: "gallery", label: labels.gallery },
    Boolean(study.results) && { id: "results", label: labels.results },
    Boolean(study.human) && { id: "human", label: labels.human },
    Boolean(study.takeaway) && { id: "takeaway", label: labels.takeaway },
  ];
  return all.filter((item): item is StorySection => item !== false);
}

export function storyMeta(study: Story, labels: StoryLabels): StoryMetaRow[] {
  return [
    { label: labels.industry, value: study.sector },
    { label: study.regionLabel ?? labels.location, value: study.region },
    { label: labels.builtBy, value: site.name },
  ];
}

/* ── the page's reading progress ─────────────────────────────── */

/**
 * The bar under the nav. A scroll timeline drives it from CSS, so it runs on
 * the compositor and the page carries no scroll listener for it — see
 * `.g-scroll-progress` in globals.css.
 */
export function StoryProgress() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-[72px] z-50 h-[3px]"
    >
      <div className="g-scroll-progress bg-brand h-full w-full origin-left scale-x-0 shadow-[0_0_14px_rgba(47,232,92,0.65)]" />
    </div>
  );
}

/* ── the hero ────────────────────────────────────────────────── */

export function StoryHero({
  study,
  labels,
  backHref,
}: {
  study: Story;
  labels: StoryLabels;
  backHref: string;
}) {
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
          href={backHref}
          className="text-dim-dark hover:text-dark-head t-eyebrow inline-flex items-center gap-2 transition-colors duration-200"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          {labels.back}
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
                : "max-w-[38ch] text-[clamp(32px,5vw,66px)]"
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
                // The hero image is the LCP element here. `priority` is
                // deprecated in Next 16, and these two say what it meant.
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1024px) 540px, 92vw"
                className="object-cover object-top"
              />
            </div>
          ) : null}
        </div>

        {/* Cards rather than a bare row, and the first one carries the brand
            fill: there is always one figure that matters most, and a flat row
            of three made the reader decide which. */}
        {study.stats.length ? (
          <dl className="mt-[clamp(34px,4vw,56px)] grid gap-3 sm:grid-cols-3">
            {study.stats.map((stat, i) => {
              const lead = i === 0;
              return (
                <div
                  key={stat.label}
                  className={`rounded-[16px] p-[clamp(20px,2vw,28px)] ${
                    lead
                      ? "bg-brand shadow-[0_22px_52px_-26px_rgba(47,232,92,0.6)]"
                      : "border border-white/[0.1] bg-white/[0.035]"
                  }`}
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span
                      className={`font-display block text-[clamp(28px,3.2vw,42px)] leading-none font-bold tracking-[-0.04em] ${
                        lead ? "text-ink" : "text-brand"
                      }`}
                    >
                      {stat.value}
                    </span>
                    <span
                      className={`mt-3 block text-[13.5px] leading-[1.5] ${
                        lead ? "text-ink/70" : "text-dim-dark"
                      }`}
                    >
                      {stat.label}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : null}
      </div>
    </section>
  );
}

/* ── the story ───────────────────────────────────────────────── */

/**
 * The client's own words, first thing in the column, because a stranger
 * decides whether to keep reading long before they reach the results.
 *
 * Attribution follows the page it sits on. A case study that calls its client
 * "a UAE wills firm" cannot then credit the quote to a company by name on the
 * same screen, so the name is only used where the client agreed to be named.
 */
export function StoryTestimonial({
  study,
  labels,
}: {
  study: Story;
  labels: StoryLabels;
}) {
  const quote = storyQuote(study);
  if (!quote) return null;

  const role = quote.descriptor.split("·")[0]?.trim() || quote.descriptor;
  const credit = study.named
    ? `${quote.company} · ${role}`
    : `${role} · ${study.client}`;

  return (
    <section id="words" className={block}>
      <figure
        className={`border-line bg-surface relative overflow-hidden border ${panel}`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 size-60 rounded-full bg-[radial-gradient(circle,rgba(13,119,40,0.11),transparent_66%)]"
        />

        <div className="relative">
          <SectionLabel>{labels.testimonial}</SectionLabel>
        </div>

        {/* No measure cap. The quote now has a column of its own rather than
            half of a 1280px row, so capping it only re-opened the gap. */}
        <blockquote className="text-ink border-green-ink/35 relative mt-7 border-l-2 pl-[clamp(16px,1.8vw,26px)] text-[clamp(18px,1.85vw,24px)] leading-[1.45] tracking-[-0.015em] text-pretty">
          {quote.quote}
        </blockquote>

        <figcaption className="relative mt-7 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span aria-hidden className="bg-green-ink/50 h-px w-8" />
          <span className="t-eyebrow text-dim">{credit}</span>
        </figcaption>
      </figure>
    </section>
  );
}

export function StoryAbout({
  study,
  labels,
}: {
  study: Story;
  labels: StoryLabels;
}) {
  if (!study.about) return null;

  return (
    <section id="about" className={block}>
      <SectionLabel>{labels.about}</SectionLabel>

      <p className="text-ink mt-6 text-[clamp(16.5px,1.6vw,19.5px)] leading-[1.65] text-pretty">
        <Prose text={study.about} />
      </p>

      {/* The rail carries these on a wide screen. Below it there is no rail,
          so they run as a strip here instead. */}
      <dl className="border-line mt-8 grid gap-x-8 gap-y-5 border-t pt-6 sm:grid-cols-3 lg:hidden">
        {storyMeta(study, labels).map((row) => (
          <div key={row.label}>
            <dt className="t-eyebrow text-dim">{row.label}</dt>
            <dd className="text-ink mt-1.5 text-[14.5px] font-medium">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function StoryLeak({
  study,
  labels,
}: {
  study: Story;
  labels: StoryLabels;
}) {
  if (!study.leak) return null;

  const [lead, ...rest] = study.leak.body;

  return (
    <section id="leak" className={block}>
      <SectionLabel>{labels.leak}</SectionLabel>

      <h2 className={`${heading} text-ink`}>{study.leak.heading}</h2>

      {lead ? (
        <p className="text-ink mt-[clamp(22px,2.4vw,32px)] text-[clamp(17px,1.7vw,21px)] leading-[1.6] text-pretty">
          <Prose text={lead} />
        </p>
      ) : null}

      {/* The rest runs in two columns. One column at this width finished
          halfway across and left the other half blank. */}
      {rest.length ? (
        <div className="mt-7 grid gap-x-[clamp(32px,3.4vw,60px)] gap-y-5 md:grid-cols-2">
          {rest.map((para) => (
            <p
              key={para.slice(0, 40)}
              className="text-ink-soft text-[16px] leading-[1.7] text-pretty"
            >
              <Prose text={para} />
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function StoryBuilt({
  study,
  labels,
}: {
  study: Story;
  labels: StoryLabels;
}) {
  if (!study.built) return null;

  return (
    <section id="built" className={block}>
      <div
        className={`bg-dark relative isolate overflow-hidden ${panel}`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-24 -z-10 size-[460px] rounded-full bg-[radial-gradient(circle,rgba(47,232,92,0.16),transparent_68%)]"
        />

        <SectionLabel tone="dark">{labels.built}</SectionLabel>

        <h2 className={`${heading} text-dark-head`}>{study.built.heading}</h2>

        <ul className="mt-[clamp(26px,3vw,42px)] grid gap-px overflow-hidden rounded-[16px] border border-white/[0.09] bg-white/[0.09] md:grid-cols-2">
          {study.built.items.map((item, i) => (
            <li
              key={item.label}
              className="bg-dark-row flex flex-col gap-2.5 p-[clamp(20px,2.1vw,28px)]"
            >
              <span className="text-brand font-mono text-[10.5px] tracking-[0.16em]">
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

export function StoryGallery({
  study,
  labels,
}: {
  study: Story;
  labels: StoryLabels;
}) {
  if (!study.gallery.length) return null;

  return (
    <section id="gallery" className={block}>
      <SectionLabel>{labels.gallery}</SectionLabel>

      <ul className="mt-[clamp(24px,2.8vw,40px)] grid gap-5 md:grid-cols-2">
        {study.gallery.map((shot) => (
          <li key={shot.src}>
            <figure>
              <div className="border-line bg-surface relative aspect-[16/10] overflow-hidden rounded-[16px] border">
                <Image
                  src={shot.src}
                  alt={shot.caption}
                  fill
                  sizes="(min-width: 1024px) 460px, (min-width: 768px) 46vw, 92vw"
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
    </section>
  );
}

export function StoryResults({
  study,
  labels,
}: {
  study: Story;
  labels: StoryLabels;
}) {
  if (!study.results) return null;

  return (
    <section id="results" className={block}>
      <SectionLabel>{labels.results}</SectionLabel>

      <h2 className={`${heading} text-ink`}>{study.results.heading}</h2>

      <p className="text-ink mt-6 text-[clamp(16.5px,1.65vw,20px)] leading-[1.65] text-pretty">
        <Prose text={study.results.lead} />
      </p>

      <ul className="mt-[clamp(26px,3vw,42px)] grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {study.results.points.map((point, i) => {
          // The strongest figure takes the brand fill, and a point with no
          // figure is a sentence rather than a tile, so it takes the row.
          const lead = i === 0 && Boolean(point.value);
          return (
            <li
              key={point.text}
              className={`rounded-[14px] p-[clamp(18px,1.9vw,24px)] ${
                point.value ? "" : "sm:col-span-2 lg:col-span-3"
              } ${
                lead
                  ? "bg-brand shadow-[0_20px_44px_-26px_rgba(47,232,92,0.55)]"
                  : "border-line bg-surface hover:border-green-ink/35 border transition-colors duration-300 ease-out"
              }`}
            >
              {point.value ? (
                <p
                  className={`font-display text-[clamp(22px,2.4vw,30px)] leading-none font-bold tracking-[-0.035em] ${
                    lead ? "text-ink" : "text-green-ink"
                  }`}
                >
                  {point.value}
                </p>
              ) : null}
              <p
                className={`text-[14.5px] leading-[1.6] text-pretty ${
                  point.value
                    ? `mt-3 ${lead ? "text-ink/75" : "text-ink-soft"}`
                    : "text-ink text-[15.5px] leading-[1.65]"
                }`}
              >
                <Prose text={point.text} />
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function StoryHuman({
  study,
  labels,
}: {
  study: Story;
  labels: StoryLabels;
}) {
  if (!study.human) return null;

  return (
    <section id="human" className={block}>
      <div className={`bg-gd-panel border-line border ${panel}`}>
        <SectionLabel>{labels.human}</SectionLabel>
        <p className="text-ink mt-6 text-[clamp(16.5px,1.7vw,21px)] leading-[1.6] text-pretty">
          <Prose text={study.human} />
        </p>
      </div>
    </section>
  );
}

export function StoryTakeaway({
  study,
  labels,
}: {
  study: Story;
  labels: StoryLabels;
}) {
  if (!study.takeaway) return null;

  return (
    <section id="takeaway" className={block}>
      {/* The one line to remember, so it gets the brand's own tint rather
          than another white card. */}
      <div
        className={`bg-green-tint border-green-ink/15 relative overflow-hidden border ${panel}`}
      >
        <SectionLabel tone="green">{labels.takeaway}</SectionLabel>

        <p className="font-display text-green-ink mt-7 text-[clamp(24px,3.1vw,42px)] leading-[1.08] font-bold tracking-[-0.04em] text-balance">
          {study.takeaway.line}
        </p>

        <p className="text-ink mt-6 text-[clamp(16px,1.6vw,19px)] leading-[1.65] text-pretty">
          <Prose text={study.takeaway.body} />
        </p>
      </div>
    </section>
  );
}

/* ── the closer ──────────────────────────────────────────────── */

export function StoryCloser({
  study,
  labels,
  next,
}: {
  study: Story;
  labels: StoryLabels;
  next?: { href: string; label: string; title: string };
}) {
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
          <h2 className="font-display text-dark-head max-w-[26ch] text-[clamp(24px,3.4vw,44px)] leading-[1.05] font-bold tracking-[-0.04em] text-balance uppercase">
            {study.cta}
          </h2>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href={site.book}
              className="bg-brand text-ink hover:bg-brand-hover focus-visible:outline-dark-head inline-flex h-[54px] items-center rounded-full px-8 text-[15px] font-semibold shadow-[0_18px_44px_-18px_rgba(47,232,92,0.7)] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px]"
            >
              {labels.cta.label}
            </a>
            <p className="t-meta text-dim-dark">{labels.cta.note}</p>
          </div>
        </div>

        {next ? (
          <Link
            href={next.href}
            className="group mt-[clamp(44px,5vw,76px)] flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-t border-white/[0.09] pt-[clamp(26px,3vw,40px)]"
          >
            <div className="min-w-0">
              <p className="t-eyebrow text-dim-dark">{next.label}</p>
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
