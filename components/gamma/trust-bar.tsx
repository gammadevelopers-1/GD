import { trustBar } from "@/lib/gamma-content";
import { cn } from "@/lib/utils";

function Wordmarks({ clone, dark }: { clone?: boolean; dark?: boolean }) {
  return (
    <div className="flex gap-[56px] pr-[56px]" aria-hidden={clone}>
      {trustBar.wordmarks.map((name) => (
        <span
          key={name}
          className={cn(
            "font-display text-[18px] leading-none font-bold tracking-[-0.035em] whitespace-nowrap uppercase",
            "transition-colors duration-200",
            dark
              ? "text-marquee hover:text-brand"
              : "text-marquee hover:text-green-ink",
          )}
        >
          {name}
        </span>
      ))}
    </div>
  );
}

export function TrustBar({ dark }: { dark?: boolean }) {
  const marquee = (
    <>
      <p className={cn("t-eyebrow", dark && "dark-heading")}>
        <span className="shimmer-label">{trustBar.label}</span>
      </p>
      <div className="mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
        <div className="flex w-max animate-[g-marquee_48s_linear_infinite]">
          <Wordmarks dark={dark} />
          <Wordmarks dark={dark} clone />
        </div>
      </div>
    </>
  );

  // Inside the hero the section owns the background and vertical rhythm.
  if (dark) {
    return (
      <div className="mx-auto w-full max-w-[1280px] shrink-0 px-6 pt-[clamp(24px,4.3vh,48px)] pb-[clamp(20px,3.4vh,42px)]">
        {marquee}
      </div>
    );
  }

  return (
    <section className="bg-ground py-[clamp(72px,9vw,128px)]">
      <div className="mx-auto w-full max-w-[1280px] px-6">{marquee}</div>
    </section>
  );
}
