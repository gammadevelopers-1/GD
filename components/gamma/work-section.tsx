"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { SectionHead } from "@/components/gamma/section-head";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { CaseStudy } from "@/lib/content/cases";
import { work } from "@/lib/gamma-content";
import { cn } from "@/lib/utils";

const arrowClass =
  "border-line text-ink grid size-11 place-items-center rounded-full border transition-colors duration-200 ease-out hover:border-green-ink/40 hover:text-green-ink disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink focus-visible:outline-ink focus-visible:outline-2 focus-visible:outline-offset-2";

export function WorkSection({ featured }: { featured: readonly CaseStudy[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!api) return;

    const sync = () => {
      setCanPrev(api.canScrollPrev());
      setCanNext(api.canScrollNext());
      setCurrent(api.selectedScrollSnap());
    };

    sync();
    api.on("select", sync);
    api.on("reInit", sync);

    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  return (
    <section
      id="work"
      className="bg-ground pt-[clamp(56px,5.4vw,84px)] pb-[clamp(60px,6vw,92px)]"
    >
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <SectionHead
          eyebrow={work.eyebrow}
          one={work.heading.one}
          two={work.heading.two}
          lead={work.lead}
        />
      </div>

      <Carousel
        setApi={setApi}
        opts={{ breakpoints: { "(max-width: 768px)": { dragFree: true } } }}
        className="mt-[clamp(40px,4.4vw,64px)]"
      >
        <CarouselContent className="ml-0 pr-6 pl-[max(8px,calc(50vw-632px))]">
          {featured.map((item) => (
            <CarouselItem
              key={item.slug}
              className="max-w-[284px] pl-4 lg:max-w-[312px]"
            >
              <Link href={`/work/${item.slug}`} className="group block h-full">
                <article className="border-line relative h-full min-h-[24rem] overflow-hidden rounded-[14px] border">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="356px"
                    className="object-cover object-center transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
                  />

                  <span
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(to_top,rgba(16,21,18,0.96)_0%,rgba(16,21,18,0.92)_32%,rgba(16,21,18,0.72)_52%,rgba(16,21,18,0.28)_76%,rgba(16,21,18,0.02)_100%)]"
                  />

                  {item.nda ? (
                    <span className="t-eyebrow absolute top-4 right-4 rounded-full bg-white/12 px-2.5 py-[5px] text-white/80 backdrop-blur-sm">
                      {work.nda}
                    </span>
                  ) : null}

                  <div className="absolute inset-x-0 bottom-0 flex flex-col p-6">
                    <p className="t-eyebrow text-brand">
                      {item.sector} &middot; {item.region}
                    </p>

                    <h3 className="font-display mt-3 text-[21px] leading-[1.15] font-bold tracking-[-0.03em] text-pretty text-white">
                      {item.title}
                    </h3>

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
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {canPrev || canNext ? (
        <div className="mx-auto mt-8 flex w-full max-w-[1280px] items-center justify-between gap-6 px-6">
          <div className="flex gap-2">
            {featured.map((item, i) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => api?.scrollTo(i)}
                aria-label={`Go to ${item.client}`}
                aria-current={current === i}
                className={cn(
                  "h-[6px] rounded-full transition-all duration-300 ease-out",
                  current === i ? "bg-green-ink w-6" : "bg-line-strong w-[6px]",
                )}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => api?.scrollPrev()}
              disabled={!canPrev}
              aria-label={work.prev}
              className={arrowClass}
            >
              <ArrowLeft aria-hidden className="size-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => api?.scrollNext()}
              disabled={!canNext}
              aria-label={work.next}
              className={arrowClass}
            >
              <ArrowRight aria-hidden className="size-[18px]" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-[clamp(36px,3.8vw,56px)] flex justify-center px-6">
        <Link
          href={work.all.href}
          className="bg-brand text-ink hover:bg-brand-hover focus-visible:outline-ink group inline-flex h-[50px] items-center gap-2.5 rounded-full px-7 text-[15px] font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px]"
        >
          {work.all.label}
          <ArrowRight
            aria-hidden
            className="size-[18px] transition-transform duration-200 ease-out group-hover:translate-x-1"
          />
        </Link>
      </div>
    </section>
  );
}
