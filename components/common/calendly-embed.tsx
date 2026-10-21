"use client";

import { track } from "@vercel/analytics";
import Script from "next/script";
import { useEffect, useRef } from "react";


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

/**
 * Calendly's script only scans the DOM on load, so a client-side navigation
 * into this page would land on an empty div. onReady fires on every mount
 * once the script is cached, which is where we initialise it by hand.
 *
 * It loads on its own. Someone on this page is here to book a call, and a
 * button in front of the calendar is a door in front of the thing they came
 * for. The privacy page says the embed loads when you open the booking page,
 * which is what this does.
 */
export function CalendlyEmbed({ url }: { url: string }) {
  const host = useRef<HTMLDivElement>(null);

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
