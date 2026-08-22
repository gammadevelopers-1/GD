import { type ProjectStatus, isExitStatus } from "@/lib/projects/status";
import { TONE_FILL, TONE_INK, TONE_SOFT } from "@/lib/admin-ui";

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

export function timeAgo(value: string) {
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return formatDateShort(new Date(value).toISOString().slice(0, 10));
}

export function daysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

export function deadlineSignal(dueOn: string | null, status: ProjectStatus) {
  if (status === "closed")
    return { label: "Delivered", tone: "muted" as const };
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
  ok: TONE_INK.ok,
  warning: TONE_INK.warning,
  danger: TONE_INK.danger,
  muted: TONE_INK.muted,
};

export const TONE_CHIP: Record<SignalTone, string> = {
  ok: TONE_SOFT.ok,
  warning: TONE_SOFT.warning,
  danger: TONE_SOFT.danger,
  muted: TONE_SOFT.muted,
};

export const TONE_BAR: Record<SignalTone, string> = {
  ok: TONE_FILL.ok,
  warning: TONE_FILL.warning,
  danger: TONE_FILL.danger,
  muted: TONE_FILL.muted,
};
