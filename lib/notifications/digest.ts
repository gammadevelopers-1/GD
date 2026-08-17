import "server-only";

// Turns app_notification_digest() into the four emails Chunk 10 asks for.
// Deliberately plain text: an internal tool that sends marketing-shaped mail
// gets filtered, and then the important ones get missed too.

export type DigestItem = {
  project: string;
  label: string;
  week_number: number;
  due_on: string;
  state: "due" | "overdue";
};

export type DigestReminder = {
  profile_id: string;
  name: string;
  email: string | null;
  items: DigestItem[];
};

export type DigestProject = {
  id: string;
  name: string;
  client: string;
  status: string;
  lead: string | null;
  due_on: string | null;
  due_items: number;
  overdue_items: number;
};

export type Digest = {
  generated_on: string;
  horizon_days: number;
  owners: Array<{ name: string; email: string | null }>;
  projects: DigestProject[];
  reminders: DigestReminder[];
};

function day(value: string | null) {
  if (!value) return "no date";
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

// One person, one email, covering both what has slipped and what is close.
export function buildReminderEmail(reminder: DigestReminder) {
  const overdue = reminder.items.filter((item) => item.state === "overdue");
  const due = reminder.items.filter((item) => item.state === "due");

  const lines = [`Hello ${reminder.name.split(" ")[0]},`, ""];

  if (overdue.length) {
    lines.push(
      overdue.length === 1
        ? "One thing assigned to you is past its week:"
        : `${overdue.length} things assigned to you are past their week:`,
    );
    for (const item of overdue) {
      lines.push(`  · ${item.label} — ${item.project}, week ${item.week_number}, was due ${day(item.due_on)}`);
    }
    lines.push("");
  }

  if (due.length) {
    lines.push(
      due.length === 1 ? "Coming up:" : "Coming up:",
    );
    for (const item of due) {
      lines.push(`  · ${item.label} — ${item.project}, week ${item.week_number}, due ${day(item.due_on)}`);
    }
    lines.push("");
  }

  lines.push("Tick them off in the platform as you finish them.");

  const subject = overdue.length
    ? `${overdue.length} milestone${overdue.length === 1 ? "" : "s"} past due`
    : `${due.length} milestone${due.length === 1 ? "" : "s"} due soon`;

  return { subject, body: lines.join("\n") };
}

// The weekly owner summary: where projects stand, what has slipped.
export function buildOwnerSummaryEmail(digest: Digest) {
  const behind = digest.projects.filter((project) => project.overdue_items > 0);
  const onTrack = digest.projects.filter((project) => project.overdue_items === 0);

  const lines = [
    `Where delivery stands, ${day(digest.generated_on)}.`,
    "",
    `${digest.projects.length} active project${digest.projects.length === 1 ? "" : "s"}.`,
    "",
  ];

  if (behind.length) {
    lines.push("Behind:");
    for (const project of behind) {
      lines.push(
        `  · ${project.name} (${project.client}) — ${project.overdue_items} item${project.overdue_items === 1 ? "" : "s"} past their week` +
          (project.lead ? `, led by ${project.lead}` : ", no lead"),
      );
    }
    lines.push("");
  }

  if (onTrack.length) {
    lines.push("On track:");
    for (const project of onTrack) {
      lines.push(
        `  · ${project.name} (${project.client}) — ${project.status}` +
          (project.due_items ? `, ${project.due_items} due shortly` : "") +
          (project.due_on ? `, delivery ${day(project.due_on)}` : ""),
      );
    }
    lines.push("");
  }

  if (!digest.projects.length) {
    lines.push("Nothing active. If that is wrong, the platform is out of date.");
    lines.push("");
  }

  lines.push("Open the dashboard for the full picture.");

  return {
    subject: behind.length
      ? `Delivery summary — ${behind.length} project${behind.length === 1 ? "" : "s"} behind`
      : "Delivery summary — nothing overdue",
    body: lines.join("\n"),
  };
}
