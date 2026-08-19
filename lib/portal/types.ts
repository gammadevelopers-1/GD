import type { IdeaDoc } from "@/lib/projects/idea-doc";
import type { BannerFit } from "@/lib/projects/banner";
import type { ProjectStatus } from "@/lib/projects/status";

export type PortalItem = {
  id: string;
  title: string;
  done: boolean;
};

export type PortalWeek = {
  id: string;
  number: number;
  startsOn: string | null;
  dueOn: string;
  focus: string | null;
  completedAt: string | null;
  ideaDoc: IdeaDoc | null;
  items: PortalItem[];
};

export type PortalPerson = {
  name: string;
  responsibility: string | null;
  avatarUrl: string | null;
  isLead: boolean;
};

export type Portal = {
  project: {
    publicId: string;
    name: string;
    description: string | null;
    status: ProjectStatus;
    startsOn: string | null;
    dueOn: string | null;
    bannerUrl: string | null;
    bannerFit: BannerFit;
  };
  canEditMilestones: boolean;
  lastUpdatedAt: string | null;
  weeks: PortalWeek[];
  team: PortalPerson[];
};

export type PortalSummary = {
  total: number;
  done: number;
  percent: number;
  currentWeek: PortalWeek | null;
  nextItem: { title: string; dueOn: string; week: number } | null;
  overdueWeeks: number;
};

function isPast(iso: string, today: string) {
  return iso < today;
}

export function summarise(weeks: PortalWeek[], today: string): PortalSummary {
  const items = weeks.flatMap((week) => week.items);
  const done = items.filter((item) => item.done).length;
  const total = items.length;

  const currentWeek =
    weeks.find(
      (week) =>
        !week.completedAt &&
        (week.startsOn ? week.startsOn <= today : true) &&
        week.dueOn >= today,
    ) ??
    weeks.find((week) => !week.completedAt) ??
    null;

  let nextItem: PortalSummary["nextItem"] = null;
  for (const week of weeks) {
    const outstanding = week.items.find((item) => !item.done);
    if (outstanding) {
      nextItem = {
        title: outstanding.title,
        dueOn: week.dueOn,
        week: week.number,
      };
      break;
    }
  }

  const overdueWeeks = weeks.filter(
    (week) =>
      !week.completedAt &&
      isPast(week.dueOn, today) &&
      week.items.some((item) => !item.done),
  ).length;

  return {
    total,
    done,
    percent: total ? Math.round((done / total) * 100) : 0,
    currentWeek,
    nextItem,
    overdueWeeks,
  };
}

export function weekIsBehind(week: PortalWeek, today: string) {
  return (
    !week.completedAt &&
    isPast(week.dueOn, today) &&
    week.items.some((item) => !item.done)
  );
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
