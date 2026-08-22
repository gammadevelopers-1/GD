import { PortalProjectCard } from "gd-website";

const bannerSvg =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140"><rect width="400" height="140" fill="#0b5f2c"/><rect width="400" height="140" fill="url(#g)"/><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2fe85c" stop-opacity="0.35"/><stop offset="1" stop-color="#101512" stop-opacity="0"/></linearGradient></defs></svg>',
  );

export function Active() {
  const project = {
    publicId: "northwind-logistics",
    name: "Northwind Logistics",
    status: "building",
    bannerUrl: null,
    bannerFit: "cover" as const,
    startsOn: "2024-04-01",
    dueOn: "2024-06-30",
    totalItems: 18,
    doneItems: 11,
    overdueItems: 0,
    progress: 61,
    currentWeek: { number: 6, dueOn: "2024-05-19" },
  };
  return (
    <div className="bg-background max-w-sm p-6">
      <PortalProjectCard project={project} />
    </div>
  );
}

export function Overdue() {
  const project = {
    publicId: "harbor-freight",
    name: "Harbor Freight Co.",
    status: "review",
    bannerUrl: null,
    bannerFit: "cover" as const,
    startsOn: "2024-03-01",
    dueOn: "2024-05-10",
    totalItems: 9,
    doneItems: 4,
    overdueItems: 2,
    progress: 44,
    currentWeek: { number: 8, dueOn: "2024-05-10" },
  };
  return (
    <div className="bg-background max-w-sm p-6">
      <PortalProjectCard project={project} />
    </div>
  );
}

export function WithBanner() {
  const project = {
    publicId: "riverside-dental",
    name: "Riverside Dental Group",
    status: "live",
    bannerUrl: bannerSvg,
    bannerFit: "cover" as const,
    startsOn: "2024-01-08",
    dueOn: null,
    totalItems: 0,
    doneItems: 0,
    overdueItems: 0,
    progress: 0,
    currentWeek: null,
  };
  return (
    <div className="bg-background max-w-sm p-6">
      <PortalProjectCard project={project} />
    </div>
  );
}
