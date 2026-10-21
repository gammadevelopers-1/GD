import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPage } from "@/components/common/legal-page";
import { legalBySlug } from "@/lib/content/legal";
import { pageMeta } from "@/lib/seo";

const doc = legalBySlug("terms");

export const metadata: Metadata = pageMeta({
  title: doc?.title ?? "Terms",
  description: doc?.intro ?? "",
  path: "/terms",
});

export default function TermsPage() {
  if (!doc) notFound();
  return <LegalPage doc={doc} />;
}
