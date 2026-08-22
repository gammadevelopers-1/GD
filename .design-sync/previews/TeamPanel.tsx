import { TeamPanel } from "gd-website";

const idle = { status: "idle" as const, message: null };
const formAction = async () => idle;
const voidAction = async () => {};

const people = [
  { id: "p-1", name: "Elena Cruz" },
  { id: "p-2", name: "Sam Whitfield" },
];

export function OwnerView() {
  const members = [
    {
      id: "m-1",
      name: "Maya Reyes",
      responsibility: "Frontend",
      isLead: true,
      addedBy: "Devon Okafor",
    },
    {
      id: "m-2",
      name: "Priya Nair",
      responsibility: "Client contact",
      isLead: false,
      addedBy: "Devon Okafor",
    },
    {
      id: "m-3",
      name: "Devon Okafor",
      responsibility: null,
      isLead: false,
      addedBy: null,
    },
  ];

  return (
    <div className="max-w-3xl p-6">
      <TeamPanel
        projectId="northwind-logistics"
        members={members}
        people={people}
        isOwner={true}
        addMember={formAction}
        updateResponsibility={formAction}
        removeMember={voidAction}
      />
    </div>
  );
}

export function MemberView() {
  const members = [
    {
      id: "m-1",
      name: "Maya Reyes",
      responsibility: "Frontend",
      isLead: true,
      addedBy: "Devon Okafor",
    },
  ];

  return (
    <div className="max-w-3xl p-6">
      <TeamPanel
        projectId="harbor-freight"
        members={members}
        people={people}
        isOwner={false}
        addMember={formAction}
        updateResponsibility={formAction}
        removeMember={voidAction}
      />
    </div>
  );
}

export function EmptyRoster() {
  return (
    <div className="max-w-3xl p-6">
      <TeamPanel
        projectId="new-client"
        members={[]}
        people={people}
        isOwner={true}
        addMember={formAction}
        updateResponsibility={formAction}
        removeMember={voidAction}
      />
    </div>
  );
}
