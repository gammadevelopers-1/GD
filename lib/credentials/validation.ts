import { TONE_SOFT } from "@/lib/admin-ui";

export const CREDENTIAL_ENVIRONMENTS = [
  "production",
  "staging",
  "development",
  "other",
] as const;

export type CredentialEnvironment = (typeof CREDENTIAL_ENVIRONMENTS)[number];

export const ENVIRONMENT_LABEL: Record<CredentialEnvironment, string> = {
  production: "Production",
  staging: "Staging",
  development: "Development",
  other: "Other",
};

export const ENVIRONMENT_CHIP: Record<CredentialEnvironment, string> = {
  production: TONE_SOFT.danger,
  staging: TONE_SOFT.warning,
  development: TONE_SOFT.muted,
  other: TONE_SOFT.muted,
};

export function isCredentialEnvironment(
  value: string,
): value is CredentialEnvironment {
  return (CREDENTIAL_ENVIRONMENTS as readonly string[]).includes(value);
}

export const CREDENTIAL_ACCESS = ["see", "use", "manage"] as const;
export type CredentialAccess = (typeof CREDENTIAL_ACCESS)[number];

export function isCredentialAccess(value: string): value is CredentialAccess {
  return (CREDENTIAL_ACCESS as readonly string[]).includes(value);
}

export const ACCESS_LABEL: Record<CredentialAccess, string> = {
  see: "Can see",
  use: "Can use",
  manage: "Can manage",
};

export const ACCESS_HINT: Record<CredentialAccess, string> = {
  see: "Sees the key and note. Cannot copy the value.",
  use: "Can copy the value.",
  manage: "Can copy, edit and delete.",
};

export const ACCESS_CHIP: Record<CredentialAccess, string> = {
  see: TONE_SOFT.muted,
  use: TONE_SOFT.ok,
  manage: TONE_SOFT.warning,
};

export function canCopyValue(access: "owner" | CredentialAccess | null) {
  return access === "owner" || access === "manage" || access === "use";
}

export function canManageVariable(access: "owner" | CredentialAccess | null) {
  return access === "owner" || access === "manage";
}

export const NAME_MAX = 120;
export const SERVICE_MAX = 120;
export const DESCRIPTION_MAX = 500;
export const SECRET_MAX = 8000;

export type CredentialField =
  "name" | "service" | "environment" | "description" | "secret";

export type CredentialErrors = Partial<Record<CredentialField, string>>;

export type CredentialFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: CredentialErrors;
};

export const IDLE_CREDENTIAL_FORM: CredentialFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export type ParsedCredential = {
  name: string;
  service: string | null;
  environment: CredentialEnvironment;
  description: string | null;
  secret: string;
};

export function validateCredential(
  values: {
    name: string;
    service: string;
    environment: string;
    description: string;
    secret: string;
  },
  options: { requireSecret: boolean },
): { errors: CredentialErrors; parsed: ParsedCredential | null } {
  const errors: CredentialErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = "Give the credential a name.";
  } else if (name.length > NAME_MAX) {
    errors.name = `Keep the name under ${NAME_MAX} characters.`;
  }

  if (values.service.trim().length > SERVICE_MAX) {
    errors.service = `Keep it under ${SERVICE_MAX} characters.`;
  }

  const environment = values.environment.trim() || "other";
  if (!isCredentialEnvironment(environment)) {
    errors.environment = "Choose production, staging, development or other.";
  }

  if (values.description.trim().length > DESCRIPTION_MAX) {
    errors.description = `Keep the description under ${DESCRIPTION_MAX} characters.`;
  }

  const secret = values.secret;
  if (options.requireSecret && !secret) {
    errors.secret = "Paste the value this credential holds.";
  } else if (secret && secret.length > SECRET_MAX) {
    errors.secret = `That value is longer than ${SECRET_MAX} characters.`;
  }

  if (Object.keys(errors).length) return { errors, parsed: null };

  return {
    errors,
    parsed: {
      name,
      service: values.service.trim() || null,
      environment: environment as CredentialEnvironment,
      description: values.description.trim() || null,
      secret,
    },
  };
}

export function credentialErrorSummary(errors: CredentialErrors) {
  const count = Object.keys(errors).length;
  if (!count) return null;
  return count === 1
    ? "One field needs attention."
    : `${count} fields need attention.`;
}

export const AUDIT_LABEL: Record<string, string> = {
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
};

export const AUDIT_TONE: Record<string, string> = {
  "credential.access_denied": TONE_SOFT.danger,
  "credential.archived": TONE_SOFT.warning,
  "credential.access_revoked": TONE_SOFT.warning,
  "credential.secret_copied": TONE_SOFT.ok,
};
