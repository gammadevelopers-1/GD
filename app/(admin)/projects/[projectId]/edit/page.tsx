import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { ArchiveControl } from "@/components/admin/projects/lifecycle-controls";
import { ProjectForm } from "@/components/admin/projects/project-form";
import { requireRole } from "@/data/auth";
import {
  getProjectDetail,
  getProjectFinancial,
  getProjectFormOptions,
} from "@/data/project-detail";
import type { ProjectFormValues } from "@/lib/projects/validation";
import {
  type ProjectTab,
  isProjectTab,
  projectTabHref,
} from "@/lib/projects/tabs";
import { archiveProject, restoreProject, updateProject } from "../../actions";

export const metadata = { title: "Edit project · Internal platform" };

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const viewer = await requireRole(["owner"]);
  const { projectId: publicId } = await params;
  const { from } = await searchParams;
  const returnTab: ProjectTab = isProjectTab(from) ? from : "overview";

  const project = await getProjectDetail(publicId, viewer);
  if (!project) notFound();

  const [financial, options] = await Promise.all([
    getProjectFinancial(project.id, viewer),
    getProjectFormOptions(),
  ]);

  const defaults: ProjectFormValues = {
    name: project.name,
    clientId: project.clientId ?? "",
    description: project.description ?? "",
    leadId: project.leadId ?? "",
    startsOn: project.startsOn ?? "",
    dueOn: project.dueOn ?? "",
    status: project.status,
    valueAmount: financial ? String(financial.amount) : "",
    valueCurrency: financial?.currency ?? "USD",
    exchangeRate: financial ? String(financial.rate) : "",
    bookedOn: financial?.bookedOn ?? new Date().toISOString().slice(0, 10),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href={projectTabHref(project.publicId, returnTab)}
        className="inline-flex items-center gap-2 text-xs font-medium text-black/42 transition hover:text-black"
      >
        <ArrowLeft className="size-3.5" /> {project.name}
      </Link>

      <div className="card-surface rounded-2xl border border-black/[0.06] p-5 sm:p-7">
        <span className="grid size-11 place-items-center rounded-xl bg-[#15181b] text-[#2fe85c]">
          <SlidersHorizontal className="size-5" />
        </span>
        <h1 className="font-display mt-5 text-[1.75rem] leading-none font-semibold tracking-[-0.045em]">
          Edit project
        </h1>

        <div className="mt-7">
          <ProjectForm
            mode="edit"
            action={updateProject}
            clients={options.clients}
            people={options.people}
            defaults={defaults}
            projectId={project.id}
            cancelHref={projectTabHref(project.publicId, returnTab)}
            returnTo={returnTab}
          />
        </div>
      </div>

      <ArchiveControl
        projectId={project.id}
        isArchived={project.isArchived}
        archiveAction={archiveProject}
        restoreAction={restoreProject}
      />
    </div>
  );
}
