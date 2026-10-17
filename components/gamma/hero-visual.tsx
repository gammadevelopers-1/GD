import Image from "next/image";

import { cn } from "@/lib/utils";

/** Traces that run out of the render and across the hero, so the art is wired
 *  into the page instead of sitting on top of it. */
const TRACES = [
  "M206 300H118L58 240H-40",
  "M196 432H104L62 474H-40",
  "M214 366H140",
  "M796 330H892L946 278H1040",
  "M806 468H894L942 520H1040",
  "M788 400H870",
  "M382 158V88L332 38V-40",
  "M618 150V78H702V-40",
  "M360 642V722H278V840",
  "M642 650V728L702 790V840",
];

const PORTS = [
  [58, 240],
  [62, 474],
  [140, 366],
  [946, 278],
  [942, 520],
  [870, 400],
  [332, 38],
  [702, 78],
  [278, 722],
  [702, 790],
];

export function HeroVisual({
  src,
  width,
  height,
  masked = false,
  art,
  className,
}: {
  src: string;
  width: number;
  height: number;
  /** Only needed when the art carries its own dark plate instead of alpha. */
  masked?: boolean;
  /**
   * Opaque bounds of the artwork in source pixels. These renders carry large,
   * uneven transparent margins, so without this the layout centres the padding
   * rather than the drawing. Measure with the alpha bounding box.
   */
  art?: { x: number; y: number; w: number; h: number };
  className?: string;
}) {
  const edge =
    "radial-gradient(66% 64% at 50% 47%, #000 38%, rgba(0,0,0,0.72) 66%, rgba(0,0,0,0.25) 85%, transparent 100%)";

  return (
    <div className={cn("hero-visual pointer-events-none relative", className)}>
      {/* Bloom spills well past the art so the light reads as coming from it. */}
      <span
        aria-hidden
        className="absolute -inset-[38%] -z-20"
        style={{
          background:
            "radial-gradient(46% 46% at 50% 46%, rgba(47,232,92,0.20) 0%, rgba(47,232,92,0.07) 40%, rgba(47,232,92,0.02) 62%, transparent 78%)",
        }}
      />

      <svg
        viewBox="0 0 1000 800"
        aria-hidden
        className="absolute -inset-[30%] -z-10 h-auto w-[160%]"
        style={{
          maskImage:
            "radial-gradient(58% 58% at 50% 48%, transparent 34%, #000 62%, #000 76%, transparent 96%)",
          WebkitMaskImage:
            "radial-gradient(58% 58% at 50% 48%, transparent 34%, #000 62%, #000 76%, transparent 96%)",
        }}
      >
        {TRACES.map((d, i) => (
          <g key={d}>
            <path
              d={d}
              fill="none"
              className="stroke-dark-line-strong"
              strokeWidth={1.1}
              opacity={0.55}
            />
            {i % 3 === 0 ? (
              <path
                d={d}
                fill="none"
                pathLength={1}
                strokeWidth={1.8}
                strokeLinecap="round"
                style={{ animationDelay: `${i * 700}ms` }}
                className="hero-trace stroke-brand"
              />
            ) : null}
          </g>
        ))}

        {PORTS.map(([x, y], i) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={i % 4 === 0 ? 3.4 : 2.4}
            className={i % 4 === 0 ? "fill-brand" : "fill-dark-line-strong"}
            opacity={i % 4 === 0 ? 0.85 : 0.7}
          />
        ))}
      </svg>

      {/* Pool of light on the floor beneath the art. */}
      <span
        aria-hidden
        className="absolute inset-x-[14%] bottom-[2%] -z-10 h-[16%]"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(47,232,92,0.16), transparent 72%)",
          filter: "blur(10px)",
        }}
      />

      <div
        className="relative overflow-hidden"
        style={art ? { aspectRatio: `${art.w} / ${art.h}` } : undefined}
      >
        <Image
          src={src}
          alt=""
          width={width}
          height={height}
          priority
          sizes="(min-width: 1280px) 660px, 50vw"
          className={cn(art ? "absolute max-w-none" : "h-auto w-full")}
          style={{
            ...(masked ? { maskImage: edge, WebkitMaskImage: edge } : null),
            ...(art
              ? {
                  width: `${(width / art.w) * 100}%`,
                  left: `${(-art.x / art.w) * 100}%`,
                  top: `${(-art.y / art.h) * 100}%`,
                }
              : null),
          }}
        />
      </div>
    </div>
  );
}
