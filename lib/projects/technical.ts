export const TECHNICAL_FIELDS = [
  "repositoryUrl",
  "hostingUrl",
  "liveDomain",
  "stagingDomain",
  "designUrl",
  "stackNotes",
  "onboardingNotes",
] as const;

export type TechnicalField = (typeof TECHNICAL_FIELDS)[number];
export type TechnicalErrors = Partial<Record<TechnicalField, string>>;
export type TechnicalValues = Record<TechnicalField, string>;

export type TechnicalFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: TechnicalErrors;
  values: TechnicalValues | null;
};

export const IDLE_TECHNICAL_FORM: TechnicalFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  values: null,
};

export const TECHNICAL_LABELS: Record<TechnicalField, string> = {
  repositoryUrl: "Repository",
  hostingUrl: "Hosting",
  liveDomain: "Live domain",
  stagingDomain: "Staging domain",
  designUrl: "Design file",
  stackNotes: "Stack notes",
  onboardingNotes: "Onboarding notes",
};

export const NOTES_MAX = 4000;
const URL_MAX = 500;
const HOST_MAX = 253;

const WEB_URL =
  /^https?:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:\d{1,5})?(\/\S*)?$/i;
const WEB_HOST =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

const SECRET_PATTERNS: RegExp[] = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /\b(postgres|postgresql|mysql|mariadb|mongodb|mongodb\+srv|redis|rediss|amqp|amqps):\/\//i,
  /:\/\/[^/@\s:]+:[^/@\s]+@/,
  /\bsk-[A-Za-z0-9_-]{16,}/,
  /\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{10,}/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}/,
  /\bsbp_[A-Za-z0-9]{20,}/,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/,
  /\b(service[_-]?role[_-]?key|secret[_-]?key|api[_-]?key|apikey|access[_-]?token|auth[_-]?token|bearer[_-]?token|client[_-]?secret|private[_-]?key|passwd|password)\b\s*[:=]\s*\S{8,}/i,
];

export function looksLikeSecret(value: string) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(value));
}

export function readTechnicalForm(formData: FormData): TechnicalValues {
  const values = {} as TechnicalValues;
  for (const field of TECHNICAL_FIELDS) {
    values[field] = String(formData.get(field) ?? "").trim();
  }
  return values;
}

export type ParsedTechnical = Record<TechnicalField, string | null>;

export function validateTechnical(values: TechnicalValues): {
  errors: TechnicalErrors;
  parsed: ParsedTechnical | null;
} {
  const errors: TechnicalErrors = {};

  for (const field of TECHNICAL_FIELDS) {
    if (values[field] && looksLikeSecret(values[field])) {
      errors[field] =
        "That looks like a secret. API keys, tokens, passwords and database URLs belong in Credentials.";
    }
  }

  const url = (field: TechnicalField) => {
    const value = values[field];
    if (!value || errors[field]) return;
    if (value.length > URL_MAX) {
      errors[field] = "That address is too long to store.";
    } else if (!WEB_URL.test(value)) {
      errors[field] = "Use a full address starting with https://";
    }
  };

  const host = (field: TechnicalField) => {
    const value = values[field];
    if (!value || errors[field]) return;
    if (value.length > HOST_MAX) {
      errors[field] = "That address is too long to store.";
    } else if (!WEB_HOST.test(value) && !WEB_URL.test(value)) {
      errors[field] =
        "Use a domain like gammadevelopers.ai, or a full https address.";
    }
  };

  url("repositoryUrl");
  url("hostingUrl");
  url("designUrl");
  host("liveDomain");
  host("stagingDomain");

  if (!errors.stackNotes && values.stackNotes.length > NOTES_MAX) {
    errors.stackNotes = `Keep these notes under ${NOTES_MAX} characters.`;
  }

  if (!errors.onboardingNotes && values.onboardingNotes.length > NOTES_MAX) {
    errors.onboardingNotes = `Keep these notes under ${NOTES_MAX} characters.`;
  }

  if (Object.keys(errors).length) return { errors, parsed: null };

  const parsed = {} as ParsedTechnical;
  for (const field of TECHNICAL_FIELDS) {
    parsed[field] = values[field] || null;
  }
  return { errors, parsed };
}

export function technicalErrorSummary(errors: TechnicalErrors) {
  const count = Object.keys(errors).length;
  if (!count) return null;
  return count === 1
    ? "One field needs attention."
    : `${count} fields need attention.`;
}

export function toHref(value: string) {
  const candidate = WEB_URL.test(value) ? value : `https://${value}`;
  return WEB_URL.test(candidate) ? candidate : null;
}

export function linkLabel(value: string) {
  const href = toHref(value);
  if (!href) return value;
  try {
    const url = new URL(href);
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    return `${url.host}${path}`;
  } catch {
    return value;
  }
}
