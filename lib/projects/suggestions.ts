import type { MilestoneWeek } from "@/data/project-detail";
import type { CardStatus } from "@/lib/projects/board";

export type WorkSuggestion = {
  cardId: string;
  title: string;
  status: CardStatus;
  weekNumber: number;
  weekDueOn: string;
  createdBy: string | null;
  reason: string | null;
};

export type SuggestionGroup = {
  weekNumber: number;
  weekDueOn: string;
  items: WorkSuggestion[];
};

const UNFINISHED: CardStatus[] = ["in_progress", "blocked", "incomplete"];

export function unfinishedByWeek(
  weeks: MilestoneWeek[],
  today = new Date().toISOString().slice(0, 10),
): SuggestionGroup[] {
  return weeks
    .filter((week) => week.dueOn < today)
    .map((week) => ({
      weekNumber: week.number,
      weekDueOn: week.dueOn,
      items: week.workCards
        .filter((card) => UNFINISHED.includes(card.status))
        .map((card) => ({
          cardId: card.id,
          title: card.title,
          status: card.status,
          weekNumber: week.number,
          weekDueOn: week.dueOn,
          createdBy: card.createdBy,
          reason: card.blockerReason ?? card.carryReason,
        })),
    }))
    .filter((group) => group.items.length > 0)
    .sort((a, b) => b.weekNumber - a.weekNumber);
}
