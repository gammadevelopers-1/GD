import Link from "next/link";
import { Reveal } from "@/components/common/reveal";
import { Mark } from "@/components/layout/mark";
import { closing } from "@/lib/content/home";
import { footerColumns, site } from "@/lib/content/site";
import { FooterArcs } from "./footer-arcs";

export function SiteFooter() {
  return (
    <footer
      id="book"
      className="relative min-h-[940px] scroll-mt-24 overflow-hidden bg-[#080b0e] pt-24 text-[#eceae2] max-lg:min-h-[860px] sm:pt-30"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-40px] left-1/2 z-0 h-[900px] w-[2100px] -translate-x-1/2 [background:radial-gradient(ellipse_34%_30%_at_50%_92%,rgba(190,255,215,0.50)_0%,rgba(47,232,92,0.26)_34%,transparent_62%),radial-gradient(ellipse_62%_44%_at_50%_100%,rgba(16,185,129,0.30)_0%,transparent_64%),radial-gradient(ellipse_92%_52%_at_50%_104%,rgba(10,70,100,0.42)_0%,transparent_72%)]"
      />
      <div
        aria-hidden
        className="absolute bottom-[-1240px] left-1/2 z-0 size-[1860px] -translate-x-1/2 rotate-[-9deg] rounded-full border border-[rgba(150,250,190,0.15)] [mask-image:linear-gradient(180deg,transparent_60%,#000_66%,#000_74%,transparent_82%)] max-lg:bottom-[-850px] max-lg:size-[1280px]"
      />
      <div
        aria-hidden
        className="absolute bottom-[-1470px] left-1/2 z-0 size-[2160px] -translate-x-1/2 rotate-[6deg] rounded-full border border-[rgba(150,250,190,0.08)] [mask-image:linear-gradient(180deg,transparent_60%,#000_66%,#000_74%,transparent_82%)] max-lg:bottom-[-990px] max-lg:size-[1460px]"
      />

      <FooterArcs />

      <div
        aria-hidden
        className="absolute bottom-[-1170px] left-1/2 z-[1] size-[1560px] -translate-x-1/2 rounded-full shadow-[0_-34px_190px_rgba(47,232,92,0.40),0_0_0_1px_rgba(150,250,190,0.22),inset_-90px_-40px_200px_rgba(2,10,12,0.85),inset_60px_30px_140px_rgba(180,255,214,0.14)] [background:radial-gradient(circle_at_44%_9%,rgba(232,255,240,0.98)_0%,rgba(150,250,190,0.88)_4%,rgba(47,232,92,0.34)_11%,transparent_22%),radial-gradient(circle_at_50%_15%,#4df57a_0%,#1fd472_8%,#12ab63_17%,#0b7c4c_26%,#06563a_36%,#033128_50%,#02181a_66%)] max-lg:bottom-[-810px] max-lg:size-[1080px]"
      >
        <div className="absolute inset-0 rounded-full [mask-image:radial-gradient(ellipse_62%_26%_at_50%_12%,#000_18%,rgba(0,0,0,0.4)_48%,transparent_68%)] opacity-55 [background:repeating-linear-gradient(90deg,rgba(3,20,14,0.34)_0_1px,transparent_1px_42px),repeating-linear-gradient(0deg,rgba(3,20,14,0.28)_0_1px,transparent_1px_50px)]" />
        <div className="absolute -inset-[3px] rounded-full [background:radial-gradient(circle_at_50%_50%,transparent_46.5%,rgba(150,250,190,0.34)_49%,rgba(47,232,92,0.10)_51%,transparent_55%)]" />
      </div>

      <div className="relative z-[5] mx-auto max-w-[1240px] px-5 md:px-9">
        <Reveal className="mb-16 text-center sm:mb-24">
          <span className="mb-5 inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] text-[#9aa096] uppercase">
            <span className="bg-brand size-1.5 rounded-full shadow-[0_0_9px_rgba(47,232,92,0.6)]" />
            {closing.eyebrow}
          </span>
          <h2 className="font-display mb-4 text-3xl leading-[1.02] font-semibold tracking-[-0.045em] md:text-5xl">
            {closing.title}
          </h2>
          <p className="mx-auto mb-8 max-w-[44ch] text-[#9aa096]">
            {closing.body}
          </p>
          <Link
            href={site.calendly}
            data-button-fill
            className="button-fill-fx bg-brand inline-flex h-12 items-center rounded-full px-6 text-[15px] font-medium text-[#14171a] transition-all hover:-translate-y-0.5"
          >
            <span className="button-fill-fx__label">{closing.cta}</span>
          </Link>
        </Reveal>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[2.1fr_1fr_1fr] md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.02em]">
              <Mark className="!bg-[#eceae2]" />
              {site.name}
            </div>
            <p className="mt-3.5 max-w-[32ch] text-sm text-[#9aa096]">
              {site.tagline}
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 font-mono text-[10.5px] tracking-[0.15em] text-[#6d736a] uppercase">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-2.5 text-sm text-[#9aa096]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="transition-colors hover:text-[#eceae2]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-wrap justify-between gap-3 border-t border-white/[0.07] pt-5.5 pb-6.5 font-mono text-[11px] text-[#6d736a] sm:mt-30">
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
          <span>Built in Pakistan</span>
        </div>
      </div>
    </footer>
  );
}
