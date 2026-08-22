import { PortfolioResults } from "gd-website";

const baseQuery = {
  search: "",
  statuses: [],
  clientId: null,
  personId: null,
  includeArchived: false,
  view: "grid" as const,
};

const projects = [
  {
    id: "p1",
    publicId: "northwind-logistics",
    bannerUrl: null,
    bannerFit: "cover" as const,
    name: "Northwind Logistics",
    status: "building" as const,
    clientId: "c1",
    clientName: "Northwind Logistics Co.",
    leadId: "u1",
    leadName: "Priya Anand",
    startsOn: "2024-04-01",
    dueOn: "2024-06-30",
    isArchived: false,
    memberCount: 3,
    totalItems: 18,
    doneItems: 11,
    overdueItems: 0,
    progress: 61,
    currentWeek: { number: 6, dueOn: "2024-05-19", total: 5, done: 3 },
    value: { amount: 18500, currency: "USD" as const },
    clientAccess: "active" as const,
  },
  {
    id: "p2",
    publicId: "harbor-freight",
    bannerUrl: null,
    bannerFit: "cover" as const,
    name: "Harbor Freight Co.",
    status: "review" as const,
    clientId: "c2",
    clientName: "Harbor Freight",
    leadId: "u2",
    leadName: "Marcus Elliot",
    startsOn: "2024-03-01",
    dueOn: "2024-05-10",
    isArchived: false,
    memberCount: 2,
    totalItems: 9,
    doneItems: 4,
    overdueItems: 2,
    progress: 44,
    currentWeek: { number: 8, dueOn: "2024-05-10", total: 3, done: 1 },
    value: { amount: 6200, currency: "USD" as const },
    clientAccess: "invited" as const,
  },
];

export function GridView() {
  return (
    <div className="bg-background p-6">
      <PortfolioResults projects={projects} query={baseQuery} role="owner" />
    </div>
  );
}

export function TableView() {
  return (
    <div className="bg-background p-6">
      <PortfolioResults
        projects={projects}
        query={{ ...baseQuery, view: "table" }}
        role="owner"
      />
    </div>
  );
}

export function FilteredEmpty() {
  return (
    <div className="bg-background p-6">
      <PortfolioResults
        projects={[]}
        query={{ ...baseQuery, search: "harbor" }}
        role="member"
      />
    </div>
  );
}
