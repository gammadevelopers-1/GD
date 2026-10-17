import type { Metadata } from "next";

import { AuditBook } from "@/components/gamma/audit-book";
import { AuditHero } from "@/components/gamma/audit-hero";
import { AuditScope } from "@/components/gamma/audit-scope";
import { AuditSession } from "@/components/gamma/audit-session";
import { ObjectionsSection } from "@/components/gamma/objections-section";
import { audit } from "@/lib/content/audit";
import { site } from "@/lib/content/site";

export const metadata: Metadata = {
  title: `The audit · ${site.name}`,
  description: audit.hero.lead,
};

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
