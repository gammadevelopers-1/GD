import { site } from "@/lib/content/site";
import { absoluteUrl } from "@/lib/seo";

/**
 * Structured data, so a search engine reads the page as a thing rather than
 * as prose: who the company is, where a page sits in the site, and what a
 * case study is about.
 *
 * Rendered as a plain script tag rather than next/script, because this has
 * to be in the HTML a crawler receives, not injected afterwards.
 */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is our own content, and JSON.stringify escapes it. The
      // one character that still matters inside a script element is "<".
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** The company, once, on every page. */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${absoluteUrl("/")}#organization`,
        name: site.name,
        legalName: site.legalName,
        url: absoluteUrl("/"),
        logo: absoluteUrl("/icon.png"),
        image: absoluteUrl("/opengraph-image.png"),
        description:
          "AI agents and workflow automation for small and medium businesses, built into how the business actually runs.",
        email: site.email,
        telephone: site.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: site.address.line1,
          addressLocality: "Albuquerque",
          addressRegion: "NM",
          postalCode: "87110",
          addressCountry: "US",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          email: site.email,
          telephone: site.phone,
          availableLanguage: ["English"],
        },
      }}
    />
  );
}

/** The site itself, which is what a sitelinks search box reads. */
export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${absoluteUrl("/")}#website`,
        name: site.name,
        url: absoluteUrl("/"),
        publisher: { "@id": `${absoluteUrl("/")}#organization` },
      }}
    />
  );
}

/** Where a page sits, which is what a result's breadcrumb line shows. */
export function BreadcrumbJsonLd({
  trail,
}: {
  trail: readonly { name: string; path: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map((step, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: step.name,
          item: absoluteUrl(step.path),
        })),
      }}
    />
  );
}

/** A case study, as a piece of work with an author and a subject. */
export function CaseStudyJsonLd({
  title,
  description,
  path,
  image,
  sector,
  region,
}: {
  title: string;
  description: string;
  path: string;
  image: string;
  sector: string;
  region: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        url: absoluteUrl(path),
        image: absoluteUrl(image),
        about: sector,
        contentLocation: { "@type": "Place", name: region },
        author: { "@id": `${absoluteUrl("/")}#organization` },
        publisher: { "@id": `${absoluteUrl("/")}#organization` },
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      }}
    />
  );
}

/** A service page, so it can surface as an offering rather than a document. */
export function ServiceJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name,
        description,
        url: absoluteUrl(path),
        serviceType: name,
        provider: { "@id": `${absoluteUrl("/")}#organization` },
        areaServed: { "@type": "Place", name: "Worldwide" },
      }}
    />
  );
}
