import { Suspense } from "react";
import { FilePenLine } from "lucide-react";
import { ComingSoon } from "@/components/admin/coming-soon";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeading } from "@/components/admin/page-heading";
import { PanelSkeleton } from "@/components/admin/skeletons";
import { requireRole } from "@/data/auth";
import { getCmsPages } from "@/data/resources";

export default async function CmsPage() {
  await requireRole(["owner"]);
  return (
    <div className="mx-auto max-w-[1480px]">
      <PageHeading title="CMS" />
      <ComingSoon
        title="CMS authoring and publishing"
        description="Content records can be listed today, but the writing workflow is not ready. Drafting, previewing, publishing and revision history will arrive here."
        items={["Content editor", "Live preview", "Publishing", "Revisions"]}
      />
      <div className="mt-6">
        <Suspense fallback={<PanelSkeleton lines={5} />}>
          <CmsPageList />
        </Suspense>
      </div>
    </div>
  );
}

async function CmsPageList() {
  const pages = await getCmsPages();
  return (
    <>
      {pages.length ? (
        <div className="overflow-hidden rounded-[20px] border border-black/[0.07] bg-[#f8f8f3]">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between gap-4 border-b border-black/[0.055] px-5 py-4 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{page.title}</p>
                <p className="mt-1 truncate font-mono text-[9px] text-black/35">
                  /{page.slug}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-black/[0.045] px-2.5 py-1 text-[9px] font-semibold text-black/45 capitalize">
                {page.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FilePenLine}
          title="No CMS pages yet"
          description="The marketing site remains code-driven until the authoring workflow is ready."
        />
      )}
    </>
  );
}
