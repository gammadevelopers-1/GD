import { ShareContainers } from "gd-website";

const containers = [
  { id: "grp-stripe", name: "Stripe API keys", count: 4 },
  { id: "grp-db", name: "Database credentials", count: 3 },
  { id: "grp-hooks", name: "Third-party webhooks", count: 2 },
];

const members = [
  { id: "m-priya", name: "Priya Anand" },
  { id: "m-devon", name: "Devon Okafor" },
];

const noop = () => {};
const shareAction = async () => ({
  status: "idle" as const,
  message: null,
});

export function Default() {
  return (
    <ShareContainers
      projectId="northwind-logistics"
      containers={containers}
      members={members}
      action={shareAction}
      preselected={["grp-stripe", "grp-db"]}
      open
      onClose={noop}
    />
  );
}

export function NoneSelected() {
  return (
    <ShareContainers
      projectId="harbor-freight"
      containers={containers.slice(0, 2)}
      members={members}
      action={shareAction}
      preselected={[]}
      open
      onClose={noop}
    />
  );
}
