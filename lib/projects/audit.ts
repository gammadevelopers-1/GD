import type { Tone } from "@/lib/admin-ui";

export const AUDIT_CATEGORIES = [
  "create",
  "update",
  "delete",
  "access",
  "share",
  "group",
] as const;

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export const AUDIT_CATEGORY_LABEL: Record<AuditCategory, string> = {
  create: "created",
  update: "updated",
  delete: "deleted",
  access: "access",
  share: "shared",
  group: "group",
};

export const AUDIT_CATEGORY_TONE: Record<AuditCategory, Tone> = {
  create: "ok",
  update: "info",
  delete: "danger",
  access: "warning",
  share: "info",
  group: "muted",
};

const BY_ACTION: Record<string, AuditCategory> = {
  "credential.created": "create",
  "credential.value_replaced": "update",
  "credential.metadata_updated": "update",
  "credential.restored": "update",
  "credential.archived": "delete",
  "credential.secret_copied": "access",
  "credential.access_denied": "access",
  "credential.access_granted": "share",
  "credential.access_level_changed": "share",
  "credential.access_revoked": "share",
  "env_group.created": "group",
  "env_group.renamed": "group",
  "env_group.deleted": "group",
  create: "create",
  update: "update",
  delete: "delete",
};

export function auditCategory(action: string): AuditCategory {
  return BY_ACTION[action] ?? "update";
}

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "credential.created": "Variable created",
  "credential.value_replaced": "Value replaced",
  "credential.metadata_updated": "Variable edited",
  "credential.archived": "Variable deleted",
  "credential.restored": "Variable restored",
  "credential.access_granted": "Access granted",
  "credential.access_level_changed": "Access level changed",
  "credential.access_revoked": "Access revoked",
  "credential.secret_copied": "Value copied",
  "credential.access_denied": "Access denied",
  "env_group.created": "Group created",
  "env_group.renamed": "Group renamed",
  "env_group.deleted": "Group deleted",
  create: "Link added",
  update: "Link updated",
  delete: "Link cleared",
};

export function auditActionLabel(action: string) {
  return AUDIT_ACTION_LABEL[action] ?? action.replace(/[._]/g, " ");
}

export function deviceLabel(userAgent: string | null) {
  if (!userAgent) return null;

  const browser =
    /Edg\//.test(userAgent)
      ? "Edge"
      : /OPR\//.test(userAgent)
        ? "Opera"
        : /Chrome\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : /Firefox\//.test(userAgent)
              ? "Firefox"
              : null;

  const version = browser
    ? /(?:Edg|OPR|Chrome|Firefox|Version)\/(\d+)/.exec(userAgent)?.[1]
    : null;

  const platform = /Windows/.test(userAgent)
    ? "Windows"
    : /Macintosh|Mac OS X/.test(userAgent)
      ? "macOS"
      : /Android/.test(userAgent)
        ? "Android"
        : /iPhone|iPad|iPod/.test(userAgent)
          ? "iOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : null;

  const left = browser ? `${browser}${version ? ` ${version}` : ""}` : null;
  if (left && platform) return `${left} · ${platform}`;
  return left ?? platform;
}
