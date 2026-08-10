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
      aria-label="Primary navigation"
      className="fixed inset-x-0 top-4 z-[60] flex items-center justify-between gap-3 px-3 md:top-5 md:px-6"
    >
      <Group className="gap-1.5 py-1 pr-1.5 pl-1.5 md:gap-2">
        <Link
          href="#"
          aria-label="Gamma Developers home"
          className="group flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-black/[0.04]"
        >
          <Mark />
          <span className="text-[14px] font-medium tracking-[-0.015em] max-sm:hidden">
            {site.name}
          </span>
        </Link>
        <span className="mx-1 hidden h-5 w-px bg-black/10 md:block" />
        <div className="hidden items-center md:flex">
          {navLinks.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </div>
      </Group>

      <Group className="gap-2 py-1 pr-1 pl-3">
        <span className="text-muted-foreground hidden items-center gap-2 font-mono text-[9.5px] tracking-[0.1em] uppercase lg:inline-flex">
          Building now
        </span>
        <Link
          href={site.calendly}
          className="nav-cta bg-brand relative overflow-hidden rounded-full px-4 py-2 text-[13px] font-medium text-[#101512] shadow-[0_5px_18px_rgba(47,232,92,0.22)] transition-all hover:-translate-y-px hover:bg-[#27d954] hover:shadow-[0_8px_24px_rgba(47,232,92,0.34)] md:px-[18px] md:text-sm"
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
      className={`flex items-center rounded-full border border-black/10 bg-white/72 p-1 shadow-[0_8px_30px_rgba(20,23,26,0.07),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl ${className}`}
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
      className="text-muted-foreground hover:text-foreground group relative rounded-full px-3.5 py-2 text-[13px] transition-colors"
    >
      <span className="relative z-1">{children}</span>
      <span className="bg-brand/16 absolute inset-x-1.5 bottom-1 h-0.5 origin-left scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100" />
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
