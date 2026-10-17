"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { useConsent } from "@/lib/consent";

/** The public pages, and only those. Everything behind a login — the console,
 *  the client portal — puts client, project and profile ids in the URL, and
 *  those have no business in an analytics product. Allow-list rather than
 *  deny-list, so a route added later is private until someone says otherwise. */
const PUBLIC_PAGES = new Set([
  "/",
  "/about",
  "/audit",
  "/book",
  "/contact",
  "/privacy",
  "/terms",
  "/work",
]);

const PUBLIC_TREES = ["/work/", "/services/"];

function isPublic(url: string) {
  let path: string;

  try {
    // Absolute in the browser, but parse defensively either way.
    path = new URL(url, "http://localhost").pathname;
  } catch {
    return false;
  }

  const clean = path.replace(/\/+$/, "") || "/";
  return (
    PUBLIC_PAGES.has(clean) || PUBLIC_TREES.some((tree) => path.startsWith(tree))
  );
}

/** Vercel Web Analytics and Speed Insights. Neither sets a cookie nor reads
 *  one, so neither legally needs consent — but the banner asks anyway, and
 *  this honours the answer: until someone accepts, the scripts are not even
 *  fetched. Returning null from beforeSend is the second line, dropping a
 *  datapoint in the browser before anything is sent. */
export function SiteAnalytics() {
  if (useConsent() !== "granted") return null;

  return (
    <>
      <Analytics beforeSend={(event) => (isPublic(event.url) ? event : null)} />
      <SpeedInsights
        beforeSend={(event) => (isPublic(event.url) ? event : null)}
      />
    </>
  );
}
