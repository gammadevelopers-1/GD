export type NoticeTone = "ok" | "warning";

export type Notice = {
  tone: NoticeTone;
  title: string;
  description?: string;
};

export const PROJECT_NOTICES: Record<string, Notice> = {
  created: { tone: "ok", title: "Project created." },
  restored: {
    tone: "ok",
    title: "Project restored.",
    description: "It is back in the portfolio.",
  },
  archived: {
    tone: "warning",
    title: "Project archived.",
    description:
      "Members can no longer reach it — turn on the Archived filter to find or restore it.",
  },
  "value-not-saved": {
    tone: "warning",
    title: "The project was created, but its value was not recorded.",
    description: "Add it from Edit project.",
  },
};

export function readNotice(key: string | null | undefined): Notice | null {
  if (!key) return null;
  return PROJECT_NOTICES[key] ?? null;
}
