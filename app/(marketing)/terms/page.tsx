import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPage } from "@/components/common/legal-page";
import { legalBySlug } from "@/lib/content/legal";

const doc = legalBySlug("terms");

export const metadata: Metadata = {
  title: `Gamma — ${doc?.title ?? "Terms"}`,
  description: doc?.intro,
};

export default function TermsPage() {
  if (!doc) notFound();
  return <LegalPage doc={doc} />;
}
