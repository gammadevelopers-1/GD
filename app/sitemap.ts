import type { MetadataRoute } from "next";

import { getPublishedCases } from "@/data/case-studies";
import { legalDocuments } from "@/lib/content/legal";
import { services } from "@/lib/content/services";
import { configuredOrigin } from "@/lib/site/origin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = configuredOrigin() ?? "http://localhost:3000";
  const updated = new Date();

  const staticPaths = ["", "/audit", "/book", "/work", "/about", "/contact"];
  const legalPaths = legalDocuments.map((doc) => `/${doc.slug}`);
  const servicePaths = services.map((service) => `/services/${service.slug}`);
  const casePaths = (await getPublishedCases()).map((item) => `/work/${item.slug}`);

  return [...staticPaths, ...servicePaths, ...casePaths, ...legalPaths].map(
    (path) => ({
      url: `${origin}${path}`,
      lastModified: updated,
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority:
        path === "" ? 1 : path === "/audit" || path === "/book" ? 0.9 : 0.6,
    }),
  );
}
