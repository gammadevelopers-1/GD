"use client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export const ease = {
  out: "power3.out",
  inOut: "power2.inOut",
  soft: "power1.out",
} as const;

export const duration = {
  fast: 0.35,
  base: 0.8,
  slow: 1.4,
} as const;

export { gsap, ScrollTrigger, useGSAP };
