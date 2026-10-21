import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { WorkCard } from "@/components/gamma/work-card";
import { workIndex, type CaseStudy } from "@/lib/content/cases";
import { site } from "@/lib/content/site";

/** The card at the end that asks for a call, rather than linking to work. */
const shell =
  "group focus-visible:outline-ink block h-full rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-[3px]";

export function WorkCards({ items }: { items: readonly CaseStudy[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.slug} className="h-full">
          <WorkCard
            item={item}
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 46vw, 92vw"
          />
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
