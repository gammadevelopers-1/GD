import { ProjectWorkspace } from "gd-website";

const ideaDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Onboarding call notes" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Northwind runs dispatch out of a shared inbox. Someone re-keys every booking into their TMS by hand.",
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
              content: [{ type: "text", text: "Inbox volume: ~140/day" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Two dispatchers, one backup" }],
            },
          ],
        },
      ],
    },
  ],
};

const workDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Week 6 plan" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Wire the carrier reply parser to the booking API and confirm within 5 minutes.",
        },
      ],
    },
  ],
};

const suggestions = [
  {
    weekNumber: 4,
    weekDueOn: "2026-08-01",
    items: [
      {
        cardId: "card-1",
        title: "Map carrier reply fields to TMS booking schema",
        status: "in_progress" as const,
        weekNumber: 4,
        weekDueOn: "2026-08-01",
        createdBy: "Amara Chen",
        reason: "Waiting on TMS sandbox access.",
      },
      {
        cardId: "card-2",
        title: "Confirm SLA copy with client",
        status: "blocked" as const,
        weekNumber: 4,
        weekDueOn: "2026-08-01",
        createdBy: "Farrukh Iqbal",
        reason: null,
      },
    ],
  },
];

const idle = { status: "idle" as const, message: null };
async function save() {
  return idle;
}
async function organise() {
  return { status: "success" as const, message: null, doc: workDoc };
}
async function upload() {
  return { status: "success" as const, message: null, path: null, name: null };
}

export function IdeaMode() {
  return (
    <div className="bg-background p-4" style={{ width: 900, height: 620 }}>
      <ProjectWorkspace
        projectId="northwind-logistics"
        initialMode="idea"
        idea={{ doc: ideaDoc, updatedAt: "2026-08-19T14:02:00Z", updatedBy: "Amara Chen" }}
        work={{ doc: { type: "doc", content: [] }, updatedAt: null, updatedBy: null }}
        canEdit
        aiReady
        suggestions={suggestions}
        saveIdea={save}
        saveWork={save}
        organise={organise}
        upload={upload}
      />
    </div>
  );
}

export function WorkMode() {
  return (
    <div className="bg-background p-4" style={{ width: 900, height: 620 }}>
      <ProjectWorkspace
        projectId="northwind-logistics"
        initialMode="work"
        idea={{ doc: ideaDoc, updatedAt: "2026-08-19T14:02:00Z", updatedBy: "Amara Chen" }}
        work={{ doc: workDoc, updatedAt: "2026-08-20T09:15:00Z", updatedBy: "Farrukh Iqbal" }}
        canEdit
        aiReady
        suggestions={[]}
        saveIdea={save}
        saveWork={save}
        organise={organise}
        upload={upload}
      />
    </div>
  );
}
