import { FilePenLine } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeading } from "@/components/admin/page-heading";
import { requireRole } from "@/data/auth";
import { getCmsPages } from "@/data/resources";

export default async function CmsPage() {
  await requireRole(["owner"]);
  const pages = await getCmsPages();
  return (
    <div className="mx-auto max-w-[1480px]">
      <PageHeading
        eyebrow="Public content boundary"
        title="CMS"
        description="Only published CMS records can be read by the marketing site. Internal app tables remain unreachable to anonymous visitors."
      />
      {pages.length ? (
        <div className="overflow-hidden rounded-[20px] border border-black/[0.07] bg-[#f8f8f3]">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between gap-4 border-b border-black/[0.055] px-5 py-4 last:border-0"
            >
              <div>
                <p className="text-sm font-semibold">{page.title}</p>
                <p className="mt-1 font-mono text-[9px] text-black/35">
                  /{page.slug}
                </p>
              </div>
              <span className="rounded-full bg-black/[0.045] px-2.5 py-1 text-[9px] font-semibold text-black/45 capitalize">
                {page.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FilePenLine}
          title="No CMS pages yet"
          description="The current marketing site remains code-driven. Add CMS content only when the team is maintaining it by hand."
        />
      )}
    </div>
  );
}
