export const BOARDS = ["idea", "work"] as const;
export type Board = (typeof BOARDS)[number];

export const CARD_STATUSES = [
  "idea",
  "in_progress",
  "blocked",
  "completed",
  "incomplete",
] as const;

export type CardStatus = (typeof CARD_STATUSES)[number];

export function isCardStatus(value: string): value is CardStatus {
  return (CARD_STATUSES as readonly string[]).includes(value);
}

export const CARD_STATUS_LABEL: Record<CardStatus, string> = {
  idea: "Idea",
  in_progress: "In progress",
  blocked: "Blocked",
  completed: "Completed",
  incomplete: "Not completed",
};

export const CARD_STATUS_CHIP: Record<CardStatus, string> = {
  idea: "border-black/[0.08] bg-black/[0.03] text-black/50",
  in_progress: "border-[#2fe85c]/35 bg-[#2fe85c]/10 text-[#08743d]",
  blocked: "border-red-200 bg-red-50 text-red-700",
  completed: "border-[#16a34a]/25 bg-[#16a34a]/10 text-[#0f7a37]",
  incomplete: "border-amber-200 bg-amber-50 text-amber-800",
};

export const WORK_ORDER: CardStatus[] = [
  "in_progress",
  "blocked",
  "completed",
  "incomplete",
];

export function workRank(status: CardStatus) {
  const index = WORK_ORDER.indexOf(status);
  return index === -1 ? WORK_ORDER.length : index;
}

export const NEXT_STATUSES: Record<CardStatus, CardStatus[]> = {
  idea: ["in_progress", "completed", "blocked"],
  in_progress: ["completed", "blocked", "incomplete", "idea"],
  blocked: ["in_progress", "completed", "incomplete"],
  completed: ["in_progress", "idea"],
  incomplete: ["in_progress", "completed", "idea"],
};

export function reasonFor(status: CardStatus): {
  required: boolean;
  label: string;
  placeholder: string;
} | null {
  if (status === "blocked") {
    return {
      required: true,
      label: "What is blocking it?",
      placeholder: "Waiting on the client's DNS change",
    };
  }
  if (status === "incomplete") {
    return {
      required: false,
      label: "Why did it not get finished?",
      placeholder: "Ran out of week after the scope grew",
    };
  }
  return null;
}
