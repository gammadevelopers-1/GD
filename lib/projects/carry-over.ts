import type { MilestoneWeek } from "@/data/project-detail";

export type CarryOver = {
  cardId: string;
  title: string;
  fromWeek: number;
  assignedName: string | null;
};

export function carryOverFor(
  week: MilestoneWeek,
  weeks: MilestoneWeek[],
  dismissed: Set<string>,
): CarryOver[] {
  const index = weeks.findIndex((entry) => entry.id === week.id);
  if (index < 1) return [];

  const previous = weeks[index - 1];
  const alreadyHere = new Set(
    week.workCards.map((card) => card.title.trim().toLowerCase()),
  );

  return previous.workCards
    .filter((card) => card.status !== "completed")
    .filter((card) => !dismissed.has(`${card.id}:${week.id}`))
    .filter((card) => !alreadyHere.has(card.title.trim().toLowerCase()))
    .map((card) => ({
      cardId: card.id,
      title: card.title,
      fromWeek: previous.number,
      assignedName: card.assignedName,
    }));
}
