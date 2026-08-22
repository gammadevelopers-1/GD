import { TeamList } from "gd-website";

function person(overrides: Record<string, unknown>) {
  return {
    id: "person-1",
    fullName: "Maya Reyes",
    email: "maya@gammadevelopers.com",
    role: "member",
    jobTitle: "Frontend engineer",
    phone: null,
    isActive: true,
    archivedAt: null,
    invitedAt: "2026-06-01T09:00:00.000Z",
    activatedAt: "2026-06-02T09:00:00.000Z",
    createdAt: "2026-06-01T09:00:00.000Z",
    projectCount: 3,
    state: "active",
    ...overrides,
  };
}

export function RosterWithMixedStates() {
  const members = [
    person({
      id: "1",
      fullName: "Maya Reyes",
      jobTitle: "Frontend engineer",
      role: "member",
      projectCount: 4,
      state: "active",
    }),
    person({
      id: "2",
      fullName: "Devon Okafor",
      jobTitle: "Founder",
      role: "owner",
      projectCount: 6,
      state: "active",
    }),
    person({
      id: "3",
      fullName: "Priya Nair",
      jobTitle: "Ops & finance",
      role: "finance",
      projectCount: 2,
      state: "invited",
    }),
    person({
      id: "4",
      fullName: "Sam Whitfield",
      jobTitle: null,
      email: "sam@gammadevelopers.com",
      role: "member",
      projectCount: 0,
      state: "created",
    }),
    person({
      id: "5",
      fullName: "Elena Cruz",
      jobTitle: "QA lead",
      role: "member",
      projectCount: 1,
      isActive: false,
      state: "archived",
    }),
  ];

  return (
    <div className="max-w-3xl p-6">
      <TeamList members={members} />
    </div>
  );
}
