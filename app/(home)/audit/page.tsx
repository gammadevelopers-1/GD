import type { Metadata } from "next";

import { AuditBook } from "@/components/gamma/audit-book";
import { AuditHero } from "@/components/gamma/audit-hero";
import { AuditScope } from "@/components/gamma/audit-scope";
import { AuditSession } from "@/components/gamma/audit-session";
import { ObjectionsSection } from "@/components/gamma/objections-section";
import { audit } from "@/lib/content/audit";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "The audit",
  description: audit.hero.lead,
  path: "/audit",
});

export default function AuditPage() {
  return (
    <main id="top">
      <AuditHero />
      <AuditScope />
      <AuditSession />
      <ObjectionsSection />
      <AuditBook />
    </main>
  );
}
