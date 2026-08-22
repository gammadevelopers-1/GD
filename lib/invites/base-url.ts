import "server-only";

import { headers } from "next/headers";

import {
  type LinkBase,
  type LinkBaseFailure,
  decideLinkBase,
} from "@/lib/site/origin";

export type { LinkBase, LinkBaseFailure };

export async function resolveLinkBase(): Promise<LinkBase> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-host")?.split(",")[0]?.trim();

  return decideLinkBase({
    host: forwarded || headerList.get("host")?.trim() || null,
    proto: headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? null,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    allowedHosts: process.env.APP_ALLOWED_HOSTS,
    vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    vercelBranchUrl: process.env.VERCEL_BRANCH_URL,
    vercelDeploymentUrl: process.env.VERCEL_URL,
    deployed: Boolean(process.env.VERCEL?.trim()),
  });
}

export function linkBaseMessage(reason: LinkBaseFailure) {
  return reason === "untrusted-host"
    ? "That link could not be built: this address is not in APP_ALLOWED_HOSTS, so nothing was sent."
    : "That link could not be built: set NEXT_PUBLIC_SITE_URL or APP_ALLOWED_HOSTS, so nothing was sent.";
}
