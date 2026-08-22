import { EmptyState } from "gd-website";
import { Building2, FolderKanban, SearchX } from "lucide-react";

export function NoRecords() {
  return (
    <div className="bg-background p-8">
      <EmptyState
        icon={Building2}
        title="No clients yet"
        description="Add the first company, then invite them to a project from its page."
      />
    </div>
  );
}

export function WithAction() {
  return (
    <div className="bg-background p-8">
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Create one, add its team, then plan the first week."
        action={
          <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#15181b] px-4 text-xs font-semibold text-white transition hover:bg-black">
            New project
          </button>
        }
      />
    </div>
  );
}

export function FilteredEmpty() {
  return (
    <div className="bg-background p-8">
      <EmptyState
        icon={SearchX}
        title="Nothing matches these filters"
        description="Try a different status, client or person."
        action={
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/[0.09] bg-white px-4 text-xs font-semibold text-black/70 transition hover:border-black/20 hover:text-black">
            Clear filters
          </button>
        }
      />
    </div>
  );
}
