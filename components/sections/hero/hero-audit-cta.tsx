import Link from "next/link";
import { site } from "@/lib/content/site";

export function HeroAuditCta() {
  return (
    <div className="group/cta pointer-events-auto flex w-full max-w-[760px] -translate-y-10 flex-col items-center text-center text-[#14171a] sm:-translate-y-12">
      <p
        data-hero="cta-copy"
        className="max-w-[62ch] text-[13px] leading-[1.55] font-medium text-[#4b5148] sm:text-[15px] lg:text-[16px]"
      >
        Book the full audit to get a clear picture of what’s slowing you down,
        what to fix first, and where AI can actually help
      </p>

      <div data-hero="cta-button">
        <Link
          href={site.calendly}
          data-button-fill
          className="button-fill-fx group/button bg-brand relative mt-5 inline-flex h-14 items-center gap-4 overflow-hidden rounded-full px-7 text-[15px] font-semibold text-[#16181c] shadow-[0_16px_44px_rgba(47,232,92,0.28),inset_0_1px_0_rgba(255,255,255,0.48)] transition-all duration-300 [--button-fill-color:#059669] hover:-translate-y-1 hover:scale-[1.025] hover:bg-[#059669] hover:shadow-[0_22px_58px_rgba(47,232,92,0.3),inset_0_1px_0_rgba(255,255,255,0.16)] focus-visible:bg-[#059669] active:translate-y-0 active:scale-[0.99] active:bg-[#059669]"
        >
          <span className="button-fill-fx__label">Book the full audit</span>
          <span className="relative z-[1] grid h-8 w-12 place-items-center rounded-[10px] bg-[#16181c] text-white shadow-[0_5px_16px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover/button:translate-x-1 group-hover/button:bg-[#2fe85c] group-hover/button:text-[#16181c]">
            <svg
              aria-hidden
              viewBox="0 0 20 16"
              className="h-4 w-5"
              fill="none"
            >
              <path
                d="M2.5 8h14m-3.5-3.25L16.5 8 13 11.25"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}
