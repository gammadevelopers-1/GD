import { ProjectSwitcher } from "gd-website";

const projects = [
  {
    publicId: "northwind-logistics",
    name: "Northwind Logistics",
    status: "building",
    bannerUrl: null,
    bannerFit: "cover",
    startsOn: "2026-06-01",
    dueOn: "2026-09-12",
    totalItems: 24,
    doneItems: 15,
    overdueItems: 1,
    progress: 62,
    currentWeek: { number: 6, dueOn: "2026-08-28" },
  },
  {
    publicId: "harborview-dental",
    name: "Harborview Dental Group",
    status: "review",
    bannerUrl: null,
    bannerFit: "cover",
    startsOn: "2026-05-04",
    dueOn: "2026-08-15",
    totalItems: 18,
    doneItems: 18,
    overdueItems: 0,
    progress: 100,
    currentWeek: null,
  },
  {
    publicId: "atlas-fleet-rentals",
    name: "Atlas Fleet Rentals",
    status: "retainer",
    bannerUrl: null,
    bannerFit: "cover",
    startsOn: "2026-01-10",
    dueOn: null,
    totalItems: 9,
    doneItems: 6,
    overdueItems: 0,
    progress: 67,
    currentWeek: { number: 3, dueOn: "2026-08-24" },
  },
];

export function TwoProjects() {
  return (
    <div className="bg-background flex items-center p-10">
      <ProjectSwitcher
        projects={projects.slice(0, 2)}
        currentPublicId="northwind-logistics"
      />
    </div>
  );
}

export function ThreeProjects() {
  return (
    <div className="bg-background flex items-center p-10">
      <ProjectSwitcher
        projects={projects}
        currentPublicId="atlas-fleet-rentals"
      />
    </div>
  );
}

export function LongName() {
  const longProjects = [
    projects[1],
    {
      ...projects[0],
      publicId: "meridian-underwriting-platform-rebuild",
      name: "Meridian Underwriting Platform Rebuild",
    },
  ];
  return (
    <div className="bg-background flex items-center p-10" style={{ width: 320 }}>
      <ProjectSwitcher
        projects={longProjects}
        currentPublicId="meridian-underwriting-platform-rebuild"
      />
    </div>
  );
}
