import type { CSSProperties } from "react";

import { SectionHead } from "@/components/gamma/section-head";
import { TestimonialCarousel } from "@/components/gamma/testimonial-carousel";
import { testimonials } from "@/lib/gamma-content";

type Item = (typeof testimonials.items)[number];

/** How many go in the rotating panel. The rest fill the wall below it, so no
 *  quote is on screen twice. */
const FEATURED = 3;

function Card({ item, muted }: { item: Item; muted?: boolean }) {
  return (
    <li aria-hidden={muted} className="w-[clamp(298px,26vw,376px)] shrink-0">
      <figure className="group border-line bg-surface hover:border-green-ink/30 relative flex h-full flex-col overflow-hidden rounded-[16px] border p-[clamp(22px,2.1vw,28px)] transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_20px_44px_-30px_rgba(20,23,26,0.45)]">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 size-60 rounded-full bg-[radial-gradient(circle,rgba(13,119,40,0.11),transparent_66%)] opacity-90 transition-opacity duration-300 ease-out group-hover:opacity-100"
        />

        <span
          aria-hidden
          className="text-green-ink/35 relative mb-4 block text-[32px] leading-[0.5] font-bold select-none"
        >
          &ldquo;
        </span>

        <blockquote className="text-ink relative text-[15.5px] leading-[1.62] text-pretty">
          {item.quote}
        </blockquote>

        <figcaption className="border-line-soft relative mt-auto border-t pt-5">
          <p className="font-display text-ink text-[16px] leading-none font-bold tracking-[-0.03em] uppercase">
            {item.company}
          </p>
          <p className="t-eyebrow text-dim mt-2.5">{item.descriptor}</p>
        </figcaption>
      </figure>
    </li>
  );
}

export function TestimonialsSection() {
  const items = testimonials.items.filter((item) => item.quote);
  const featured = items.slice(0, FEATURED);
  const wall = items.slice(FEATURED);

  // A single copy has to out-span the widest viewport or the loop shows a gap.
  const copies = Math.max(2, Math.ceil(7 / Math.max(wall.length, 1)));
  const base = Array.from({ length: copies }, () => wall).flat();

  return (
    <section className="bg-ground pt-[clamp(60px,6vw,92px)] pb-[clamp(56px,5.4vw,84px)]">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <SectionHead
          eyebrow={testimonials.eyebrow}
          one={testimonials.heading.one}
          two={testimonials.heading.two}
          lead={testimonials.lead}
        />

        {featured.length ? (
          <div className="mt-[clamp(36px,4vw,56px)]">
            <TestimonialCarousel items={featured} />
          </div>
        ) : null}
      </div>

      {/* Padded, because the row clips: without it a card's hover lift and the
          shadow under it are sliced off at the top edge. */}
      <div className="wall mt-[clamp(10px,1.2vw,16px)] overflow-hidden py-4">
        <ul
          style={{ "--wall-duration": "74s" } as CSSProperties}
          className="wall-track flex w-max items-stretch gap-5 pr-5"
        >
          {/* Twice over, and the second half is hidden from assistive tech:
              the same quotes, not sixteen of them. Both halves must measure
              the same or the -50% loop lands off its own seam. */}
          {[...base, ...base].map((item, i) => (
            <Card
              key={`${item.company}-${i}`}
              item={item}
              muted={i >= base.length}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
