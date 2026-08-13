import { Clock3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComingSoon({
  title,
  description,
  items = [],
  compact = false,
  className,
}: {
  title: string;
  description: string;
  items?: string[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-label={`${title} coming soon`}
      className={cn(
        "group relative isolate overflow-hidden rounded-[24px] border border-white/10 bg-[#15181b] text-white shadow-[0_18px_55px_rgba(20,23,26,0.12)]",
        compact ? "p-5 sm:p-6" : "px-5 py-7 sm:px-7 sm:py-9 lg:px-9",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -top-24 right-[-5%] size-64 rounded-full bg-[#2fe85c]/13 blur-3xl transition duration-700 group-hover:scale-125 group-hover:bg-[#2fe85c]/20"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-55%] left-[12%] h-44 w-[72%] rotate-[-7deg] rounded-[50%] border-[28px] border-white/[0.035] blur-sm transition duration-700 group-hover:translate-x-5 group-hover:border-[#2fe85c]/10"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [mask-image:linear-gradient(90deg,#000,transparent_80%)] [background-size:42px_42px] opacity-35"
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#2fe85c]/20 bg-[#2fe85c]/10 px-3 py-1.5 font-mono text-[8px] tracking-[0.15em] text-[#74ef91] uppercase sm:text-[9px]">
            <Clock3 className="size-3" /> In development
          </span>
          <Sparkles className="size-4 text-white/18 transition duration-500 group-hover:scale-110 group-hover:rotate-12 group-hover:text-[#2fe85c]/70" />
        </div>

        <p
          aria-hidden="true"
          className={cn(
            "mt-6 overflow-hidden leading-[0.75] font-semibold tracking-[-0.075em] whitespace-nowrap text-transparent transition duration-700 [-webkit-text-stroke:1px_rgba(238,243,238,0.14)] group-hover:[-webkit-text-stroke:1px_rgba(47,232,92,0.28)]",
            compact
              ? "text-[clamp(2.5rem,7vw,5.4rem)]"
              : "text-[clamp(2.8rem,10vw,8.8rem)]",
          )}
        >
          COMING SOON
        </p>

        <div className={cn("relative z-10", compact ? "mt-5" : "mt-6")}>
          <h2
            className={cn(
              "font-display font-semibold tracking-[-0.045em] text-[#f0f2ed]",
              compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl",
            )}
          >
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-xs leading-5 text-white/45 sm:text-sm sm:leading-6">
            {description}
          </p>

          {items.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-1.5 text-[9px] font-medium text-white/42 transition duration-300 group-hover:border-white/12 group-hover:text-white/60 sm:text-[10px]"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
