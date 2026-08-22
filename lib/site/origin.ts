export type LinkBaseFailure = "unconfigured" | "untrusted-host";

export type LinkBase =
  | { ok: true; origin: string }
  | { ok: false; reason: LinkBaseFailure };

export type LinkBaseInput = {
  host: string | null;
  proto?: string | null;
  siteUrl?: string;
  allowedHosts?: string;
  vercelProductionUrl?: string;
  vercelBranchUrl?: string;
  deployed?: boolean;
};

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function normaliseOrigin(
  value: string | undefined | null,
): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "");
  if (!trimmed || /[\s,]/.test(trimmed)) return null;

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.username || url.password) return null;
    if (url.pathname !== "/" || url.search || url.hash) return null;
    return `${url.protocol}//${url.host.toLowerCase()}`;
  } catch {
    return null;
  }
}

export function hostOfOrigin(origin: string | null) {
  if (!origin) return null;
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return null;
  }
}

function hostnameOf(host: string) {
  return host.startsWith("[")
    ? (host.split("]")[0] ?? host) + "]"
    : (host.split(":")[0] ?? host);
}

function allowlistOf(input: LinkBaseInput) {
  const hosts = new Set<string>();
  const sources = [
    ...(input.allowedHosts ?? "").split(","),
    input.vercelProductionUrl ?? "",
    input.vercelBranchUrl ?? "",
  ];

  for (const entry of sources) {
    const host = hostOfOrigin(normaliseOrigin(entry));
    if (host) hosts.add(host);
  }

  return hosts;
}

export function decideLinkBase(input: LinkBaseInput): LinkBase {
  const configured = normaliseOrigin(input.siteUrl);
  if (configured) return { ok: true, origin: configured };

  const allowed = allowlistOf(input);
  const host = input.host ? input.host.trim().toLowerCase() : null;

  if (host) {
    const hostname = hostnameOf(host);
    const local = LOCAL_HOSTNAMES.has(hostname);
    const proto = input.proto?.trim().toLowerCase();
    const scheme =
      proto === "http" || proto === "https" ? proto : local ? "http" : "https";

    if (allowed.has(host) || (!input.deployed && local)) {
      const origin = normaliseOrigin(`${scheme}://${host}`);
      if (origin) return { ok: true, origin };
    }

    if (allowed.size > 0) return { ok: false, reason: "untrusted-host" };
  }

  const fallback = normaliseOrigin(input.vercelProductionUrl);
  if (fallback) return { ok: true, origin: fallback };

  return { ok: false, reason: host ? "untrusted-host" : "unconfigured" };
}

export function configuredOrigin(): string | null {
  return (
    normaliseOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normaliseOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  );
}
