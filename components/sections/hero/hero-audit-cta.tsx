import Link from "next/link";
import { site } from "@/lib/content/site";

function SignalArcs({ side }: { side: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 420 240"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-y-0 w-[42%] text-white/[0.075] opacity-75 transition-opacity duration-700 group-hover/cta:opacity-100 max-md:w-[62%] ${
        side === "left" ? "left-0" : "right-0 -scale-x-100"
      }`}
    >
      {[0, 1, 2, 3, 4, 5].map((ring) => (
        <path
          key={ring}
          d={`M ${-112 + ring * 27} 266 C ${82 + ring * 18} 218, ${96 + ring * 16} 28, ${-18 + ring * 22} -34`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export function HeroAuditCta() {
  return (
    <aside
      aria-labelledby="hero-audit-cta-title"
      className="group/cta pointer-events-auto absolute inset-x-0 bottom-0 z-[6] h-[370px] overflow-hidden border-t border-white/12 bg-[radial-gradient(circle_at_12%_15%,rgba(47,232,92,0.13),transparent_31%),radial-gradient(circle_at_86%_85%,rgba(5,150,105,0.18),transparent_34%),radial-gradient(circle_at_50%_-28%,rgba(47,232,92,0.2),transparent_45%),linear-gradient(132deg,#080d0b_0%,#121b16_48%,#090f0c_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:h-[340px] lg:h-[320px]"
    >
      <SignalArcs side="left" />
      <SignalArcs side="right" />

      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 h-[250px] w-[min(820px,82vw)] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(47,232,92,0.105),rgba(5,150,105,0.035)_44%,transparent_72%)] blur-2xl transition-all duration-700 group-hover/cta:scale-110 group-hover/cta:opacity-90"
      />

      <div
        aria-hidden
        className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,#000,transparent_76%)] [background-size:46px_46px] opacity-25"
      />

      <div className="relative mx-auto flex h-full max-w-[1120px] flex-col items-center justify-center px-6 py-8 text-center sm:px-10 lg:px-14 lg:py-7">
        <span className="inline-flex h-7 items-center gap-2.5 rounded-full border border-white/14 bg-white/[0.07] px-4 font-mono text-[9px] font-semibold tracking-[0.2em] text-[#d5e3da] uppercase shadow-[0_8px_28px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 group-hover/cta:border-[#2fe85c]/30 group-hover/cta:bg-white/[0.09]">
          Get Started
        </span>

        <h2
          id="hero-audit-cta-title"
          className="font-display mt-4 max-w-[23ch] text-[31px] leading-[0.98] font-semibold tracking-[-0.05em] text-[#f6faf7] drop-shadow-[0_2px_20px_rgba(0,0,0,0.22)] sm:text-[38px] lg:text-[44px] xl:text-[48px]"
        >
          Tell us what’s broken. We’ll show you the fix
        </h2>

        <p className="mt-3 max-w-[62ch] text-[13px] leading-[1.6] text-[#aabbb0] sm:text-[15px] lg:text-[16px]">
          Book the full audit to get a clear picture of what’s slowing you down,
          what to fix first, and where AI can actually help
        </p>

        <Link
          href={site.calendly}
          data-cursor-interactive
          data-button-fill
          className="button-fill-fx group/button bg-brand relative mt-6 inline-flex h-14 items-center gap-4 overflow-hidden rounded-full px-7 text-[15px] font-semibold text-[#0b110d] shadow-[0_16px_42px_rgba(47,232,92,0.2),inset_0_1px_0_rgba(255,255,255,0.42)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.025] hover:bg-[#101512] hover:shadow-[0_22px_56px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] focus-visible:bg-[#101512] active:translate-y-0 active:scale-[0.99] active:bg-[#101512]"
        >
          <span className="button-fill-fx__label">Book the full audit</span>
          <span className="relative z-[1] grid h-8 w-16 place-items-center rounded-[40px] bg-[#0d1510] text-white shadow-[0_5px_16px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover/button:translate-x-1 group-hover/button:bg-[#2fe85c] group-hover/button:text-[#0d1510]">
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
    </aside>
  );
}
