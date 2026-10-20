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
  "font-display text-[clamp(25px,2.9vw,38px)] leading-[1.08] font-bold tracking-[-0.04em] text-balance uppercase";

const panel = "rounded-[20px] p-[clamp(24px,2.8vw,44px)]";

const TONE = {
  light: { text: "text-dim", rule: "bg-line" },
  dark: { text: "text-dim-dark", rule: "bg-dark-line" },
  green: { text: "text-green-ink/75", rule: "bg-green-ink/20" },
} as const;

/**
 * The 64px lattice. One layer, three strengths, so the page has a rhythm
 * instead of a uniform texture: it carries the hero and "what we built",
 * shows faintly under the leak, the results and the closer, and is simply
 * absent from the rest.
 *
 * Alpha is baked in rather than split between a colour and an element
 * opacity, because two multiplied numbers made the real strength impossible
 * to read off the markup.
 */
const GRID = {
  dark: { prominent: "rgba(236,236,228,0.030)", faded: "rgba(236,236,228,0.017)" },
  light: { prominent: "rgba(20,23,26,0.040)", faded: "rgba(20,23,26,0.024)" },
} as const;

/** Fades downward, so a panel does not look like it has a spotlight in it. */
const GRID_MASK =
  "radial-gradient(118% 100% at 50% 0%, #000 0%, rgba(0,0,0,0.55) 58%, transparent 94%)";

function GridLayer({
  level,
  tone = "dark",
  mask = GRID_MASK,
}: {
  level: "prominent" | "faded";
  tone?: keyof typeof GRID;
  mask?: string;
}) {
  const line = GRID[tone][level];
  return (
    // -z-10 keeps it above the container's own background and below the
    // content, which only holds while that container is `isolate`.
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        backgroundSize: "64px 64px",
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}

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
function Prose({ text, dark }: { text: string; dark?: boolean }) {
  // split() with a capturing group puts the captures at the odd indices.
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? (
      // The ink green is unreadable on the dark sections, so those get the
      // bright brand green instead.
      <strong
        key={i}
        className={dark ? "text-brand" : "text-green-ink font-semibold"}
      >
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

/** The three figures. The first carries the brand fill: there is always one
 *  that matters most, and a flat row of three made the reader decide which. */
function HeroStats({
  stats,
  className = "",
  stacked,
}: {
  stats: Story["stats"];
  className?: string;
  /** Beside the image the cards are wide and short, so the figure and its
   *  label share a line rather than leaving the right half of each empty. */
  stacked?: boolean;
}) {
  if (!stats.length) return null;

  return (
    <dl className={`grid gap-3 ${className}`}>
      {stats.map((stat, i) => {
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
            <dd
              className={
                stacked
                  ? "flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1.5 lg:flex-nowrap"
                  : ""
              }
            >
              <span
                className={`font-display block text-[clamp(26px,2.8vw,38px)] leading-none font-bold tracking-[-0.04em] ${
                  lead ? "text-ink" : "text-brand"
                }`}
              >
                {stat.value}
              </span>
              <span
                className={`block text-[13.5px] leading-[1.5] ${
                  stacked ? "lg:max-w-[20ch] lg:text-right" : "mt-2.5"
                } ${lead ? "text-ink/70" : "text-dim-dark"}`}
              >
                {stat.label}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

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
      {/* The hero carries it strongest. Its own mask, centred rather than
          top-down, because there is no panel edge here to fade against. */}
      <GridLayer
        level="prominent"
        mask="radial-gradient(94% 88% at 50% 44%, #000 0%, rgba(0,0,0,0.62) 56%, transparent 90%)"
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

        {/* Full width, so the headline can actually be a headline. Beside
            the image it was boxed into half a row, which capped the type at
            a size that left the column empty above and below it. */}
        <h1
          className={`font-display text-dark-head mt-[clamp(14px,1.6vw,22px)] font-bold tracking-[-0.045em] uppercase ${
            study.heroLines?.length
              ? // Each line sets its own size, so the element must not.
                "leading-[0.96]"
              : "max-w-[38ch] text-[clamp(32px,5vw,66px)] leading-[0.98] text-balance"
          }`}
        >
          {study.heroLines?.length
            ? // Set line by line, because where it breaks and which words
              // carry the green is a decision about this headline, not
              // something a measure can be trusted to find.
              study.heroLines.map((line) => (
                <span
                  key={line.text}
                  className={
                    line.small
                      ? "text-dim-dark mb-[clamp(8px,1vw,14px)] block text-[clamp(16px,1.8vw,24px)] font-medium tracking-[-0.01em] normal-case"
                      : "block text-[clamp(34px,5.4vw,74px)]"
                  }
                >
                  <Prose text={line.text} dark />
                </span>
              ))
            : study.title}
        </h1>

        {study.heroImage ? (
          // Image and figures share the row under the headline. The image
          // keeps its width this way, and the stats fill the column beside
          // it instead of the headline leaving one empty.
          <div className="mt-[clamp(28px,3.2vw,46px)] grid items-center gap-[clamp(20px,2.4vw,40px)] lg:grid-cols-[1.5fr_1fr]">
            {/* 16:9, the shape these compositions are cropped to. A 4:3 box
                left the artwork swimming in its own dark padding. */}
            <div className="relative aspect-video w-full overflow-hidden rounded-[18px] border border-white/[0.09]">
              <Image
                src={study.heroImage}
                alt=""
                fill
                // The hero image is the LCP element here. `priority` is
                // deprecated in Next 16, and these two say what it meant.
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1024px) 740px, 92vw"
                className="object-cover"
              />
            </div>

            <HeroStats
              stats={study.stats}
              stacked
              className="sm:grid-cols-3 lg:grid-cols-1"
            />
          </div>
        ) : (
          <HeroStats
            stats={study.stats}
            className="mt-[clamp(34px,4vw,56px)] sm:grid-cols-3"
          />
        )}
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
      {/* A panel rather than loose prose on the page background, and the
          paragraphs set as numbered points: this is the section a reader
          skims, and a wall of four paragraphs is what they skip. */}
      <div
        className={`bg-surface border-line relative isolate overflow-hidden border ${panel}`}
      >
        <GridLayer level="faded" tone="light" />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-28 -right-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(13,119,40,0.08),transparent_68%)]"
        />

        <div className="relative">
          <SectionLabel>{labels.leak}</SectionLabel>

          <h2 className={`${heading} text-ink mt-6`}>{study.leak.heading}</h2>

          {study.leak.image ? (
            <div className="bg-ground relative mt-[clamp(22px,2.4vw,34px)] aspect-[21/9] w-full overflow-hidden rounded-[16px]">
              <Image
                src={study.leak.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 900px, 92vw"
                className="object-cover"
              />
            </div>
          ) : null}

          {lead ? (
            <p className="text-ink mt-[clamp(22px,2.4vw,32px)] text-[clamp(17px,1.7vw,21px)] leading-[1.6] text-pretty">
              <Prose text={lead} />
            </p>
          ) : null}

          {rest.length ? (
            <ol className="mt-[clamp(22px,2.4vw,32px)] grid gap-3 md:grid-cols-2">
              {rest.map((para, i) => (
                <li
                  key={para.slice(0, 40)}
                  className="border-line-soft bg-ground rounded-[14px] border p-[clamp(18px,1.9vw,24px)]"
                >
                  <span className="text-green-ink border-green-ink/20 bg-green-tint/60 mb-3 grid size-7 place-items-center rounded-full border font-mono text-[10.5px] tracking-[0.08em]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-ink-soft text-[15.5px] leading-[1.68] text-pretty">
                    <Prose text={para} />
                  </p>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </div>
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
        <GridLayer level="prominent" />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-24 -z-10 size-[460px] rounded-full bg-[radial-gradient(circle,rgba(47,232,92,0.16),transparent_68%)]"
        />

        <SectionLabel tone="dark">{labels.built}</SectionLabel>

        {/* With a banner the heading takes the left of the row and the
            picture the right, which keeps the section from opening with two
            full-width blocks stacked on each other. */}
        {study.built.image ? (
          <div className="mt-[clamp(18px,2vw,30px)] grid items-center gap-x-[clamp(28px,3.2vw,56px)] gap-y-7 lg:grid-cols-[0.82fr_1.18fr]">
            <h2 className={`${heading} text-dark-head`}>
              {study.built.heading}
            </h2>

            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-[16px] border border-white/[0.09]">
              <Image
                src={study.built.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 660px, 92vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : (
          <h2 className={`${heading} text-dark-head mt-6`}>
            {study.built.heading}
          </h2>
        )}

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
    <section id="results" className={`relative isolate ${block}`}>
      {/* No panel here, so the lattice sits straight on the page and gives
          the run of result tiles something to stand on. */}
      <GridLayer
        level="faded"
        tone="light"
        mask="radial-gradient(110% 100% at 50% 50%, #000 0%, rgba(0,0,0,0.5) 62%, transparent 95%)"
      />
      <SectionLabel>{labels.results}</SectionLabel>

      <h2 className={`${heading} text-ink mt-6`}>{study.results.heading}</h2>

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
        {study.humanImage ? (
          // Copy left, picture right. The paragraph alone is short, so full
          // width it sat in a band of empty panel.
          <div className="grid items-center gap-x-[clamp(28px,3.2vw,56px)] gap-y-7 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <SectionLabel>{labels.human}</SectionLabel>
              <p className="text-ink mt-6 text-[clamp(16.5px,1.7vw,21px)] leading-[1.6] text-pretty">
                <Prose text={study.human} />
              </p>
            </div>

            <div className="bg-ground relative aspect-video w-full overflow-hidden rounded-[16px]">
              <Image
                src={study.humanImage}
                alt=""
                fill
                sizes="(min-width: 1024px) 600px, 92vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : (
          <>
            <SectionLabel>{labels.human}</SectionLabel>
            <p className="text-ink mt-6 text-[clamp(16.5px,1.7vw,21px)] leading-[1.6] text-pretty">
              <Prose text={study.human} />
            </p>
          </>
        )}
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
  next?: {
    href: string;
    label: string;
    title: string;
    image: string;
    eyebrow: string;
    body: string;
  };
}) {
  return (
    <>
      <section className="bg-dark relative isolate overflow-hidden">
        {study.ctaImage ? (
          <>
            {/* Full bleed behind the copy. The artwork keeps its left half
                quiet, and the scrim carries that the rest of the way so the
                heading never sits on the bright part of it. */}
            <Image
              src={study.ctaImage}
              alt=""
              fill
              sizes="100vw"
              className="-z-30 object-cover object-center"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-20"
              style={{
                background:
                  "linear-gradient(to right, #16181c 0%, rgba(22,24,28,0.94) 34%, rgba(22,24,28,0.72) 56%, rgba(22,24,28,0.38) 78%, rgba(22,24,28,0.22) 100%)",
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-20"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(22,24,28,0.75) 0%, transparent 22%, transparent 78%, rgba(22,24,28,0.75) 100%)",
              }}
            />
          </>
        ) : (
          <>
            <GridLayer level="faded" />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[70%]"
              style={{
                background:
                  "radial-gradient(60% 100% at 50% 100%, rgba(47,232,92,0.16) 0%, rgba(47,232,92,0.04) 46%, transparent 76%)",
              }}
            />
          </>
        )}

        <div className="mx-auto w-full max-w-[1280px] px-6 py-[clamp(64px,7vw,112px)]">
          {/* Half the row, so the copy clears the artwork. The old 26ch cap
              broke the line four times inside a column twice that wide. */}
          <div
            className={`flex flex-col items-start gap-y-7 ${
              study.ctaImage ? "lg:max-w-[56%]" : ""
            }`}
          >
            <h2
              className={`font-display text-dark-head text-[clamp(24px,3.4vw,44px)] leading-[1.05] font-bold tracking-[-0.04em] text-balance uppercase ${
                study.ctaImage
                  ? "[text-shadow:0_2px_24px_rgba(16,18,21,0.85)]"
                  : "max-w-[26ch]"
              }`}
            >
              {study.cta}
            </h2>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <a
                href={site.book}
                className="bg-brand text-ink hover:bg-brand-hover focus-visible:outline-dark-head inline-flex h-[54px] items-center rounded-full px-8 text-[15px] font-semibold shadow-[0_18px_44px_-18px_rgba(47,232,92,0.7)] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px]"
              >
                {labels.cta.label}
              </a>
              <p
                className={`t-meta text-dim-dark ${
                  study.ctaImage
                    ? "[text-shadow:0_1px_12px_rgba(16,18,21,0.95)]"
                    : ""
                }`}
              >
                {labels.cta.note}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Its own band on the light background. Sharing the dark section with
          the call to action, separated by one hairline, read as a footnote
          stuck to the bottom of the pitch rather than the next story. */}
      {next ? (
        <section className="bg-ground">
          <div className="mx-auto w-full max-w-[1280px] px-6 py-[clamp(44px,5vw,76px)]">
            <Link
              href={next.href}
              className="group focus-visible:outline-green-ink block rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-[3px]"
            >
              <article className="border-line bg-surface hover:border-green-ink/30 grid overflow-hidden rounded-[20px] border transition-[border-color,box-shadow,transform] duration-300 ease-out group-hover:-translate-y-[3px] group-hover:shadow-[0_26px_56px_-34px_rgba(20,23,26,0.45)] md:grid-cols-[minmax(0,320px)_1fr]">
                <div className="bg-dark relative aspect-[16/10] w-full overflow-hidden md:aspect-auto md:min-h-[224px]">
                  <Image
                    src={next.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 320px, 92vw"
                    className="object-cover object-center transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]"
                  />
                </div>

                <div className="relative flex flex-col justify-center p-[clamp(24px,2.8vw,44px)]">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-20 -right-16 size-52 rounded-full bg-[radial-gradient(circle,rgba(13,119,40,0.1),transparent_66%)]"
                  />

                  <p className="t-eyebrow text-green-ink relative">
                    {next.label}
                  </p>

                  <h2 className="font-display text-ink relative mt-4 text-[clamp(21px,2.4vw,31px)] leading-[1.12] font-bold tracking-[-0.035em] text-pretty uppercase">
                    {next.title}
                  </h2>

                  <p className="t-meta text-ink-soft relative mt-3 line-clamp-2 leading-[1.55]">
                    {next.body}
                  </p>

                  <span className="t-meta text-ink relative mt-6 inline-flex items-center gap-2 font-semibold">
                    {next.eyebrow}
                    <span
                      aria-hidden
                      className="bg-brand text-ink ml-2 grid size-9 place-items-center rounded-full transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1"
                    >
                      <ArrowRight className="size-4" />
                    </span>
                  </span>
                </div>
              </article>
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
