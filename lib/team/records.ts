export const TEAM_ROLES = ["member", "finance", "owner"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const EMPLOYMENT_TYPES = ["employee", "contractor", "intern"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Owner",
  member: "Member",
  finance: "Finance",
};

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  owner: " ",
  member: " ",
  finance: " ",
};

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  employee: "Employee",
  contractor: "Contractor",
  intern: "Intern",
};

export const TEAM_FIELDS = [
  "fullName",
  "email",
  "role",
  "jobTitle",
  "phone",
  "employmentType",
  "startDate",
  "salaryAmount",
  "cnic",
  "bankAccountTitle",
  "bankAccountNumber",
  "bankName",
] as const;

export type TeamField = (typeof TEAM_FIELDS)[number];
export type TeamFieldErrors = Partial<Record<TeamField, string>>;
export type TeamFormValues = Record<TeamField, string>;

export type TeamFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: TeamFieldErrors;
  values: TeamFormValues | null;
};

export const IDLE_TEAM_FORM: TeamFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  values: null,
};

export function teamFormError(
  message: string,
  fieldErrors: TeamFieldErrors = {},
  values: TeamFormValues | null = null,
): TeamFormState {
  return { status: "error", message, fieldErrors, values };
}

export function teamFormSuccess(message: string): TeamFormState {
  return { status: "success", message, fieldErrors: {}, values: null };
}

export type ParsedTeamRecord = {
  fullName: string;
  email: string;
  role: TeamRole;
  jobTitle: string;
  phone: string | null;
  employmentType: EmploymentType | null;
  startDate: string | null;
  salaryAmount: number | null;
  cnic: string | null;
  bankAccountTitle: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PHONE = /^[+0-9][0-9\s\-()]{4,31}$/;

export const SALARY_MAX = 99_999_999;
export const PASSWORD_MIN = 12;

export function isTeamRole(value: string): value is TeamRole {
  return (TEAM_ROLES as readonly string[]).includes(value);
}

export function isEmploymentType(value: string): value is EmploymentType {
  return (EMPLOYMENT_TYPES as readonly string[]).includes(value);
}

export function isIsoDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function formatCnic(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 13) return null;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function normaliseAccountNumber(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export function readTeamForm(formData: FormData): TeamFormValues {
  const values = {} as TeamFormValues;
  for (const field of TEAM_FIELDS) {
    values[field] = String(formData.get(field) ?? "").trim();
  }
  return values;
}

export function validateTeamRecord(values: TeamFormValues): {
  errors: TeamFieldErrors;
  parsed: ParsedTeamRecord | null;
} {
  const errors: TeamFieldErrors = {};

  if (!values.fullName) {
    errors.fullName = "Enter their full name.";
  } else if (values.fullName.length < 2 || values.fullName.length > 120) {
    errors.fullName = "Use between 2 and 120 characters.";
  }

  const email = values.email.toLowerCase();
  if (!email) {
    errors.email = "Enter their email address.";
  } else if (!EMAIL.test(email)) {
    errors.email = "That is not a valid email address.";
  }

  if (!isTeamRole(values.role)) {
    errors.role = "Choose member, finance or owner.";
  }

  if (!values.jobTitle) {
    errors.jobTitle = "Give them a job title.";
  } else if (values.jobTitle.length < 2 || values.jobTitle.length > 120) {
    errors.jobTitle = "Use between 2 and 120 characters.";
  }

  if (values.phone && !PHONE.test(values.phone)) {
    errors.phone = "That does not look like a phone number.";
  }

  if (values.employmentType && !isEmploymentType(values.employmentType)) {
    errors.employmentType = "Choose employee, contractor or intern.";
  }

  if (values.startDate && !isIsoDate(values.startDate)) {
    errors.startDate = "Use a real date.";
  }

  let salaryAmount: number | null = null;
  if (values.salaryAmount) {
    const cleaned = values.salaryAmount.replace(/[\s,]/g, "");
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed) || parsed < 0) {
      errors.salaryAmount = "Enter the monthly salary as a positive number.";
    } else if (parsed > SALARY_MAX) {
      errors.salaryAmount = "That salary is too large to record.";
    } else {
      salaryAmount = parsed;
    }
  }

  let cnic: string | null = null;
  if (values.cnic) {
    cnic = formatCnic(values.cnic);
    if (!cnic) errors.cnic = "A CNIC is 13 digits.";
  }

  let bankAccountNumber: string | null = null;
  if (values.bankAccountNumber) {
    bankAccountNumber = normaliseAccountNumber(values.bankAccountNumber);
    if (!/^[A-Z0-9]{6,34}$/.test(bankAccountNumber)) {
      errors.bankAccountNumber = "Use the account number or IBAN.";
    }
  }

  if (values.bankName && values.bankName.length > 120) {
    errors.bankName = "Keep the bank name under 120 characters.";
  }

  if (values.bankAccountTitle && values.bankAccountTitle.length > 120) {
    errors.bankAccountTitle = "Keep the account title under 120 characters.";
  }

  if (Object.keys(errors).length) return { errors, parsed: null };

  return {
    errors,
    parsed: {
      fullName: values.fullName,
      email,
      role: values.role as TeamRole,
      jobTitle: values.jobTitle,
      phone: values.phone || null,
      employmentType: values.employmentType
        ? (values.employmentType as EmploymentType)
        : null,
      startDate: values.startDate || null,
      salaryAmount,
      cnic,
      bankAccountTitle: values.bankAccountTitle || null,
      bankAccountNumber,
      bankName: values.bankName || null,
    },
  };
}

export function teamErrorSummary(errors: TeamFieldErrors) {
  const count = Object.keys(errors).length;
  if (!count) return null;
  return count === 1
    ? "One field needs attention."
    : `${count} fields need attention.`;
}
