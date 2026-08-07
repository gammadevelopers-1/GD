"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useHero } from "./hero-provider";

const LEFT = [
  "left-[4%] top-[30%]",
  "left-[6.5%] top-[44%]",
  "left-[5%] top-[58%]",
  "left-[3.5%] top-[70%]",
];
const RIGHT = [
  "right-[4%] top-[30%]",
  "right-[6.5%] top-[44%]",
  "right-[5%] top-[58%]",
  "right-[3.5%] top-[70%]",
];

export function AuditTags() {
  const { problems, fixes } = useHero();
  const scope = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Every time the label set changes, restagger it in.
  useGSAP(
    () => {
      if (reduced || !scope.current) return;

      const tags = scope.current.querySelectorAll<HTMLElement>(
        "[data-tag]:not(:empty)",
      );
      if (tags.length === 0) return;

      gsap.fromTo(
        tags,
        { opacity: 0, y: 8, filter: "blur(3px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.16,
        },
      );
    },
    { scope, dependencies: [problems.join("|"), fixes.join("|"), reduced] },
  );

  return (
    <div
      ref={scope}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[3] hidden lg:block"
    >
      {LEFT.map((pos, i) => (
        <Tag key={`p-${i}`} pos={pos} label={problems[i]} tone="bad" />
      ))}
      {RIGHT.map((pos, i) => (
        <Tag key={`f-${i}`} pos={pos} label={fixes[i]} tone="ok" />
      ))}
    </div>
  );
}

function Tag({
  pos,
  label,
  tone,
}: {
  pos: string;
  label?: string;
  tone: "bad" | "ok";
}) {
  if (!label) return null;
  return (
    <span
      data-tag
      className={`absolute ${pos} inline-flex max-w-[21vw] items-center overflow-hidden rounded-full border bg-white/90 px-3.5 py-[7px] font-mono text-[10.5px] text-ellipsis whitespace-nowrap shadow-[0_4px_14px_rgba(20,23,26,0.05)] backdrop-blur-sm ${
        tone === "ok"
          ? "text-accent border-[rgba(5,150,105,0.32)]"
          : "text-muted-foreground border-[rgba(180,64,44,0.26)]"
      }`}
    >
      <span
        className={`mr-2 size-[5px] rounded-full ${tone === "ok" ? "bg-brand" : "bg-[#b4402c] opacity-75"}`}
      />
      {label}
    </span>
  );
}
