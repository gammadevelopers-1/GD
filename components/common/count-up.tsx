"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface CountUpProps {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}

function format(value: number, decimals: number) {
  return decimals
    ? value.toFixed(decimals)
    : Math.round(value).toLocaleString("en-US");
}

export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 1300,
}: CountUpProps) {
  const host = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const node = host.current;
    if (!node || reduced) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const started = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - started) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setShown(value * eased);
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { rootMargin: "0px 0px -15% 0px" },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration, reduced]);

  return (
    <span ref={host} className="tabular-nums">
      {format(reduced ? value : shown, decimals)}
      {suffix}
    </span>
  );
}
