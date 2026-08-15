import { type ProjectStatus, isExitStatus } from "@/lib/projects/status";

export type SignalTone = "ok" | "warning" | "danger" | "muted";

export function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateShort(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatMoney(amount: number, currency: "PKR" | "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function daysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

/** The project due date read as a deadline, not as a health label. */
export function deadlineSignal(dueOn: string | null, status: ProjectStatus) {
  if (status === "closed") return { label: "Delivered", tone: "muted" as const };
  if (status === "paused") return { label: "Paused", tone: "muted" as const };
  if (!dueOn) return { label: "No due date", tone: "warning" as const };

  const days = daysUntil(dueOn);
  if (days < 0) {
    return { label: `${Math.abs(days)}d past due`, tone: "danger" as const };
  }
  if (days === 0) return { label: "Due today", tone: "warning" as const };
  if (days <= 14) return { label: `Due in ${days}d`, tone: "warning" as const };
  return { label: `Due in ${days}d`, tone: "ok" as const };
}

/**
 * The delivery signal is calculated from real milestone data — unfinished work
 * in past weeks first, then the approaching due date. Nobody selects it.
 */
export function deliverySignal(project: {
  status: ProjectStatus;
  dueOn: string | null;
  overdueItems: number;
  totalItems: number;
}): { label: string; tone: SignalTone } {
  if (isExitStatus(project.status)) {
    return {
      label: project.status === "paused" ? "Paused" : "Closed",
      tone: "muted",
    };
  }
  if (project.overdueItems > 0) {
    return {
      label: `${project.overdueItems} overdue`,
      tone: "danger",
    };
  }
  if (!project.totalItems) {
    return { label: "No plan yet", tone: "warning" };
  }
  if (project.dueOn && daysUntil(project.dueOn) < 0) {
    return { label: "Past due date", tone: "danger" };
  }
  return { label: "On track", tone: "ok" };
}

export const TONE_TEXT: Record<SignalTone, string> = {
  ok: "text-[#08743d]",
  warning: "text-amber-700",
  danger: "text-red-700",
  muted: "text-black/45",
};

export const TONE_CHIP: Record<SignalTone, string> = {
  ok: "border-[#2fe85c]/25 bg-[#2fe85c]/10 text-[#08743d]",
  warning: "border-amber-200/80 bg-amber-50 text-amber-700",
  danger: "border-red-200/80 bg-red-50 text-red-700",
  muted: "border-black/[0.07] bg-black/[0.035] text-black/45",
};

export const TONE_BAR: Record<SignalTone, string> = {
  ok: "bg-[#2fe85c]",
  warning: "bg-amber-400",
  danger: "bg-red-500",
  muted: "bg-black/20",
};
