"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { SectionHead } from "@/components/gamma/section-head";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { about } from "@/lib/content/about";

const { people } = about;

const arrowClass =
  "border-dark-line text-dark-head grid size-11 place-items-center rounded-full border transition-colors duration-200 ease-out hover:border-brand/45 hover:text-brand disabled:opacity-25 disabled:hover:border-dark-line disabled:hover:text-dark-head focus-visible:outline-dark-head focus-visible:outline-2 focus-visible:outline-offset-2";

export function AboutPeople() {
  const [api, setApi] = useState<CarouselApi>();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!api) return;

    const sync = () => {
      setCanPrev(api.canScrollPrev());
      setCanNext(api.canScrollNext());
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
    <section className="bg-dark py-[clamp(60px,6vw,92px)]">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <SectionHead
          tone="dark"
          eyebrow={people.eyebrow}
          one={people.heading.one}
          two={people.heading.two}
          lead={people.lead}
        />
      </div>

      <Carousel
        setApi={setApi}
        opts={{ breakpoints: { "(max-width: 768px)": { dragFree: true } } }}
        className="mt-[clamp(40px,4.4vw,64px)]"
      >
        <CarouselContent className="ml-0 pr-6 pl-[max(8px,calc(50vw-632px))]">
          {people.members.map((person, i) => (
            <CarouselItem
              key={`${person.name}-${i}`}
              className="group max-w-[248px] pl-4 lg:max-w-[276px]"
            >
              <div className="border-dark-line relative aspect-[4/5] overflow-hidden rounded-[14px] border">
                {person.photo ? (
                  <Image
                    src={person.photo}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 276px, 248px"
                    className="object-cover grayscale transition-[filter,transform] duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04] group-hover:grayscale-0"
                  />
                ) : (
                  <div className="bg-dark-row absolute inset-0 grid place-items-center">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(236,236,228,0.035)_0_1px,transparent_1px_9px)]"
                    />
                    <span className="text-brand/35 font-display relative text-[38px] leading-none font-bold tracking-[-0.04em]">
                      {person.initials}
                    </span>
                  </div>
                )}

                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-[52%] bg-[linear-gradient(180deg,transparent,rgba(20,23,26,0.88))]"
                />

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-[17px] leading-[1.15] font-bold tracking-[-0.03em] text-white uppercase">
                    {person.name}
                  </p>
                  <p className="t-eyebrow text-brand mt-2 leading-[1.4]">
                    {person.role}
                  </p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="mx-auto mt-8 flex w-full max-w-[1280px] justify-end px-6">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Previous"
            disabled={!canPrev}
            onClick={() => api?.scrollPrev()}
            className={arrowClass}
          >
            <ArrowLeft className="size-4" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="Next"
            disabled={!canNext}
            onClick={() => api?.scrollNext()}
            className={arrowClass}
          >
            <ArrowRight className="size-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </section>
  );
}
