import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPage } from "@/components/common/legal-page";
import { legalBySlug } from "@/lib/content/legal";

const doc = legalBySlug("privacy");

export const metadata: Metadata = {
  title: `Gamma — ${doc?.title ?? "Privacy"}`,
  description: doc?.intro,
};

export default function PrivacyPage() {
  if (!doc) notFound();
  return <LegalPage doc={doc} />;
}
