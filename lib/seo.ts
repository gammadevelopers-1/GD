import type { Metadata } from "next";

import { site } from "@/lib/content/site";
import { configuredOrigin } from "@/lib/site/origin";

/**
 * Page metadata in one place, so every route gets the same three things:
 * a canonical URL, a social preview describing that page rather than the
 * site, and a title the layout's template can finish.
 *
 * Pages must not append the brand themselves. The root layout's
 * `title.template` already does, and doing both produced titles reading
 * "About · Gamma Developers · Gamma Developers" on every page of the site.
 */

/** Longest a title can be before Google starts truncating it, brand included. */
const TITLE_BUDGET = 60;

/** The site-wide social card. An explicit `openGraph` object overrides
 *  Next.js file conventions entirely, so naming the image here is not
 *  belt-and-braces: without it every page shipped with no og:image at all
 *  and link previews rendered as a bare URL. */
export const OG_IMAGE = "/opengraph-image.jpg";

export function absoluteUrl(path = "/") {
  const origin = configuredOrigin() ?? "http://localhost:3000";
  return path === "/" ? origin : `${origin}${path}`;
}

export type PageMeta = {
  /** Without the brand — the layout template appends it. */
  title: string;
  description: string;
  /** Route path, leading slash, used for the canonical. */
  path: string;
  /** Overrides the site-wide opengraph-image for this page. */
  image?: string;
  type?: "website" | "article";
  /** Skip the layout's "%s · Gamma Developers" template. The home page
   *  already names the brand, so templating would say it twice. */
  absoluteTitle?: boolean;
};

export function pageMeta({
  title,
  description,
  path,
  image,
  type = "website",
  absoluteTitle,
}: PageMeta): Metadata {
  const url = absoluteUrl(path);
  const social = absoluteTitle ? title : `${title} · ${site.name}`;
  const card = absoluteUrl(image ?? OG_IMAGE);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: site.name,
      title: social,
      description,
      images: [{ url: card, width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: social,
      description,
      images: [card],
    },
  };
}

/**
 * Headlines on the case studies run to ninety characters, which a search
 * result cuts off mid-sentence. This keeps the whole headline for the page
 * itself and gives the tab and the result something that ends on a word.
 */
export function clipTitle(value: string, budget = TITLE_BUDGET) {
  const room = budget - site.name.length - 3;
  if (value.length <= room) return value;

  const cut = value.slice(0, room);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > room * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:—-]+$/, "")}…`;
}
