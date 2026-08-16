import Link from "next/link";
import { ArrowLeft, FolderPlus } from "lucide-react";
import { ProjectForm } from "@/components/admin/projects/project-form";
import { requireRole } from "@/data/auth";
import { getProjectFormOptions } from "@/data/project-detail";
import type { ProjectFormValues } from "@/lib/projects/validation";
import { createProject } from "../actions";

export const metadata = { title: "New project · Internal platform" };

export default async function NewProjectPage() {
  await requireRole(["owner"]);
  const options = await getProjectFormOptions();
  const today = new Date().toISOString().slice(0, 10);

  const defaults: ProjectFormValues = {
    name: "",
    clientId: "",
    description: "",
    leadId: "",
    startsOn: today,
    dueOn: "",
    status: "discovery",
    valueAmount: "",
    valueCurrency: "USD",
    exchangeRate: "",
    bookedOn: today,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/projects"
        className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-black/42 transition hover:text-black"
      >
        <ArrowLeft className="size-3.5" /> Projects
      </Link>

      <div className="rounded-[18px] border border-black/[0.07] bg-white/60 p-5 backdrop-blur-sm sm:p-7">
        <span className="grid size-11 place-items-center rounded-xl bg-[#15181b] text-[#2fe85c]">
          <FolderPlus className="size-5" />
        </span>
        <h1 className="font-display mt-5 text-[1.75rem] leading-none font-semibold tracking-[-0.045em]">
          Create a project
        </h1>
        <p className="mt-2.5 max-w-xl text-sm leading-6 text-black/45">
          Delivery basics first. The team, weekly milestones and technical
          details are added inside the project once it exists.
        </p>

        <div className="mt-7">
          {options.clients.length ? (
            <ProjectForm
              mode="create"
              action={createProject}
              clients={options.clients}
              people={options.people}
              defaults={defaults}
              cancelHref="/projects"
            />
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Add a client before creating a project. A project always belongs
              to one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
