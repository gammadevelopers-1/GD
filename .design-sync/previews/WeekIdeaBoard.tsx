import { WeekIdeaBoard } from "gd-website";

const ideaDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Dispatch agent — ideas" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Reads inbound carrier email, matches it against open lanes, and drafts a booking for a human to confirm.",
        },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Handle multi-leg loads" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Flag rate mismatches over 8%" }],
            },
          ],
        },
      ],
    },
  ],
};

const idle = { status: "idle" as const, message: null };
const save = async () => idle;
const upload = async () => ({
  status: "success" as const,
  message: null,
  path: "projects/northwind/attachment.png",
  name: "attachment.png",
  size: 45210,
});
const noop = () => {};

export function Editable() {
  return (
    <div style={{ height: 560 }} className="max-w-2xl overflow-hidden">
      <WeekIdeaBoard
        projectId="northwind-logistics"
        weekId="week-6"
        weekNumber={6}
        initialDoc={ideaDoc}
        canEdit={true}
        openTasks={2}
        updatedAt="2026-08-19T10:00:00.000Z"
        updatedBy="Maya Reyes"
        expanded={false}
        workOpen={false}
        onExpandedChange={noop}
        onOpenWork={noop}
        save={save}
        upload={upload}
      />
    </div>
  );
}

export function ViewOnly() {
  return (
    <div style={{ height: 560 }} className="max-w-2xl overflow-hidden">
      <WeekIdeaBoard
        projectId="harbor-freight"
        weekId="week-4"
        weekNumber={4}
        initialDoc={ideaDoc}
        canEdit={false}
        openTasks={0}
        updatedAt="2026-08-09T18:00:00.000Z"
        updatedBy="Priya Nair"
        expanded={false}
        workOpen={false}
        onExpandedChange={noop}
        onOpenWork={noop}
        save={save}
        upload={upload}
      />
    </div>
  );
}
