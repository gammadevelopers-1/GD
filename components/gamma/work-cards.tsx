import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { workIndex, type CaseStudy } from "@/lib/content/cases";
import { site } from "@/lib/content/site";
import { work } from "@/lib/gamma-content";

/** Shared by the case cards and the one at the end that asks for a call. */
const shell =
  "group focus-visible:outline-ink block h-full rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-[3px]";

const frame =
  "border-line bg-surface hover:border-green-ink/30 relative flex h-full flex-col overflow-hidden rounded-[16px] border transition-[border-color,box-shadow,transform] duration-300 ease-out group-hover:-translate-y-[3px] group-hover:shadow-[0_22px_48px_-30px_rgba(20,23,26,0.45)]";

export function WorkCards({ items }: { items: readonly CaseStudy[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.slug} className="h-full">
          <Link href={`/work/${item.slug}`} className={shell}>
            <article className={frame}>
              {/* The picture gets the top of the card and the words get a
                  surface of their own, instead of sitting on a scrim that
                  had to be dark enough to bury the image anyway. */}
              <div className="bg-dark relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 46vw, 92vw"
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

                {/* The short vertical rather than the full sector: the long
                    ones wrapped to two lines and knocked the headlines in a
                    row out of alignment with each other. */}
                <p className="t-eyebrow text-green-ink relative truncate">
                  {item.vertical} &middot; {item.region}
                </p>

                <h2 className="font-display text-ink relative mt-3 text-[20px] leading-[1.15] font-bold tracking-[-0.03em] text-pretty">
                  {item.title}
                </h2>

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
        </li>
      ))}

      <li className="h-full">
        <Link href={site.book} className={shell}>
          <article className="border-brand/25 relative flex h-full flex-col overflow-hidden rounded-[16px] border bg-[linear-gradient(160deg,#141a16_0%,#101512_55%,#0c110e_100%)] transition-[border-color,transform] duration-300 ease-out group-hover:-translate-y-[3px] group-hover:border-brand/45">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(82% 60% at 22% 0%, rgba(47,232,92,0.24) 0%, transparent 68%)",
              }}
            />

            <div className="relative flex flex-1 flex-col justify-end p-[clamp(20px,2vw,26px)]">
              <p className="t-eyebrow text-brand">{workIndex.last.label}</p>

              <h2 className="font-display mt-3 text-[20px] leading-[1.15] font-bold tracking-[-0.03em] text-pretty text-white">
                {workIndex.last.heading}
              </h2>

              <p className="t-meta mt-3 leading-[1.55] text-white/65">
                {workIndex.last.body}
              </p>

              <span className="bg-brand text-ink mt-6 grid size-11 place-items-center rounded-full transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1">
                <ArrowRight aria-hidden className="size-4" />
              </span>
            </div>
          </article>
        </Link>
      </li>
    </ul>
  );
}
