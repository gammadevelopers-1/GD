"use client";

import { reopenConsent } from "@/lib/consent";

/** Reopens the consent banner. Changing an answer has to be as easy as giving
 *  it, and that is the half most sites leave out. */
export function ConsentLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={reopenConsent} className={className}>
      Cookie settings
    </button>
  );
}
