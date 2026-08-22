import { WeekPlan } from "gd-website";

const emptyDoc = { type: "doc", content: [] };

function card(overrides: Record<string, unknown>) {
  return {
    id: "card-1",
    title: "Untitled",
    board: "work",
    status: "in_progress",
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
const carryAction = async () => idle;
const setComplete = async () => idle;
const addWeek = async () => idle;
const archiveWeek = async () => {};
const saveIdeaBoard = async () => idle;
const upload = async () => ({ status: "idle" as const, message: null });
const workActions = {
  saveTask: async () => ({ status: "idle" as const, message: null }),
  setTaskDone: async () => idle,
  suggest: async () => ({ status: "idle" as const, message: null }),
  accept: async () => idle,
};

export function OwnerWithOpenWeek() {
  const weeks = [
    {
      id: "week-5",
      number: 5,
      startsOn: "2026-08-10",
      dueOn: "2026-08-16",
      focus: "Reconcile invoices against purchase orders",
      completedAt: "2026-08-16T17:00:00.000Z",
      completedBy: "Priya Nair",
      ideaDoc: emptyDoc,
      ideaUpdatedAt: null,
      ideaUpdatedBy: null,
      workUpdatedAt: "2026-08-16T17:00:00.000Z",
      workUpdatedBy: "Priya Nair",
      ideaCards: [],
      workCards: [
        card({
          id: "work-0",
          title: "Match invoices against open POs",
          status: "completed",
          completedAt: "2026-08-16T17:00:00.000Z",
        }),
      ],
      archivedCards: [],
      done: 1,
      total: 1,
      isCurrent: false,
      isOverdue: false,
      isArchived: false,
    },
    {
      id: "week-6",
      number: 6,
      startsOn: "2026-08-17",
      dueOn: "2026-08-23",
      focus: "Ship dispatch confirmation flow",
      completedAt: null,
      completedBy: null,
      ideaDoc: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Reads inbound carrier email, matches it against open lanes, and drafts a booking for review.",
              },
            ],
          },
        ],
      },
      ideaUpdatedAt: "2026-08-19T10:00:00.000Z",
      ideaUpdatedBy: "Maya Reyes",
      workUpdatedAt: "2026-08-20T09:00:00.000Z",
      workUpdatedBy: "Devon Okafor",
      ideaCards: [],
      workCards: [
        card({
          id: "work-1",
          title: "Parse inbound carrier email for load details",
          status: "completed",
          completedAt: "2026-08-19T16:00:00.000Z",
        }),
        card({
          id: "work-2",
          title: "Draft booking confirmation for human review",
          status: "in_progress",
        }),
        card({
          id: "work-3",
          title: "Connect to Harbor's WMS for rate lookups",
          status: "blocked",
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
      <WeekPlan
        projectId="northwind-logistics"
        weeks={weeks}
        currentWeekId="week-6"
        progress={33}
        canPlan={true}
        isOwner={true}
        canWrite={true}
        canManage={true}
        canTick={true}
        dismissedCarry={[]}
        acceptCarry={carryAction}
        dismissCarry={carryAction}
        setComplete={setComplete}
        addWeek={addWeek}
        archiveWeek={archiveWeek}
        saveIdeaBoard={saveIdeaBoard}
        upload={upload}
        workActions={workActions}
      />
    </div>
  );
}

export function CollapsedWithOverdue() {
  const weeks = [
    {
      id: "week-3",
      number: 3,
      startsOn: "2026-07-27",
      dueOn: "2026-08-02",
      focus: "Design the booking confirmation email",
      completedAt: "2026-08-02T15:00:00.000Z",
      completedBy: "Maya Reyes",
      ideaDoc: emptyDoc,
      ideaUpdatedAt: null,
      ideaUpdatedBy: null,
      workUpdatedAt: "2026-08-02T15:00:00.000Z",
      workUpdatedBy: "Maya Reyes",
      ideaCards: [],
      workCards: [
        card({ id: "w-a", title: "Design email template", status: "completed" }),
      ],
      archivedCards: [],
      done: 1,
      total: 1,
      isCurrent: false,
      isOverdue: false,
      isArchived: false,
    },
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
          id: "w-b",
          title: "Match invoices against open POs",
          status: "incomplete",
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
      <WeekPlan
        projectId="harbor-freight"
        weeks={weeks}
        currentWeekId={null}
        progress={50}
        canPlan={true}
        isOwner={true}
        canWrite={true}
        canManage={true}
        canTick={true}
        dismissedCarry={[]}
        acceptCarry={carryAction}
        dismissCarry={carryAction}
        setComplete={setComplete}
        addWeek={addWeek}
        archiveWeek={archiveWeek}
        saveIdeaBoard={saveIdeaBoard}
        upload={upload}
        workActions={workActions}
      />
    </div>
  );
}

export function NoWeeksYet() {
  return (
    <div className="max-w-3xl p-6">
      <WeekPlan
        projectId="new-client"
        weeks={[]}
        currentWeekId={null}
        progress={0}
        canPlan={true}
        isOwner={true}
        canWrite={true}
        canManage={true}
        canTick={true}
        dismissedCarry={[]}
        acceptCarry={carryAction}
        dismissCarry={carryAction}
        setComplete={setComplete}
        addWeek={addWeek}
        archiveWeek={archiveWeek}
        saveIdeaBoard={saveIdeaBoard}
        upload={upload}
        workActions={workActions}
      />
    </div>
  );
}
