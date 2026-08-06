"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

const COUNT = 17;
const HEIGHT = 700;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function FooterArcs() {
  const [width, setWidth] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (width === 0) return null;

  const cx = round2(width / 2);
  const cy = HEIGHT + 60;

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[700px] w-full"
    >
      {Array.from({ length: COUNT }, (_, i) => {
        const t = i / (COUNT - 1);
        const sx = round2(width * (0.01 + t * 0.98));
        const sy = round2(30 + Math.sin(i * 1.6) * 24);
        const lit = i % 4 === 1;
        const d = `M${sx} ${sy} C${sx} ${round2(HEIGHT * 0.55)},${cx} ${round2(HEIGHT * 0.66)},${cx} ${cy}`;

        return (
          <g key={i}>
            <path
              d={d}
              fill="none"
              stroke={lit ? "rgba(47,232,92,0.32)" : "rgba(236,234,226,0.06)"}
              strokeWidth={lit ? 1.1 : 0.7}
            />
            {lit && !reduced ? (
              <circle r="2.6" fill="#7ef7b2">
                <animateMotion
                  dur={`${5 + i * 0.35}s`}
                  repeatCount="indefinite"
                  path={d}
                />
              </circle>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
