import { UsersRound } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeading } from "@/components/admin/page-heading";
import { requireViewer } from "@/data/auth";
import { getPeople } from "@/data/resources";

export default async function PeoplePage() {
  const viewer = await requireViewer();
  const people = await getPeople(viewer);
  return (
    <div className="mx-auto max-w-[1480px]">
      <PageHeading
        eyebrow="Team"
        title={viewer.role === "owner" ? "People" : "My profile"}
        description={
          viewer.role === "owner"
            ? "Employment records and private documents stay separate from everyday project data."
            : "Your profile and documents are private to you and the owners."
        }
      />
      {people.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {people.map((person) => (
            <article
              key={person.id}
              className="rounded-[20px] border border-black/[0.07] bg-[#f8f8f3] p-5"
            >
              <div className="flex items-start justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-[#15181b] text-xs font-semibold text-[#2fe85c]">
                  {initials(person.fullName)}
                </span>
                <span className="rounded-full bg-black/[0.045] px-2.5 py-1 text-[9px] font-semibold text-black/45 capitalize">
                  {person.role}
                </span>
              </div>
              <h2 className="mt-5 text-[15px] font-semibold tracking-[-0.025em]">
                {person.fullName}
              </h2>
              <p className="mt-1 text-[11px] text-black/38">
                {person.active ? "Active team member" : "Archived"}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UsersRound}
          title="No people found"
          description="Invited team members will appear here after they create their account."
        />
      )}
    </div>
  );
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
