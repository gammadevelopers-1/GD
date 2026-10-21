import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPage } from "@/components/common/legal-page";
import { legalBySlug } from "@/lib/content/legal";
import { pageMeta } from "@/lib/seo";

const doc = legalBySlug("privacy");

export const metadata: Metadata = pageMeta({
  title: doc?.title ?? "Privacy",
  description: doc?.intro ?? "",
  path: "/privacy",
});

export default function PrivacyPage() {
  if (!doc) notFound();
  return <LegalPage doc={doc} />;
}
