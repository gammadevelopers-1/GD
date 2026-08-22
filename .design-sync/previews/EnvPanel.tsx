import { EnvPanel } from "gd-website";

const noopForm = async () => ({ status: "idle" as const, message: null });
const noopVoid = async () => {};
const noopCopy = async () => ({ ok: true as const, value: "sk_live_••••" });

const actions = {
  createGroup: noopForm,
  shareGroups: noopForm,
  renameGroup: noopForm,
  deleteGroup: noopForm,
  saveVariables: noopForm,
  updateVariable: noopForm,
  deleteVariable: noopForm,
  grantAccess: noopForm,
  revokeAccess: noopVoid,
  uploadFile: noopForm,
  deleteFile: noopForm,
  downloadFile: async () => ({
    status: "idle" as const,
    message: null,
    url: undefined,
  }),
  copy: noopCopy,
};

const groups = [
  {
    id: "g1",
    name: "Production",
    description: null,
    position: 0,
    isArchived: false,
  },
  {
    id: "g2",
    name: "Staging",
    description: null,
    position: 1,
    isArchived: false,
  },
];

const members = [
  { id: "m1", name: "Amara Chen" },
  { id: "m2", name: "Farrukh Iqbal" },
];

const ownerVariables = [
  {
    id: "v1",
    name: "STRIPE_SECRET_KEY",
    service: "Stripe",
    environment: "production",
    description: "Rotate every 90 days",
    isArchived: false,
    createdBy: "Amara Chen",
    updatedAt: "2026-08-01T10:00:00Z",
    envGroupId: "g1",
    myAccess: "owner",
    grants: [
      {
        profileId: "m2",
        name: "Farrukh Iqbal",
        access: "use",
        grantedAt: "2026-08-02T10:00:00Z",
        grantedBy: "Amara Chen",
      },
    ],
  },
  {
    id: "v2",
    name: "SUPABASE_SERVICE_ROLE",
    service: "Supabase",
    environment: "production",
    description: null,
    isArchived: false,
    createdBy: "Amara Chen",
    updatedAt: "2026-07-28T10:00:00Z",
    envGroupId: "g1",
    myAccess: "owner",
    grants: [],
  },
  {
    id: "v3",
    name: "TWILIO_AUTH_TOKEN",
    service: "Twilio",
    environment: "staging",
    description: "WhatsApp sandbox only",
    isArchived: false,
    createdBy: "Farrukh Iqbal",
    updatedAt: "2026-08-10T10:00:00Z",
    envGroupId: "g2",
    myAccess: "owner",
    grants: [],
  },
];

const memberVariables = ownerVariables.map((variable) => ({
  ...variable,
  myAccess: variable.id === "v1" ? "use" : null,
}));

const files = [
  {
    id: "f1",
    fileName: "production.env",
    storagePath: "projects/northwind/ideas/production.env",
    byteSize: 2380,
    envGroupId: "g1",
    uploadedBy: "Amara Chen",
    createdAt: "2026-08-01T10:00:00Z",
  },
];

export function OwnerView() {
  return (
    <div className="bg-background max-w-3xl p-6">
      <EnvPanel
        projectId="northwind-logistics"
        groups={groups}
        variables={ownerVariables}
        files={files}
        members={members}
        isOwner
        vaultReady
        actions={actions}
      />
    </div>
  );
}

export function MemberView() {
  return (
    <div className="bg-background max-w-3xl p-6">
      <EnvPanel
        projectId="northwind-logistics"
        groups={groups}
        variables={memberVariables}
        files={[]}
        members={members}
        isOwner={false}
        vaultReady
        actions={actions}
      />
    </div>
  );
}

export function VaultNotConfigured() {
  return (
    <div className="bg-background max-w-3xl p-6">
      <EnvPanel
        projectId="northwind-logistics"
        groups={groups}
        variables={ownerVariables}
        files={files}
        members={members}
        isOwner
        vaultReady={false}
        actions={actions}
      />
    </div>
  );
}
