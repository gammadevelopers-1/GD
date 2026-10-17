import type { MetadataRoute } from "next";

import { configuredOrigin } from "@/lib/site/origin";

export default function robots(): MetadataRoute.Robots {
  const origin = configuredOrigin() ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/projects",
          "/people",
          "/clients",
          "/cms",
          "/portal",
          "/login",
          "/set-password",
          "/api",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
