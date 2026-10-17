"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { legalLinks } from "@/lib/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { navLinks, servicesMenu, site } from "@/lib/content/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  const nav = useRef<HTMLElement>(null);
  const solid = useRef<HTMLDivElement>(null);
  const [services, setServices] = useState(false);
  const [menu, setMenu] = useState(false);
  const closeTimer = useRef<number>(0);

  useEffect(() => {
    if (!menu) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    const previous = document.body.style.overflow;

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [menu]);

  useGSAP(() => {
    gsap.set(solid.current, { opacity: 0 });

    ScrollTrigger.create({
      start: 0,
      end: 120,
      scrub: 0.4,
      animation: gsap.to(solid.current, {
        opacity: 1,
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
    <>
      <header
        ref={nav}
        className="fixed inset-x-0 top-0 z-[60] will-change-transform"
      >
        <div
          ref={solid}
          aria-hidden
          className="bg-gd-light-background absolute inset-0 border-b border-black/[0.08]"
        />

        <nav
          aria-label="Primary navigation"
          className="relative mx-auto grid h-[72px] w-full max-w-[1480px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10"
        >
          <Link
            href="/"
            aria-label={`${site.name} home`}
            className="group/logo focus-visible:ring-brand/50 relative block h-10 w-14 overflow-hidden rounded-lg transition-[width,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-black/[0.025] focus-visible:ring-2 focus-visible:outline-none md:hover:w-[158px] md:focus-visible:w-[158px]"
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
                src="/gd-logo-dark.png"
                alt=""
                width={421}
                height={75}
                priority
                className="absolute top-[7px] left-[6px] h-[26px] w-[146px] max-w-none"
              />
            </span>
          </Link>

          <div className="hidden items-center justify-center gap-1 p-1 md:flex">
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
                  "nav-trigger hover:text-foreground focus-visible:ring-brand/50 group relative inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium tracking-[-0.01em] transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  services ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="relative z-1">Services</span>
                <ChevronDown
                  className={cn(
                    "relative z-1 size-3 transition-transform duration-300",
                    services && "rotate-180",
                  )}
                />
                <span
                  className={cn(
                    "bg-brand absolute inset-x-3 bottom-1 h-[3px] origin-left rounded-full transition-transform duration-300",
                    services
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100",
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
                    className="focus-visible:ring-brand/50 rounded-[14px] px-4 py-3.5 transition-colors duration-200 hover:bg-[rgba(47,232,92,0.06)] focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="text-foreground block text-[13px] font-semibold">
                      {item.title}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-[13px] leading-[1.5]">
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
              className="text-muted-foreground hover:text-foreground focus-visible:ring-brand/50 hidden rounded-full px-4 py-2 text-[13px] font-medium tracking-[-0.01em] transition-colors focus-visible:ring-2 focus-visible:outline-none sm:inline-flex"
            >
              Contact
            </Link>
            <Button
              asChild
              variant="marketing"
              size="marketing-sm"
              className={cn(
                "nav-cta relative px-4 md:px-[19px]",
                // The sheet carries its own full-width CTA.
                menu && "hidden md:inline-flex",
              )}
            >
              <Link href={site.book} data-button-fill>
                <span className="button-fill-fx__label">Book a call</span>
              </Link>
            </Button>

            <button
              type="button"
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              aria-controls="site-menu"
              onClick={() => setMenu((v) => !v)}
              className="text-foreground focus-visible:ring-brand/50 -mr-1.5 grid size-10 shrink-0 place-items-center rounded-[10px] focus-visible:ring-2 focus-visible:outline-none md:hidden"
            >
              <span aria-hidden className="relative block size-5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "absolute left-1/2 h-[1.5px] w-[18px] -translate-x-1/2 rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]",
                      i === 0 &&
                        (menu
                          ? "top-1/2 -translate-y-1/2 rotate-45"
                          : "top-[5px]"),
                      i === 1 &&
                        cn(
                          "top-1/2 -translate-y-1/2 transition-opacity",
                          menu && "opacity-0",
                        ),
                      i === 2 &&
                        (menu
                          ? "top-1/2 -translate-y-1/2 -rotate-45"
                          : "top-[13px]"),
                    )}
                  />
                ))}
              </span>
            </button>
          </div>
        </nav>
      </header>

      <SiteMenu open={menu} onClose={() => setMenu(false)} />
    </>
  );
}

function SiteMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div
      id="site-menu"
      inert={!open}
      className={cn(
        "bg-gd-light-background/97 fixed inset-x-0 top-[72px] bottom-0 z-[55] overflow-y-auto backdrop-blur-xl transition-[opacity,transform] duration-300 ease-[cubic-bezier(.16,1,.3,1)] md:hidden",
        open
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2 opacity-0",
      )}
    >
      <nav
        aria-label="Mobile"
        className="mx-auto w-full max-w-[1480px] px-5 pt-3 pb-10 sm:px-6"
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="font-display text-foreground block border-b border-black/[0.07] py-4.5 text-[24px] leading-none font-bold tracking-[-0.035em] uppercase"
          >
            {link.label}
          </Link>
        ))}

        <p className="text-muted-foreground mt-7 font-mono text-[10px] tracking-[0.16em] uppercase">
          What we build
        </p>
        <div className="mt-3 grid gap-1.5">
          {servicesMenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="border-border text-foreground rounded-[14px] border bg-white px-4 py-3 text-[14px] font-semibold"
            >
              {item.title}
            </Link>
          ))}
        </div>

        <Link
          href="/contact"
          onClick={onClose}
          className="font-display text-foreground mt-7 block border-b border-black/[0.07] py-4.5 text-[24px] leading-none font-bold tracking-[-0.035em] uppercase"
        >
          Contact
        </Link>

        <Link
          href={site.book}
          onClick={onClose}
          className="bg-brand text-foreground mt-7 flex h-[52px] items-center justify-center rounded-full text-[15px] font-semibold"
        >
          Book a call
        </Link>

        <div className="text-muted-foreground mt-7 flex justify-center gap-5 text-[12px]">
          {legalLinks.map((item) => (
            <Link key={item.href} href={item.href} onClick={onClose}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
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
      className="text-muted-foreground hover:text-foreground group focus-visible:ring-brand/50 relative rounded-full px-4 py-2 text-[13px] font-medium tracking-[-0.01em] transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="relative z-1">{children}</span>
      <span className="bg-brand absolute inset-x-3 bottom-1 h-[3px] origin-left scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100" />
    </Link>
  );
}
