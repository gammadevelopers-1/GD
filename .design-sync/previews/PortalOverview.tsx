import { PortalOverview } from "gd-website";

const leanWeeks = [
  {
    id: "week-6",
    number: 6,
    startsOn: "2024-05-13",
    dueOn: "2024-05-19",
    focus: "Get the dispatcher dashboard ready for a live walkthrough.",
    completedAt: null,
    ideaDoc: null,
    items: [
      { id: "i3", title: "Ship the dispatcher review screen", done: true },
      { id: "i4", title: "Add carrier confirmation webhook", done: false },
    ],
  },
];

export function OnTrack() {
  const portal = {
    project: {
      publicId: "northwind-logistics",
      name: "Northwind Logistics",
      description: null,
      status: "building" as const,
      startsOn: "2024-04-01",
      dueOn: "2024-06-30",
      bannerUrl: null,
      bannerFit: "cover" as const,
    },
    canEditMilestones: true,
    lastUpdatedAt: "2024-05-14T16:20:00Z",
    team: [],
    weeks: leanWeeks,
  };
  return (
    <div className="bg-background max-w-xl p-6">
      <PortalOverview portal={portal} />
    </div>
  );
}

export function OverdueWeek() {
  const portal = {
    project: {
      publicId: "harbor-freight",
      name: "Harbor Freight Co.",
      description: null,
      status: "review" as const,
      startsOn: "2024-03-01",
      dueOn: "2024-05-10",
      bannerUrl: null,
      bannerFit: "cover" as const,
    },
    canEditMilestones: false,
    lastUpdatedAt: "2024-04-30T09:00:00Z",
    team: [],
    weeks: [
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
          {
            id: "b2",
            title: "Send onboarding confirmation email",
            done: false,
          },
        ],
      },
    ],
  };
  return (
    <div className="bg-background max-w-xl p-6">
      <PortalOverview portal={portal} />
    </div>
  );
}

export function NotPlannedYet() {
  const portal = {
    project: {
      publicId: "new-client-co",
      name: "New Client Co.",
      description: null,
      status: "discovery" as const,
      startsOn: null,
      dueOn: null,
      bannerUrl: null,
      bannerFit: "cover" as const,
    },
    canEditMilestones: false,
    lastUpdatedAt: null,
    team: [],
    weeks: [],
  };
  return (
    <div className="bg-background max-w-xl p-6">
      <PortalOverview portal={portal} />
    </div>
  );
}
