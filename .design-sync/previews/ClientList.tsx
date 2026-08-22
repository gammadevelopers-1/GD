import { ClientList } from "gd-website";

export function Default() {
  return (
    <div className="max-w-4xl bg-[#f8f8f3] p-6">
      <ClientList
        clients={[
          {
            id: "client-1",
            name: "Northwind Logistics",
            website: "northwindlogistics.com",
            notes: null,
            archivedAt: null,
            projectCount: 3,
            activeCount: 2,
            primaryContact: "Priya Anand",
            primaryEmail: "priya@northwindlogistics.com",
            inviteState: "active",
          },
          {
            id: "client-2",
            name: "Harbor Freight Co",
            website: "harborfreightco.com",
            notes: null,
            archivedAt: null,
            projectCount: 1,
            activeCount: 1,
            primaryContact: "Dana Okafor",
            primaryEmail: "dana@harborfreightco.com",
            inviteState: "invited",
          },
          {
            id: "client-3",
            name: "Bellweather Supply",
            website: null,
            notes: null,
            archivedAt: null,
            projectCount: 2,
            activeCount: 0,
            primaryContact: null,
            primaryEmail: null,
            inviteState: "none",
          },
        ]}
      />
    </div>
  );
}

export function Archived() {
  return (
    <div className="max-w-md bg-[#f8f8f3] p-6">
      <ClientList
        clients={[
          {
            id: "client-4",
            name: "Cascade Millworks",
            website: "cascademillworks.com",
            notes: null,
            archivedAt: "2026-05-01T00:00:00.000Z",
            projectCount: 4,
            activeCount: 0,
            primaryContact: "Marcus Elliot",
            primaryEmail: "marcus@cascademillworks.com",
            inviteState: "active",
          },
        ]}
      />
    </div>
  );
}
