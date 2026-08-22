import { ProjectForm } from "gd-website";

const clients = [
  { id: "c1", name: "Northwind Logistics" },
  { id: "c2", name: "Harborview Dental Group" },
  { id: "c3", name: "Atlas Fleet Rentals" },
];

const people = [
  { id: "p1", name: "Amara Chen" },
  { id: "p2", name: "Farrukh Iqbal" },
  { id: "p3", name: "Devon Ross" },
];

const emptyDefaults = {
  name: "",
  clientId: "",
  description: "",
  leadId: "",
  startsOn: "",
  dueOn: "",
  status: "discovery",
  valueAmount: "",
  valueCurrency: "USD",
  exchangeRate: "",
  bookedOn: "",
};

const filledDefaults = {
  name: "Northwind Logistics — dispatch agent",
  clientId: "c1",
  description:
    "Reads inbound carrier email, books the load and confirms the booking back within five minutes.",
  leadId: "p1",
  startsOn: "2026-06-01",
  dueOn: "2026-09-12",
  status: "building",
  valueAmount: "24000",
  valueCurrency: "USD",
  exchangeRate: "279.40",
  bookedOn: "2026-05-20",
};

async function action() {
  return {
    status: "idle" as const,
    message: null,
    fieldErrors: {},
    values: null,
  };
}

export function Create() {
  return (
    <div className="bg-background p-10" style={{ width: 820 }}>
      <ProjectForm
        mode="create"
        action={action}
        clients={clients}
        people={people}
        defaults={emptyDefaults}
        cancelHref="/projects"
      />
    </div>
  );
}

export function Edit() {
  return (
    <div className="bg-background p-10" style={{ width: 820 }}>
      <ProjectForm
        mode="edit"
        action={action}
        clients={clients}
        people={people}
        defaults={filledDefaults}
        projectId="northwind-logistics"
        cancelHref="/projects/northwind-logistics"
      />
    </div>
  );
}
