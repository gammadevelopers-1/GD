"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { nav } from "@/lib/gamma-content";
import { site } from "@/lib/content/site";
import { BrandLogo } from "@/components/common/brand-logo";
import { cn } from "@/lib/utils";

/** Routes that open with a dark hero the bar has to sit on top of. */
const HERO_ROUTES = new Set([
  "/",
  "/audit",
  "/about",
  "/work",
  "/contact",
  "/book",
  "/privacy",
  "/terms",
]);

/** Whole trees of them. Every case study opens on the same dark hero, and an
 *  exact-match set left the bar light over all of them. */
const HERO_TREES = ["/work/"];

function hasDarkHero(pathname: string) {
  return (
    HERO_ROUTES.has(pathname) ||
    HERO_TREES.some((tree) => pathname.startsWith(tree))
  );
}

const linkBase =
  "group relative py-1 text-[15px] font-medium tracking-[-0.01em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current";

const underline =
  "pointer-events-none absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left scale-x-0 bg-brand transition-transform duration-300 ease-out group-hover:scale-x-100";

/** Fixed on every page. Goes dark while a dark hero is still behind it. */
export function StickyNav() {
  const pathname = usePathname();
  const [overHero, setOverHero] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const [open, setOpen] = useState(false);
  const [seenPath, setSeenPath] = useState(pathname);

  // This bar lives in the layout, so a client-side navigation never remounts
  // it and the previous page's state would carry over — scroll down on one
  // dark-hero page, click through to another, and the bar stays light over it.
  // Reset during render rather than in an effect so it cannot paint a single
  // frame wearing the old page's theme.
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOverHero(true);
    setAtTop(true);
    setOpen(false);
  }

  const dark = hasDarkHero(pathname) && overHero;

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    const raf = requestAnimationFrame(onScroll);

    // Keyed to the path: each page mounts its own #hero, and an observer left
    // pointing at the last one is attached to a detached node that will never
    // fire again.
    const hero = document.getElementById("hero");
    const io = hero
      ? new IntersectionObserver(
          ([entry]) => setOverHero(entry.isIntersecting),
          { rootMargin: "-72px 0px 0px 0px" },
        )
      : null;
    io?.observe(hero!);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [pathname]);

  // Escape closes, and the page behind the sheet must not scroll with it.
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  // An open sheet needs something solid behind the bar, whatever the scroll is.
  const solid = !atTop || open;

  const linkClass = cn(
    linkBase,
    dark
      ? "text-dark-body hover:text-dark-head"
      : "text-ink-soft hover:text-ink",
  );

  return (
    // The menu is a sibling, not a child: the bar carries backdrop-filter,
    // which makes it the containing block for fixed descendants, so a panel
    // nested inside would resolve top/bottom against 72px and collapse to
    // zero height.
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 h-[72px] border-b transition-[background-color,border-color,backdrop-filter] duration-300 ease-out",
          // Over a hero the bar is bare until you scroll, then it takes a tint so
          // hero content passing underneath stays screened off.
          dark && !solid && "border-transparent bg-transparent",
          dark &&
            solid &&
            "border-transparent bg-[rgba(22,24,28,0.82)] backdrop-blur-xl",
          !dark &&
            "border-black/[0.06] bg-[rgba(244,244,238,0.72)] backdrop-blur-xl",
        )}
      >
        <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between px-6">
          {/* Both variants are stacked and cross-faded: swapping src would flash
            on the first scroll, and they share a bounding box so nothing moves. */}
          <Link
            href="/"
            aria-label={`${site.name} home`}
            onClick={() => setOpen(false)}
            className="relative block rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-current"
          >
            <BrandLogo
              tone="light"
              priority
              className={cn(
                "h-[21px] transition-opacity duration-300 ease-out",
                dark ? "opacity-100" : "opacity-0",
              )}
            />
            <BrandLogo
              tone="dark"
              priority
              className={cn(
                "absolute inset-0 h-[21px] transition-opacity duration-300 ease-out",
                dark ? "opacity-0" : "opacity-100",
              )}
            />
          </Link>

          <nav
            aria-label="Primary"
            className="nav:flex absolute left-1/2 hidden -translate-x-1/2 items-center gap-9"
          >
            {nav.links.map((link) => (
              <a key={link.href} href={link.href} className={linkClass}>
                {link.label}
                <span aria-hidden className={underline} />
              </a>
            ))}
          </nav>

          <div className="nav:gap-7 flex items-center gap-3">
            <a
              href={nav.cta.href}
              className={cn(
                "bg-brand text-ink hover:bg-brand-hover inline-flex h-[42px] items-center rounded-full px-5 text-[14px] font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current",
                // The sheet carries its own full-width CTA, so the bar does not
                // need to show the same button four inches above it.
                open && "max-nav:hidden",
              )}
            >
              {nav.cta.label}
            </a>

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((value) => !value)}
              className={cn(
                "nav:hidden -mr-2 grid size-11 shrink-0 place-items-center rounded-[10px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
                dark ? "text-dark-head" : "text-ink",
              )}
            >
              <Burger open={open} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={open} dark={dark} onClose={() => setOpen(false)} />
    </>
  );
}

/** Three rules that fold into a cross. Drawn rather than swapped for an icon
 *  so the two states animate into each other. */
function Burger({ open }: { open: boolean }) {
  const rule =
    "absolute left-1/2 h-[1.5px] w-[19px] -translate-x-1/2 rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]";

  return (
    <span aria-hidden className="relative block size-5">
      <span
        className={cn(
          rule,
          open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[5px]",
        )}
      />
      <span
        className={cn(
          rule,
          "top-1/2 -translate-y-1/2 transition-opacity",
          open && "opacity-0",
        )}
      />
      <span
        className={cn(
          rule,
          open ? "top-1/2 -translate-y-1/2 -rotate-45" : "top-[13px]",
        )}
      />
    </span>
  );
}

function MobileMenu({
  open,
  dark,
  onClose,
}: {
  open: boolean;
  dark: boolean;
  onClose: () => void;
}) {
  return (
    <div
      id="mobile-menu"
      // Kept mounted so it can transition, and inert to pointers and tab order
      // while closed.
      className={cn(
        "nav:hidden fixed inset-x-0 top-[72px] bottom-0 z-40 origin-top transition-[opacity,transform] duration-300 ease-[cubic-bezier(.16,1,.3,1)]",
        open
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2 opacity-0",
        dark
          ? "bg-[rgba(22,24,28,0.97)] backdrop-blur-xl"
          : "bg-[rgba(244,244,238,0.97)] backdrop-blur-xl",
      )}
      inert={!open}
    >
      <nav
        aria-label="Mobile"
        className="mx-auto flex w-full max-w-[1280px] flex-col px-6 pt-4"
      >
        {nav.links.map((link, i) => (
          <a
            key={link.href}
            href={link.href}
            onClick={onClose}
            style={{ transitionDelay: open ? `${60 + i * 45}ms` : "0ms" }}
            className={cn(
              "font-display border-b py-5 text-[26px] leading-none font-bold tracking-[-0.035em] uppercase transition-[opacity,transform] duration-300 ease-out",
              open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
              dark
                ? "text-dark-head active:text-brand border-white/[0.08]"
                : "text-ink active:text-green-ink border-black/[0.07]",
            )}
          >
            {link.label}
          </a>
        ))}

        <a
          href={site.book}
          onClick={onClose}
          style={{
            transitionDelay: open ? `${60 + nav.links.length * 45}ms` : "0ms",
          }}
          className={cn(
            "bg-brand text-ink mt-7 inline-flex h-[54px] items-center justify-center rounded-full text-[15px] font-semibold transition-[opacity,transform] duration-300 ease-out",
            open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
          )}
        >
          {nav.cta.label}
        </a>
      </nav>
    </div>
  );
}
