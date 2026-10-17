"use client";

import { track } from "@vercel/analytics";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { site } from "@/lib/content/site";
import { useConsent } from "@/lib/consent";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget(options: {
        url: string;
        parentElement: HTMLElement;
      }): void;
    };
  }
}

const copy = {
  heading: "The booking calendar is on Calendly",
  body: "It is a third party, and loading it lets Calendly store data in your browser. Nothing has been loaded yet.",
  load: "Load the calendar",
  alternative: "Or email us and we will find a time by hand:",
} as const;

/**
 * Calendly's script only scans the DOM on load, so a client-side navigation
 * into this page would land on an empty div. onReady fires on every mount
 * once the script is cached, which is where we initialise it by hand.
 *
 * Nothing third-party loads until it is allowed to: either the visitor
 * accepted the banner, or they pressed the button below, which is consent
 * for this one embed.
 */
export function CalendlyEmbed({ url }: { url: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [asked, setAsked] = useState(false);
  const allowed = useConsent() === "granted" || asked;

  const mount = () => {
    const el = host.current;
    if (!el || el.childElementCount || !window.Calendly) return;
    const embed = new URL(url);
    // We ask on our side instead, so Calendly stacking a second banner over
    // the picker would only be noise.
    embed.searchParams.set("hide_gdpr_banner", "1");
    window.Calendly.initInlineWidget({
      url: embed.toString(),
      parentElement: el,
    });
  };

  // Calendly talks to the parent page by postMessage. A booking is the one
  // thing on this site worth counting, and it happens inside the iframe where
  // nothing else can see it.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== "https://calendly.com") return;
      const name = (event.data as { event?: unknown } | null)?.event;
      if (name === "calendly.event_scheduled") track("Call booked");
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!allowed) {
    return (
      <div className="border-line bg-surface grid h-[1040px] w-full min-w-[280px] place-items-center rounded-[16px] border border-dashed px-6 text-center md:h-[700px]">
        <div className="max-w-[46ch]">
          <p className="font-display text-ink text-[clamp(17px,1.6vw,21px)] leading-[1.15] font-bold tracking-[-0.03em] uppercase">
            {copy.heading}
          </p>
          <p className="text-ink-soft mt-4 text-[14.5px] leading-[1.6]">
            {copy.body}
          </p>

          <button
            type="button"
            onClick={() => setAsked(true)}
            className="bg-brand text-ink hover:bg-brand-hover mt-7 inline-flex h-[52px] items-center rounded-full px-7 text-[15px] font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-current"
          >
            {copy.load}
          </button>

          <p className="text-dim mt-6 text-[13px] leading-[1.55]">
            {copy.alternative}{" "}
            <a
              href={`mailto:${site.email}`}
              className="hover:text-green-ink underline underline-offset-4 transition-colors duration-200"
            >
              {site.email}
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={host}
        className="h-[1040px] w-full min-w-[280px] md:h-[700px]"
        aria-label="Booking calendar"
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
        onReady={mount}
      />
    </>
  );
}
