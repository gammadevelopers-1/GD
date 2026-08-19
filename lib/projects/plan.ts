import type { CardStatus } from "@/lib/projects/board";

export type PlanItem = {
  id: string;
  title: string;
  status: CardStatus;
};

export type PlanWeek = {
  id: string;
  number: number;
  startsOn: string | null;
  dueOn: string;
  focus: string | null;
  completedAt: string | null;
  completedBy: string | null;
  isCurrent: boolean;
  isOverdue: boolean;
  done: number;
  total: number;
  items: PlanItem[];
};

export type WeekState = "complete" | "current" | "overdue" | "upcoming";

export type WeekStateInput = {
  completedAt: string | null;
  isOverdue: boolean;
  isCurrent: boolean;
};

export function weekState(week: WeekStateInput): WeekState {
  if (week.completedAt) return "complete";
  if (week.isOverdue) return "overdue";
  if (week.isCurrent) return "current";
  return "upcoming";
}

export const WEEK_STATE_LABEL: Record<WeekState, string> = {
  complete: "Complete",
  current: "Current",
  overdue: "Overdue",
  upcoming: "Upcoming",
};

export function nextWeekNumber(weeks: Array<{ number: number }>) {
  return weeks.reduce((highest, week) => Math.max(highest, week.number), 0) + 1;
}

export function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
