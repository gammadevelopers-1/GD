import { WeekCarryOver } from "gd-website";

const idle = { status: "idle" as const, message: null };
const accept = async () => idle;
const dismiss = async () => idle;

export function ManageableCarryOver() {
  const items = [
    {
      cardId: "card-1",
      title: "Match invoices against open POs",
      fromWeek: 5,
      assignedName: "Priya Nair",
    },
    {
      cardId: "card-2",
      title: "Connect to Harbor's WMS for rate lookups",
      fromWeek: 5,
      assignedName: null,
    },
  ];

  return (
    <div className="max-w-xl p-6">
      <WeekCarryOver
        items={items}
        weekId="week-6"
        canManage={true}
        accept={accept}
        dismiss={dismiss}
      />
    </div>
  );
}

export function ViewOnlyCarryOver() {
  const items = [
    {
      cardId: "card-3",
      title: "Draft booking confirmation for human review",
      fromWeek: 5,
      assignedName: "Devon Okafor",
    },
  ];

  return (
    <div className="max-w-xl p-6">
      <WeekCarryOver
        items={items}
        weekId="week-6"
        canManage={false}
        accept={accept}
        dismiss={dismiss}
      />
    </div>
  );
}
