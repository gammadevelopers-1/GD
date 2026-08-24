"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { navLinks, servicesMenu, site } from "@/lib/content/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  const nav = useRef<HTMLElement>(null);
  const solid = useRef<HTMLDivElement>(null);
  const [services, setServices] = useState(false);
  const closeTimer = useRef<number>(0);

  useGSAP(() => {
    gsap.set(solid.current, { opacity: 1 });

    ScrollTrigger.create({
      start: 0,
      end: 180,
      scrub: 0.55,
      animation: gsap.to(solid.current, {
        opacity: 0,
        ease: "none",
        duration: 1,
      }),
    });

    gsap.from(nav.current, {
      y: -20,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
      delay: 0.1,
    });
  });

  function openServices() {
    window.clearTimeout(closeTimer.current);
    setServices(true);
  }

  function closeServices() {
    closeTimer.current = window.setTimeout(() => setServices(false), 120);
  }

  return (
    <header
      ref={nav}
      className="fixed inset-x-0 top-0 z-[60] will-change-transform"
    >
      <div
        aria-hidden
        className="absolute inset-0 border-b border-black/[0.07] bg-white/68 shadow-[0_10px_32px_rgba(20,23,26,0.045)] backdrop-blur-[8px]"
      />
      <div
        ref={solid}
        aria-hidden
        className="absolute inset-0 border-b border-black/[0.055] bg-white"
      />

      <nav
        aria-label="Primary navigation"
        className="relative mx-auto grid h-[72px] w-full max-w-[1480px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10"
      >
        <Link
          href="/"
          aria-label={`${site.name} home`}
          className="group/logo relative block h-10 w-14 overflow-hidden rounded-lg transition-[width,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-black/[0.025] focus-visible:ring-2 focus-visible:ring-[#2fe85c]/50 focus-visible:outline-none md:hover:w-[158px] md:focus-visible:w-[158px]"
        >
          <span className="absolute inset-0 transition-all duration-300 ease-out group-hover/logo:-translate-x-2 group-hover/logo:scale-95 group-hover/logo:opacity-0 group-focus-visible/logo:-translate-x-2 group-focus-visible/logo:scale-95 group-focus-visible/logo:opacity-0 max-md:group-hover/logo:translate-x-0 max-md:group-hover/logo:scale-100 max-md:group-hover/logo:opacity-100">
            <Image
              src="/logo.png"
              alt=""
              width={108}
              height={80}
              priority
              className="absolute top-[-20px] left-[-26px] h-[80px] w-[108px] max-w-none"
            />
          </span>
          <span className="absolute inset-0 translate-x-3 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/logo:translate-x-0 group-hover/logo:opacity-100 group-focus-visible/logo:translate-x-0 group-focus-visible/logo:opacity-100 max-md:group-hover/logo:translate-x-3 max-md:group-hover/logo:opacity-0">
            <Image
              src="/full-logo.png"
              alt=""
              width={213}
              height={137}
              priority
              className="absolute top-[-48px] left-[-30px] h-[137px] w-[213px] max-w-none"
            />
          </span>
        </Link>

        <div className="hidden items-center justify-center rounded-full bg-white/38 p-1 md:flex">
          <NavLink href={navLinks[0].href}>{navLinks[0].label}</NavLink>

          <div
            className="relative"
            onMouseEnter={openServices}
            onMouseLeave={closeServices}
          >
            <Button
              variant="bare"
              size="none"
              type="button"
              aria-expanded={services}
              onClick={() => setServices((v) => !v)}
              className={cn(
                "hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-medium tracking-[-0.01em] transition-colors focus-visible:ring-2 focus-visible:ring-[#2fe85c]/50 focus-visible:outline-none",
                services ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Services
              <ChevronDown
                className={cn(
                  "size-3 transition-transform duration-300",
                  services && "rotate-180",
                )}
              />
            </Button>

            <div
              className={cn(
                "border-border absolute top-[calc(100%+14px)] left-1/2 grid w-[600px] max-w-[92vw] -translate-x-1/2 grid-cols-2 gap-1.5 rounded-[20px] border bg-white p-3.5 shadow-[0_30px_70px_rgba(20,23,26,0.16)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                services
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none invisible translate-y-2 opacity-0",
              )}
            >
              {servicesMenu.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setServices(false)}
                  className="rounded-[14px] px-4 py-3.5 transition-colors duration-200 hover:bg-[rgba(47,232,92,0.06)] focus-visible:ring-2 focus-visible:ring-[#2fe85c]/50 focus-visible:outline-none"
                >
                  <span className="text-foreground block text-sm font-semibold">
                    {item.title}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-[12.5px] leading-[1.5]">
                    {item.body}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {navLinks.slice(1).map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link
            href="/contact"
            className="text-muted-foreground hover:text-foreground hidden rounded-full px-3 py-2 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#2fe85c]/50 focus-visible:outline-none sm:inline-flex"
          >
            Contact
          </Link>
          <Link
            href={site.calendly}
            data-button-fill
            className="button-fill-fx marketing-primary-button nav-cta relative inline-flex h-10 items-center overflow-hidden rounded-full px-4 md:px-[19px]"
          >
            <span className="button-fill-fx__label">Book a call</span>
          </Link>
        </div>
      </nav>
    </header>
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
      className="text-muted-foreground hover:text-foreground group relative rounded-full px-4 py-2 text-[12.5px] font-medium tracking-[-0.01em] transition-colors hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-[#2fe85c]/50 focus-visible:outline-none"
    >
      <span className="relative z-1">{children}</span>
      <span className="bg-brand/16 absolute inset-x-1.5 bottom-1 h-0.5 origin-left scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100" />
    </Link>
  );
}
