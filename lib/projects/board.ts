import { TONE_SOFT } from "@/lib/admin-ui";

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
  idea: TONE_SOFT.muted,
  in_progress: TONE_SOFT.info,
  blocked: TONE_SOFT.danger,
  completed: TONE_SOFT.ok,
  incomplete: TONE_SOFT.warning,
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
