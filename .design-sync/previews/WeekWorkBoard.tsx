import { WeekWorkBoard } from "gd-website";

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
const uploadAction = async () => ({ status: "idle" as const, message: null });

const actions = {
  saveTask: async () => ({ status: "idle" as const, message: null }),
  setTaskDone: async () => idle,
  suggest: async () => ({ status: "idle" as const, message: null }),
  accept: async () => idle,
};

export function OpenWithTasks() {
  const tasks = [
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
  ];

  return (
    <div style={{ height: 560 }} className="relative max-w-md overflow-hidden rounded-2xl border border-black/[0.08]">
      <WeekWorkBoard
        projectId="northwind-logistics"
        weekId="week-6"
        weekNumber={6}
        tasks={tasks}
        canManage={true}
        canTick={true}
        hasNotes={true}
        updatedAt="2026-08-20T09:00:00.000Z"
        updatedBy="Devon Okafor"
        open={true}
        onClose={() => {}}
        onTaskDone={() => {}}
        upload={uploadAction}
        actions={actions}
      />
    </div>
  );
}

export function EmptyNoNotes() {
  return (
    <div style={{ height: 560 }} className="relative max-w-md overflow-hidden rounded-2xl border border-black/[0.08]">
      <WeekWorkBoard
        projectId="new-client"
        weekId="week-1"
        weekNumber={1}
        tasks={[]}
        canManage={true}
        canTick={true}
        hasNotes={false}
        updatedAt={null}
        updatedBy={null}
        open={true}
        onClose={() => {}}
        onTaskDone={() => {}}
        upload={uploadAction}
        actions={actions}
      />
    </div>
  );
}

export function ViewOnly() {
  const tasks = [
    card({
      id: "work-4",
      title: "Match invoices against open POs",
      status: "incomplete",
      carryReason: "Waited on Harbor to export last month's PO list.",
    }),
  ];

  return (
    <div style={{ height: 560 }} className="relative max-w-md overflow-hidden rounded-2xl border border-black/[0.08]">
      <WeekWorkBoard
        projectId="harbor-freight"
        weekId="week-4"
        weekNumber={4}
        tasks={tasks}
        canManage={false}
        canTick={false}
        hasNotes={true}
        updatedAt="2026-08-09T18:00:00.000Z"
        updatedBy="Priya Nair"
        open={true}
        onClose={() => {}}
        onTaskDone={() => {}}
        upload={uploadAction}
        actions={actions}
      />
    </div>
  );
}
