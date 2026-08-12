import Link from "next/link";
import { ArrowLeft, FolderPlus } from "lucide-react";
import { requireRole } from "@/data/auth";
import { getProjectFormOptions } from "@/data/resources";
import { createProject } from "../actions";

export default async function NewProjectPage() {
  await requireRole(["owner"]);
  const options = await getProjectFormOptions();
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-black/42 hover:text-black"
      >
        <ArrowLeft className="size-3.5" /> Projects
      </Link>
      <div className="rounded-[24px] border border-black/[0.07] bg-[#f8f8f3] p-5 sm:p-7 lg:p-9">
        <span className="grid size-11 place-items-center rounded-xl bg-[#15181b] text-[#2fe85c]">
          <FolderPlus className="size-5" />
        </span>
        <h1 className="font-display mt-6 text-3xl font-semibold tracking-[-0.05em]">
          Create a project
        </h1>
        <p className="mt-2 text-sm leading-6 text-black/45">
          Start with the delivery basics. Team, milestones and technical details
          come next.
        </p>
        {options.clients.length ? (
          <form
            action={createProject}
            className="mt-8 grid gap-5 sm:grid-cols-2"
          >
            <Field
              label="Project name"
              name="name"
              placeholder="Client portal rebuild"
              required
            />
            <label className="space-y-2">
              <span className="text-xs font-medium text-black/55">Client</span>
              <select
                name="clientId"
                required
                className="h-11 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-sm outline-none focus:border-[#16a34a]"
              >
                <option value="">Select client</option>
                {options.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium text-black/55">
                Project lead
              </span>
              <select
                name="leadId"
                className="h-11 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-sm outline-none focus:border-[#16a34a]"
              >
                <option value="">Unassigned</option>
                {options.people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Start date" name="startsOn" type="date" />
            <Field label="Due date" name="dueOn" type="date" />
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-medium text-black/55">
                Description
              </span>
              <textarea
                name="description"
                rows={4}
                className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3 py-3 text-sm outline-none focus:border-[#16a34a]"
                placeholder="What are we building and why?"
              />
            </label>
            <div className="flex justify-end gap-3 border-t border-black/[0.06] pt-5 sm:col-span-2">
              <Link
                href="/projects"
                className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-medium text-black/45"
              >
                Cancel
              </Link>
              <button className="h-11 rounded-xl bg-[#15181b] px-5 text-sm font-semibold text-white">
                Create project
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-800">
            Add a client before creating a project.
          </div>
        )}
      </div>
    </div>
  );
}
function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium text-black/55">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-sm outline-none focus:border-[#16a34a]"
      />
    </label>
  );
}
