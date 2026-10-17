import { Suspense } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { CaseStudyList } from "@/components/admin/cms/case-study-list";
import { ImportCaseStudies } from "@/components/admin/cms/import-case-studies";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeading } from "@/components/admin/page-heading";
import { PanelSkeleton } from "@/components/admin/skeletons";
import { requireRole } from "@/data/auth";
import { getAllCaseRecords } from "@/data/case-studies";

export default async function CmsPage() {
  await requireRole(["owner"]);

  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading title="Case studies" />
        <Link
          href="/cms/new"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-black px-5 text-[13px] font-semibold text-white transition-colors hover:bg-black/85"
        >
          <Plus className="size-4" />
          New case study
        </Link>
      </div>

      <p className="mt-2 max-w-[70ch] text-[12.5px] text-black/50">
        What is live here is what the website shows. Taking one off the site
        hides it from /work, the footer and search engines immediately.
      </p>

      <div className="mt-6">
        <Suspense fallback={<PanelSkeleton lines={5} />}>
          <CaseStudies />
        </Suspense>
      </div>
    </div>
  );
}

async function CaseStudies() {
  const records = await getAllCaseRecords();

  if (!records.length) {
    return (
      <EmptyState
        icon={FileText}
        title="Nothing here yet"
        description="The website is running on the case studies written into the code. Import them to start editing them here, or write a new one from scratch."
        action={<ImportCaseStudies />}
      />
    );
  }

  return <CaseStudyList records={records} />;
}
