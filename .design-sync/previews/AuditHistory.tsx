import { AuditHistory } from "gd-website";

const entries = [
  {
    id: 1,
    credentialId: "cred-1",
    credentialName: "STRIPE_SECRET_KEY",
    action: "credential.value_replaced",
    actorId: "user-1",
    actor: "Maya Reyes",
    actorEmail: "maya@gammadevelopers.com",
    actorRole: "owner",
    ip: "203.0.113.14",
    occurredAt: "2026-08-19T14:32:00.000Z",
    detail: null,
  },
  {
    id: 2,
    credentialId: "cred-2",
    credentialName: "TWILIO_AUTH_TOKEN",
    action: "credential.access_granted",
    actorId: "user-2",
    actor: "Devon Okafor",
    actorEmail: "devon@gammadevelopers.com",
    actorRole: "member",
    ip: "198.51.100.7",
    occurredAt: "2026-08-18T09:05:00.000Z",
    detail: "Granted to Priya Nair",
  },
  {
    id: 3,
    credentialId: "cred-1",
    credentialName: "STRIPE_SECRET_KEY",
    action: "credential.secret_copied",
    actorId: "user-2",
    actor: "Devon Okafor",
    actorEmail: "devon@gammadevelopers.com",
    actorRole: "member",
    ip: "198.51.100.7",
    occurredAt: "2026-08-17T16:48:00.000Z",
    detail: null,
  },
  {
    id: 4,
    credentialId: "cred-3",
    credentialName: "HARBOR_WMS_API_KEY",
    action: "credential.access_denied",
    actorId: null,
    actor: "Unknown caller",
    actorEmail: null,
    actorRole: null,
    ip: "192.0.2.55",
    occurredAt: "2026-08-16T11:20:00.000Z",
    detail: "Missing scope",
  },
  {
    id: 5,
    credentialId: "cred-3",
    credentialName: "HARBOR_WMS_API_KEY",
    action: "credential.archived",
    actorId: "user-1",
    actor: "Maya Reyes",
    actorEmail: "maya@gammadevelopers.com",
    actorRole: "owner",
    ip: "203.0.113.14",
    occurredAt: "2026-08-14T08:12:00.000Z",
    detail: null,
  },
];

export function Default() {
  return (
    <div className="max-w-3xl p-6">
      <AuditHistory entries={entries} />
    </div>
  );
}

export function Empty() {
  return (
    <div className="max-w-3xl p-6">
      <AuditHistory entries={[]} />
    </div>
  );
}
