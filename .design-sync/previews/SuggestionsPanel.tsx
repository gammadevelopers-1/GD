import { SuggestionsPanel } from "gd-website";

const noop = () => {};

export function Open() {
  const groups = [
    {
      weekNumber: 7,
      weekDueOn: "2026-08-15",
      items: [
        {
          cardId: "card-rate-lookup",
          title: "Fix rate-lookup timeout for Harbor WMS",
          status: "blocked" as const,
          weekNumber: 7,
          weekDueOn: "2026-08-15",
          createdBy: "Devon Okafor",
          reason: "Waiting on Harbor IT for sandbox credentials.",
        },
        {
          cardId: "card-qa-email",
          title: "QA the carrier confirmation email template",
          status: "in_progress" as const,
          weekNumber: 7,
          weekDueOn: "2026-08-15",
          createdBy: "Priya Anand",
          reason: null,
        },
      ],
    },
    {
      weekNumber: 6,
      weekDueOn: "2026-08-08",
      items: [
        {
          cardId: "card-invoice-match",
          title: "Match invoices against open POs",
          status: "incomplete" as const,
          weekNumber: 6,
          weekDueOn: "2026-08-08",
          createdBy: "Maya Reyes",
          reason: "Waited on Harbor to export last month's PO list.",
        },
      ],
    },
  ];

  return (
    <div
      style={{ height: 560 }}
      className="relative max-w-md overflow-hidden rounded-2xl border border-black/[0.08]"
    >
      <SuggestionsPanel groups={groups} open onClose={noop} />
    </div>
  );
}

export function SingleWeek() {
  const groups = [
    {
      weekNumber: 4,
      weekDueOn: "2026-07-25",
      items: [
        {
          cardId: "card-onboarding",
          title: "Connect returns webhook to Union Bay's POS",
          status: "blocked" as const,
          weekNumber: 4,
          weekDueOn: "2026-07-25",
          createdBy: "Maya Reyes",
          reason: "Blocked on POS vendor API access approval.",
        },
      ],
    },
  ];

  return (
    <div
      style={{ height: 400 }}
      className="relative max-w-md overflow-hidden rounded-2xl border border-black/[0.08]"
    >
      <SuggestionsPanel groups={groups} open onClose={noop} />
    </div>
  );
}
