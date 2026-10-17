"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { onReopen, setConsent, useConsent } from "@/lib/consent";
import { cn } from "@/lib/utils";

const copy = {
  heading: "Measurement and third parties",
  body: "We count which pages get read \u2014 nothing that follows you to another site, and no advertising. Booking a call loads Calendly, a third party that stores data of its own.",
  essential:
    "Sign-in cookies are necessary for the site to work and stay either way.",
  accept: "Accept",
  decline: "Decline",
  privacy: "Read the policy.",
} as const;

export function ConsentBanner() {
  const consent = useConsent();
  const [reopened, setReopened] = useState(false);

  useEffect(() => onReopen(() => setReopened(true)), []);

  // "unknown" is the server's answer, so nothing renders until hydration and
  // the markup never disagrees with itself.
  const open = consent === "unanswered" || reopened;
  if (consent === "unknown" || !open) return null;

  const choose = (value: "granted" | "denied") => {
    setConsent(value);
    setReopened(false);
  };

  const button =
    "h-[46px] rounded-full px-6 text-[14px] font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-current";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={copy.heading}
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-5"
    >
      <div className="bg-dark mx-auto w-full max-w-[1280px] overflow-hidden rounded-[18px] border border-white/[0.11] p-[clamp(20px,2.4vw,30px)] shadow-[0_28px_70px_-40px_rgba(10,11,12,0.85)]">
        <div className="flex flex-col gap-y-6 lg:flex-row lg:items-center lg:gap-x-10">
          <div className="min-w-0 flex-1">
            <p className="font-display text-dark-head text-[15px] leading-none font-bold tracking-[-0.03em] uppercase">
              {copy.heading}
            </p>
            <p className="text-dark-body mt-3 max-w-[72ch] text-[14px] leading-[1.6]">
              {copy.body}
            </p>
            <p className="text-dim-dark mt-2 max-w-[72ch] text-[13px] leading-[1.55]">
              {copy.essential}{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 transition-colors duration-200 hover:text-[#eceae2]"
              >
                {copy.privacy}
              </Link>
            </p>
          </div>

          {/* Refusing is the same size, the same shape and the same distance
              away as accepting. A banner where it is not does not collect
              consent, it collects clicks. */}
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => choose("denied")}
              className={cn(
                button,
                "text-dark-head border border-white/15 hover:border-white/30",
              )}
            >
              {copy.decline}
            </button>
            <button
              type="button"
              onClick={() => choose("granted")}
              className={cn(button, "bg-brand text-ink hover:bg-brand-hover")}
            >
              {copy.accept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
