"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { SectionHead } from "@/components/gamma/section-head";
import { WorkCard } from "@/components/gamma/work-card";
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
              className="max-w-[300px] pl-4 lg:max-w-[336px]"
            >
              <WorkCard item={item} sizes="336px" />
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
