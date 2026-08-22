import { BoardsPanel } from "gd-website";

const emptyDoc = { type: "doc", content: [] };

function card(overrides: Record<string, unknown>) {
  return {
    id: "card-1",
    title: "Untitled",
    board: "idea",
    status: "idea",
    blocks: [],
    doc: emptyDoc,
    assignedTo: null,
    assignedName: null,
    updatedAt: "2026-08-19T10:00:00.000Z",
    updatedBy: "Maya Reyes",
    position: 0,
    blockerReason: null,
    carryReason: null,
    carriedFromWeek: null,
    completedAt: null,
    isArchived: false,
    createdBy: "Maya Reyes",
    ...overrides,
  };
}

const idle = { status: "idle" as const, message: null };
const formAction = async () => idle;
const voidAction = async () => {};
const uploadAction = async () => ({ status: "idle" as const, message: null });
const draftAction = async () => ({ status: "idle" as const, message: null });

const actions = {
  createCard: formAction,
  saveCard: formAction,
  moveCard: formAction,
  carryCard: formAction,
  setCardArchived: voidAction,
  uploadFile: uploadAction,
  organiseWeek: formAction,
  draftCard: draftAction,
  addWeek: formAction,
  setWeekArchived: voidAction,
};

const credentials = [
  { id: "cred-1", name: "STRIPE_SECRET_KEY" },
  { id: "cred-2", name: "TWILIO_AUTH_TOKEN" },
];

export function CurrentWeek() {
  const weeks = [
    {
      id: "week-6",
      number: 6,
      startsOn: "2026-08-17",
      dueOn: "2026-08-23",
      focus: "Ship dispatch confirmation flow",
      completedAt: null,
      completedBy: null,
      ideaDoc: emptyDoc,
      ideaUpdatedAt: "2026-08-19T10:00:00.000Z",
      ideaUpdatedBy: "Maya Reyes",
      workUpdatedAt: "2026-08-20T09:00:00.000Z",
      workUpdatedBy: "Devon Okafor",
      ideaCards: [
        card({
          id: "idea-1",
          title: "Retry failed carrier emails automatically",
          status: "idea",
        }),
        card({
          id: "idea-2",
          title: "Add a Slack alert when a booking needs review",
          status: "idea",
        }),
      ],
      workCards: [
        card({
          id: "work-1",
          title: "Parse inbound carrier email for load details",
          status: "completed",
          board: "work",
          completedAt: "2026-08-19T16:00:00.000Z",
        }),
        card({
          id: "work-2",
          title: "Draft booking confirmation for human review",
          status: "in_progress",
          board: "work",
        }),
        card({
          id: "work-3",
          title: "Connect to Harbor's WMS for rate lookups",
          status: "blocked",
          board: "work",
          blockerReason: "Waiting on API credentials from Harbor's IT team.",
        }),
      ],
      archivedCards: [],
      done: 1,
      total: 3,
      isCurrent: true,
      isOverdue: false,
      isArchived: false,
    },
  ];

  return (
    <div className="max-w-3xl p-6">
      <BoardsPanel
        projectId="northwind-logistics"
        weeks={weeks}
        canManage={true}
        canUpdateStatus={true}
        isOwner={true}
        credentials={credentials}
        signedUrls={{}}
        actions={actions}
      />
    </div>
  );
}

export function OverdueWithCarry() {
  const weeks = [
    {
      id: "week-4",
      number: 4,
      startsOn: "2026-08-03",
      dueOn: "2026-08-09",
      focus: "Reconcile invoices against purchase orders",
      completedAt: null,
      completedBy: null,
      ideaDoc: emptyDoc,
      ideaUpdatedAt: null,
      ideaUpdatedBy: null,
      workUpdatedAt: "2026-08-09T18:00:00.000Z",
      workUpdatedBy: "Priya Nair",
      ideaCards: [],
      workCards: [
        card({
          id: "work-4",
          title: "Match invoices against open POs",
          status: "incomplete",
          board: "work",
          carryReason: "Waited on Harbor to export last month's PO list.",
        }),
      ],
      archivedCards: [],
      done: 0,
      total: 1,
      isCurrent: false,
      isOverdue: true,
      isArchived: false,
    },
  ];

  return (
    <div className="max-w-3xl p-6">
      <BoardsPanel
        projectId="harbor-freight"
        weeks={weeks}
        canManage={true}
        canUpdateStatus={true}
        isOwner={true}
        credentials={credentials}
        signedUrls={{}}
        actions={actions}
      />
    </div>
  );
}

export function NoWeeksYet() {
  return (
    <div className="max-w-3xl p-6">
      <BoardsPanel
        projectId="new-client"
        weeks={[]}
        canManage={true}
        canUpdateStatus={true}
        isOwner={true}
        credentials={credentials}
        signedUrls={{}}
        actions={actions}
      />
    </div>
  );
}
