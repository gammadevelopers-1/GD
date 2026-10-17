import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { workIndex, type CaseStudy } from "@/lib/content/cases";
import { site } from "@/lib/content/site";
import { work } from "@/lib/gamma-content";

const scrim =
  "absolute inset-0 bg-[linear-gradient(to_top,rgba(16,21,18,0.96)_0%,rgba(16,21,18,0.92)_32%,rgba(16,21,18,0.72)_52%,rgba(16,21,18,0.28)_76%,rgba(16,21,18,0.02)_100%)]";

export function WorkCards({ items }: { items: readonly CaseStudy[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.slug} className="h-full">
          <Link
            href={`/work/${item.slug}`}
            className="group focus-visible:outline-ink block h-full rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-[3px]"
          >
            <article className="border-line relative h-full min-h-[26rem] overflow-hidden rounded-[14px] border">
              <Image
                src={item.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 400px, (min-width: 640px) 46vw, 92vw"
                className="object-cover object-center transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
              />

              <span aria-hidden className={scrim} />

              {item.nda ? (
                <span className="t-eyebrow absolute top-4 right-4 rounded-full bg-white/12 px-2.5 py-[5px] text-white/80 backdrop-blur-sm">
                  {work.nda}
                </span>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 flex flex-col p-6">
                <p className="t-eyebrow text-brand">
                  {item.sector} &middot; {item.region}
                </p>

                <h2 className="font-display mt-3 text-[21px] leading-[1.15] font-bold tracking-[-0.03em] text-pretty text-white">
                  {item.title}
                </h2>

                <p className="t-meta mt-3 line-clamp-2 leading-[1.55] text-white/65">
                  {item.body}
                </p>

                <span className="t-meta mt-6 inline-flex items-center gap-2 font-semibold text-white">
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
        <Link
          href={site.book}
          className="group focus-visible:outline-ink block h-full rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-[3px]"
        >
          <article className="border-brand/30 relative h-full min-h-[26rem] overflow-hidden rounded-[14px] border bg-[linear-gradient(160deg,#141a16_0%,#101512_55%,#0c110e_100%)]">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(80% 60% at 20% 0%, rgba(47,232,92,0.22) 0%, transparent 68%)",
              }}
            />

            <div className="absolute inset-x-0 bottom-0 flex flex-col p-6">
              <p className="t-eyebrow text-brand">{workIndex.last.label}</p>

              <h2 className="font-display mt-3 text-[21px] leading-[1.15] font-bold tracking-[-0.03em] text-pretty text-white">
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
