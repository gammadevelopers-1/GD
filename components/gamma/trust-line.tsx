import { trust } from "@/lib/gamma-content";
import { cardLight } from "@/lib/gamma-ui";
import { cn } from "@/lib/utils";

export function TrustLine() {
  return (
    <section className="bg-ground pb-[clamp(60px,6vw,92px)]">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <div
          className={cn(
            cardLight,
            "flex flex-col items-center gap-6 p-[clamp(28px,3.4vw,48px)] text-center",
          )}
        >
          <p className="t-eyebrow text-dim">{trust.eyebrow}</p>

          <p className="font-display max-w-[44ch] text-[clamp(20px,2.4vw,30px)] leading-[1.25] font-semibold tracking-[-0.035em] text-balance">
            <span className="text-ink">{trust.line.one} </span>
            <span className="text-green-ink">{trust.line.two}</span>
          </p>

          <ul className="flex flex-wrap justify-center gap-2">
            {trust.badges.map((badge) => (
              <li
                key={badge}
                className="t-eyebrow text-green-ink rounded-full bg-[rgba(13,119,40,0.08)] px-3 py-[6px]"
              >
                {badge}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
