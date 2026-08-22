import { PortalTeam } from "gd-website";

export function Assigned() {
  const team = [
    {
      name: "Priya Anand",
      responsibility: null,
      avatarUrl: null,
      isLead: true,
    },
    {
      name: "Marcus Elliot",
      responsibility: "Backend integrations",
      avatarUrl: null,
      isLead: false,
    },
    {
      name: "Sofia Reyes",
      responsibility: "QA and client demos",
      avatarUrl: null,
      isLead: false,
    },
  ];
  return (
    <div className="bg-background max-w-lg p-6">
      <PortalTeam team={team} />
    </div>
  );
}

export function NotAssignedYet() {
  return (
    <div className="bg-background max-w-lg p-6">
      <PortalTeam team={[]} />
    </div>
  );
}
