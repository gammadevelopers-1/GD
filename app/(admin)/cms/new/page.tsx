import { CaseStudyForm } from "@/components/admin/cms/case-study-form";
import { PageHeading } from "@/components/admin/page-heading";
import { requireRole } from "@/data/auth";

export default async function NewCaseStudyPage() {
  await requireRole(["owner"]);

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeading title="New case study" />
      <p className="mt-2 mb-6 text-[12.5px] text-black/50">
        It is saved as a draft. Nothing appears on the site until you put it
        live.
      </p>
      <CaseStudyForm />
    </div>
  );
}
