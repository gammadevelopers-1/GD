import "server-only";

import { headers } from "next/headers";

export async function baseUrl() {
  const override = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (override) return override;

  const headerList = await headers();
  const host = headerList.get("host")?.trim();

  if (host) {
    const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
    return `${local ? "http" : "https"}://${host}`;
  }

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "";
}
