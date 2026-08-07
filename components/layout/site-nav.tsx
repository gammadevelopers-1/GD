"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { navLinks, site } from "@/lib/content/site";

export function SiteNav() {
  const nav = useRef<HTMLElement>(null);

  useGSAP(() => {
    const show = gsap.to(nav.current, {
      yPercent: -140,
      duration: 0.35,
      ease: "power2.inOut",
      paused: true,
    });

    ScrollTrigger.create({
      start: "top -240",
      end: 99999,
      onUpdate: (self) => {
        if (self.direction === 1) show.play();
        else show.reverse();
      },
    });

    gsap.from(nav.current, {
      y: -24,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
      delay: 0.1,
    });
  });

  return (
    <nav
      ref={nav}
      className="fixed inset-x-0 top-5 z-[60] flex items-center justify-between gap-3.5 px-6"
    >
      <Group className="hidden md:flex">
        {navLinks.map((l) => (
          <NavLink key={l.href} href={l.href}>
            {l.label}
          </NavLink>
        ))}
      </Group>

      <Group className="hidden gap-2.5 py-1 pr-5 pl-3 md:flex">
        <Mark />
        <span className="text-[15px] font-medium tracking-[-0.015em]">
          {site.name}
        </span>
      </Group>

      <Group className="ml-auto md:ml-0">
        <Link
          href={site.calendly}
          className="bg-brand rounded-full px-[18px] py-2 text-sm font-medium text-[#14171a] transition-colors hover:bg-[#26d150]"
        >
          Book a call
        </Link>
      </Group>
    </nav>
  );
}

function Group({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-border/70 flex items-center rounded-full border bg-white/70 p-1 shadow-[0_2px_14px_rgba(20,23,26,0.04)] backdrop-blur-lg ${className}`}
    >
      {children}
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground rounded-full px-4 py-2 text-sm transition-colors"
    >
      {children}
    </Link>
  );
}

export function Mark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`text-brand grid size-[25px] shrink-0 place-items-center rounded-[7px] bg-[#14171a] font-mono text-[10.5px] font-semibold ${className}`}
    >
      {site.mark}
    </span>
  );
}
