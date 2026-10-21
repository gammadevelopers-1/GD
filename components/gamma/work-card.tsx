import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { CaseStudy } from "@/lib/content/cases";
import { work } from "@/lib/gamma-content";

/**
 * One case study card, shared by the grid on /work and the carousel on the
 * home page. They used to be two separate pieces of markup and drifted: the
 * home page kept the old treatment, a full-bleed image with the words on a
 * scrim over it, long after /work moved the picture to the top of the card.
 */
export function WorkCard({
  item,
  sizes,
}: {
  item: CaseStudy;
  /** The grid and the carousel lay these out at different widths. */
  sizes: string;
}) {
  return (
    <Link
      href={`/work/${item.slug}`}
      className="group focus-visible:outline-ink block h-full rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-[3px]"
    >
      <article className="border-line bg-surface hover:border-green-ink/30 relative flex h-full flex-col overflow-hidden rounded-[16px] border transition-[border-color,box-shadow,transform] duration-300 ease-out group-hover:-translate-y-[3px] group-hover:shadow-[0_22px_48px_-30px_rgba(20,23,26,0.45)]">
        {/* The picture gets the top of the card and the words get a surface
            of their own, instead of sitting on a scrim that had to be dark
            enough to bury the image anyway. */}
        <div className="bg-dark relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={item.image}
            alt=""
            fill
            sizes={sizes}
            className="object-cover object-center transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]"
          />

          {item.nda ? (
            <span className="t-eyebrow absolute top-3.5 right-3.5 rounded-full bg-black/55 px-2.5 py-[5px] text-white/85 backdrop-blur-sm">
              {work.nda}
            </span>
          ) : null}
        </div>

        <div className="relative flex flex-1 flex-col p-[clamp(20px,2vw,26px)]">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-16 size-52 rounded-full bg-[radial-gradient(circle,rgba(13,119,40,0.1),transparent_66%)]"
          />

          {/* The short vertical rather than the full sector: the long ones
              wrapped to two lines and knocked the headlines in a row out of
              alignment with each other. */}
          <p className="t-eyebrow text-green-ink relative truncate">
            {item.vertical} &middot; {item.region}
          </p>

          <h3 className="font-display text-ink relative mt-3 text-[20px] leading-[1.15] font-bold tracking-[-0.03em] text-pretty">
            {item.title}
          </h3>

          <p className="t-meta text-ink-soft relative mt-3 line-clamp-2 leading-[1.55]">
            {item.body}
          </p>

          <span className="t-meta text-ink border-line-soft relative mt-auto inline-flex items-center gap-2 border-t pt-5 font-semibold">
            {work.cta}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
            />
          </span>
        </div>
      </article>
    </Link>
  );
}
