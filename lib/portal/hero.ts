import type { Portal } from "@/lib/portal/types";
import { summarise, today } from "@/lib/portal/types";
import { formatDate } from "@/lib/projects/format";

export type HeroMeta = { label: string; value: string; note?: string };

export function heroMeta(portal: Portal): HeroMeta[] {
  const summary = summarise(portal.weeks, today());
  const lead = portal.team.find((person) => person.isLead);
  const closed = portal.weeks.filter((week) => week.completedAt).length;

  return [
    {
      label: "Project lead",
      value: lead?.name ?? "Unassigned",
    },
    {
      label: "Team",
      value: `${portal.team.length} ${portal.team.length === 1 ? "person" : "people"}`,
    },
    {
      label: "Due date",
      value: formatDate(portal.project.dueOn),
    },
    {
      label: "Milestones",
      value: portal.weeks.length
        ? `${closed}/${portal.weeks.length} weeks closed`
        : "Not planned",
      note: summary.total
        ? `${summary.done}/${summary.total} items done`
        : undefined,
    },
  ];
}
