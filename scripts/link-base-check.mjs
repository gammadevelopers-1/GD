import { decideLinkBase, normaliseOrigin } from "../lib/site/origin.ts";

let pass = 0, fail = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n         got ${a}\n        want ${e}`); }
}

console.log("\n1. Local dev, nothing configured");
check("localhost:3000 -> http origin",
  decideLinkBase({ host: "localhost:3000" }),
  { ok: true, origin: "http://localhost:3000" });
check("127.0.0.1:3000 -> http origin",
  decideLinkBase({ host: "127.0.0.1:3000" }),
  { ok: true, origin: "http://127.0.0.1:3000" });

console.log("\n2. Second allowed host, no code change");
check("allowlisted custom domain",
  decideLinkBase({ host: "portal.gamma.dev", allowedHosts: "portal.gamma.dev,gammadevelopers.com" }),
  { ok: true, origin: "https://portal.gamma.dev" });
check("second entry in the same allowlist",
  decideLinkBase({ host: "gammadevelopers.com", allowedHosts: "portal.gamma.dev,gammadevelopers.com" }),
  { ok: true, origin: "https://gammadevelopers.com" });

console.log("\n3. NEXT_PUBLIC_SITE_URL wins over the request host");
check("site url overrides a different host",
  decideLinkBase({ host: "whatever.example", siteUrl: "https://gammadevelopers.com/" }),
  { ok: true, origin: "https://gammadevelopers.com" });
check("site url overrides a forged host",
  decideLinkBase({ host: "evil.example", siteUrl: "https://gammadevelopers.com" }),
  { ok: true, origin: "https://gammadevelopers.com" });

console.log("\n4. Forged host is refused");
check("forged host, deployed with allowlist",
  decideLinkBase({ host: "evil.example", allowedHosts: "gammadevelopers.com", deployed: true }),
  { ok: false, reason: "untrusted-host" });
check("forged host, deployed via vercel url only",
  decideLinkBase({ host: "evil.example", vercelProductionUrl: "gd.vercel.app", deployed: true }),
  { ok: false, reason: "untrusted-host" });
check("forged host on a local box, nothing configured",
  decideLinkBase({ host: "evil.example" }),
  { ok: false, reason: "untrusted-host" });
check("localhost refused once deployed",
  decideLinkBase({ host: "localhost:3000", allowedHosts: "gammadevelopers.com", deployed: true }),
  { ok: false, reason: "untrusted-host" });

console.log("\n5. Never a relative or malformed base");
check("no host, nothing configured -> unconfigured",
  decideLinkBase({ host: null }),
  { ok: false, reason: "unconfigured" });
check("empty host string -> unconfigured",
  decideLinkBase({ host: "" }),
  { ok: false, reason: "unconfigured" });
check("host with credentials rejected",
  decideLinkBase({ host: "user:pw@evil.example", allowedHosts: "gd.com", deployed: true }),
  { ok: false, reason: "untrusted-host" });
check("host with a path rejected",
  decideLinkBase({ host: "gd.com/evil", allowedHosts: "gd.com", deployed: true }),
  { ok: false, reason: "untrusted-host" });
check("host with a comma rejected",
  decideLinkBase({ host: "gd.com,evil.example", allowedHosts: "gd.com", deployed: true }),
  { ok: false, reason: "untrusted-host" });

console.log("\n6. Proxy headers");
check("x-forwarded-proto https honoured",
  decideLinkBase({ host: "gd.com", proto: "https", allowedHosts: "gd.com" }),
  { ok: true, origin: "https://gd.com" });
check("x-forwarded-proto http honoured",
  decideLinkBase({ host: "gd.com", proto: "http", allowedHosts: "gd.com" }),
  { ok: true, origin: "http://gd.com" });
check("vercel production url as fallback when no host",
  decideLinkBase({ host: null, vercelProductionUrl: "gd.vercel.app" }),
  { ok: true, origin: "https://gd.vercel.app" });

console.log("\n7. normaliseOrigin");
check("trailing slashes stripped", normaliseOrigin("https://gd.com///"), "https://gd.com");
check("case folded", normaliseOrigin("HTTPS://GD.COM"), "https://gd.com");
check("bare host gets https", normaliseOrigin("gd.com"), "https://gd.com");
check("query rejected", normaliseOrigin("https://gd.com/?a=1"), null);
check("whitespace rejected", normaliseOrigin("https://gd .com"), null);

console.log("\n8. A stale localhost site url never reaches a deployed inbox");
check("localhost site url ignored, request host used",
  decideLinkBase({ host: "gammadevelopers.com", proto: "https", siteUrl: "http://localhost:3000", vercelProductionUrl: "gammadevelopers.com", deployed: true }),
  { ok: true, origin: "https://gammadevelopers.com" });
check("localhost site url ignored, vercel url used when no host",
  decideLinkBase({ host: null, siteUrl: "http://localhost:3000", vercelProductionUrl: "gd.vercel.app", deployed: true }),
  { ok: true, origin: "https://gd.vercel.app" });
check("localhost site url still honoured off a deployment",
  decideLinkBase({ host: "localhost:3000", siteUrl: "http://localhost:3000" }),
  { ok: true, origin: "http://localhost:3000" });

console.log("\n9. A deployed request host is never trusted on its own");
check("deployed host with no allowlist refused, not echoed back",
  decideLinkBase({ host: "gammadevelopers.com", proto: "https", deployed: true }),
  { ok: false, reason: "unconfigured" });
check("deployed forged host with no allowlist refused",
  decideLinkBase({ host: "evil.example", proto: "https", deployed: true }),
  { ok: false, reason: "unconfigured" });
check("deployed localhost host still refused",
  decideLinkBase({ host: "localhost:3000", deployed: true }),
  { ok: false, reason: "unconfigured" });
check("deployed host trusted once the platform url matches",
  decideLinkBase({ host: "gammadevelopers.com", proto: "https", vercelProductionUrl: "gammadevelopers.com", deployed: true }),
  { ok: true, origin: "https://gammadevelopers.com" });

console.log("\n10. Preview deployments");
check("vercel deployment url allowed",
  decideLinkBase({ host: "gd-git-feat.vercel.app", proto: "https", vercelProductionUrl: "gammadevelopers.com", vercelDeploymentUrl: "gd-git-feat.vercel.app", deployed: true }),
  { ok: true, origin: "https://gd-git-feat.vercel.app" });
check("forged host on a preview still refused",
  decideLinkBase({ host: "evil.example", vercelDeploymentUrl: "gd-git-feat.vercel.app", deployed: true }),
  { ok: false, reason: "untrusted-host" });

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
