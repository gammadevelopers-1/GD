import { ClientAccessPanel } from "gd-website";

const actions = {
  regenerate: async () => ({ status: "idle" as const, message: null }),
  setEditing: async () => {},
  revoke: async () => {},
};

export function Default() {
  return (
    <div className="max-w-2xl bg-[#f8f8f3] p-6">
      <ClientAccessPanel
        publicId="northwind-logistics"
        grants={[
          {
            id: "grant-1",
            clientUserId: "cu-1",
            name: "Priya Anand",
            email: "priya@northwindlogistics.com",
            canEditMilestones: true,
            grantedAt: "2026-07-14T09:00:00.000Z",
            lastSeenAt: "2026-08-20T16:12:00.000Z",
            activatedAt: "2026-07-14T09:40:00.000Z",
          },
          {
            id: "grant-2",
            clientUserId: "cu-2",
            name: "Marcus Elliot",
            email: "marcus@northwindlogistics.com",
            canEditMilestones: false,
            grantedAt: "2026-08-18T09:00:00.000Z",
            lastSeenAt: null,
            activatedAt: null,
          },
          {
            id: "grant-3",
            clientUserId: "cu-3",
            name: "Dana Okafor",
            email: "dana@northwindlogistics.com",
            canEditMilestones: true,
            grantedAt: "2026-06-02T09:00:00.000Z",
            lastSeenAt: null,
            activatedAt: "2026-06-02T10:15:00.000Z",
          },
        ]}
        actions={actions}
      />
    </div>
  );
}
