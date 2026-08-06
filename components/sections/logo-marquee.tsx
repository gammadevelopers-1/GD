"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { clientLogos } from "@/lib/content/site";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export function LogoMarquee() {
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !track.current) return;

      const tween = gsap.to(track.current, {
        xPercent: -50,
        duration: 34,
        ease: "none",
        repeat: -1,
      });

      ScrollTrigger.create({
        trigger: track.current,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => tween.play(),
        onLeave: () => tween.pause(),
        onEnterBack: () => tween.play(),
        onLeaveBack: () => tween.pause(),
      });
    },
    { dependencies: [reduced] },
  );

  const row = [...clientLogos, ...clientLogos];

  return (
    <div
      aria-label="Clients"
      className="border-border bg-background overflow-hidden border-y [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] py-6"
    >
      <div ref={track} className="flex w-max items-center gap-16">
        {row.map((logo, i) => (
          <LogoItem key={`${logo.name}-${i}`} logo={logo} />
        ))}
      </div>
    </div>
  );
}

/** Falls back to the wordmark if the file is missing, so a 404 never breaks the row. */
function LogoItem({ logo }: { logo: (typeof clientLogos)[number] }) {
  const [failed, setFailed] = useState(false);

  if (failed || !logo.src) {
    return (
      <span className="text-[19px] font-semibold tracking-[-0.02em] whitespace-nowrap text-[#b6b6a9]">
        {logo.name}
      </span>
    );
  }

  return (
    <Image
      src={logo.src}
      alt={logo.name}
      width={132}
      height={34}
      onError={() => setFailed(true)}
      className="h-[26px] w-auto opacity-45 grayscale transition-all duration-300 hover:opacity-90 hover:grayscale-0"
    />
  );
}
