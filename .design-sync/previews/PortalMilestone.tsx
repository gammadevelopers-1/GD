import { PortalMilestone } from "gd-website";

const actions = {
  setDone: async () => ({ status: "idle" as const, message: null }),
  saveIdeas: async () => ({ status: "idle" as const, message: null }),
};

const weeks = [
  {
    id: "week-5",
    number: 5,
    startsOn: "2024-04-22",
    dueOn: "2024-04-28",
    focus: "Wire the carrier email inbox into the dispatch agent.",
    completedAt: "2024-04-29T10:00:00Z",
    ideaDoc: null,
    items: [
      { id: "i1", title: "Parse inbound carrier emails", done: true },
      { id: "i2", title: "Match loads to open dispatch slots", done: true },
    ],
  },
  {
    id: "week-6",
    number: 6,
    startsOn: "2024-05-13",
    dueOn: "2024-05-19",
    focus: "Get the dispatcher dashboard ready for a live walkthrough.",
    completedAt: null,
    ideaDoc: {
      type: "doc" as const,
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Client wants a demo before go-live." },
          ],
        },
      ],
    },
    items: [
      { id: "i3", title: "Ship the dispatcher review screen", done: true },
      { id: "i4", title: "Add carrier confirmation webhook", done: false },
    ],
  },
];

const behindWeeks = [
  {
    id: "week-4",
    number: 4,
    startsOn: "2024-04-15",
    dueOn: "2024-04-21",
    focus: "Finish carrier onboarding flow.",
    completedAt: null,
    ideaDoc: null,
    items: [
      { id: "b1", title: "Add carrier verification step", done: true },
      { id: "b2", title: "Send onboarding confirmation email", done: false },
    ],
  },
];

export function ClientEditable() {
  return (
    <div className="bg-background max-w-lg p-6">
      <PortalMilestone
        publicId="northwind-logistics"
        weeks={weeks}
        canEdit
        actions={actions}
      />
    </div>
  );
}

export function ReadOnlyBehind() {
  return (
    <div className="bg-background max-w-lg p-6">
      <PortalMilestone
        publicId="harbor-freight"
        weeks={behindWeeks}
        canEdit={false}
        actions={actions}
      />
    </div>
  );
}

export function NotPlannedYet() {
  return (
    <div className="bg-background max-w-lg p-6">
      <PortalMilestone
        publicId="new-client-co"
        weeks={[]}
        canEdit={false}
        actions={actions}
      />
    </div>
  );
}
