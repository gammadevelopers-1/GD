import { notFound } from "next/navigation";

import { CaseStudyForm } from "@/components/admin/cms/case-study-form";
import { PageHeading } from "@/components/admin/page-heading";
import { requireRole } from "@/data/auth";
import { getCaseRecord } from "@/data/case-studies";

export default async function EditCaseStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner"]);

  const { id } = await params;
  const record = await getCaseRecord(id);
  if (!record) notFound();

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeading title={record.study.title} />
      <p className="mt-2 mb-6 text-[12.5px] text-black/50">
        Changes reach the website as soon as you save, if this one is live.
      </p>
      <CaseStudyForm id={record.id} study={record.study} />
    </div>
  );
}
