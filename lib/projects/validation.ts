import {
  type ProjectStatus,
  PROJECT_STATUSES,
  isProjectStatus,
} from "@/lib/projects/status";

// The form and the server share these rules. The server is the one that counts.
export const PROJECT_FIELDS = [
  "name",
  "clientId",
  "description",
  "leadId",
  "startsOn",
  "dueOn",
  "status",
  "valueAmount",
  "valueCurrency",
  "exchangeRate",
  "bookedOn",
] as const;

export type ProjectField = (typeof PROJECT_FIELDS)[number];
export type FieldErrors = Partial<Record<ProjectField, string>>;
export type ProjectFormValues = Record<ProjectField, string>;

export type ProjectFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: FieldErrors;
  values: ProjectFormValues | null;
};

export const IDLE_PROJECT_FORM: ProjectFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  values: null,
};

export type ProjectFinancialInput = {
  amount: number;
  currency: "PKR" | "USD";
  rate: number;
  bookedOn: string;
};

export type ParsedProject = {
  name: string;
  clientId: string;
  description: string | null;
  leadId: string | null;
  startsOn: string | null;
  dueOn: string | null;
  status: ProjectStatus;
  financial: ProjectFinancialInput | null;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const NAME_MAX = 120;
export const DESCRIPTION_MAX = 2000;
export const AMOUNT_MAX = 999_999_999_999;

export function isUuid(value: string) {
  return UUID.test(value);
}

export function isIsoDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function readProjectForm(formData: FormData): ProjectFormValues {
  const values = {} as ProjectFormValues;
  for (const field of PROJECT_FIELDS) {
    values[field] = String(formData.get(field) ?? "").trim();
  }
  return values;
}

function parseAmount(raw: string) {
  const cleaned = raw.replace(/[\s,]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : Number.NaN;
}

export function validateProject(
  values: ProjectFormValues,
  options: { allowFinancial: boolean; hasExistingValue?: boolean },
): { errors: FieldErrors; parsed: ParsedProject | null } {
  const errors: FieldErrors = {};

  const name = values.name;
  if (!name) {
    errors.name = "Give the project a name.";
  } else if (name.length < 2) {
    errors.name = "Use at least 2 characters.";
  } else if (name.length > NAME_MAX) {
    errors.name = `Keep the name under ${NAME_MAX} characters.`;
  }

  if (!values.clientId) {
    errors.clientId = "Choose the client this project belongs to.";
  } else if (!isUuid(values.clientId)) {
    errors.clientId = "That client is not valid.";
  }

  if (values.leadId && !isUuid(values.leadId)) {
    errors.leadId = "That person is not valid.";
  }

  if (values.description.length > DESCRIPTION_MAX) {
    errors.description = `Keep the description under ${DESCRIPTION_MAX} characters.`;
  }

  if (values.startsOn && !isIsoDate(values.startsOn)) {
    errors.startsOn = "Use a real date.";
  }
  if (values.dueOn && !isIsoDate(values.dueOn)) {
    errors.dueOn = "Use a real date.";
  }
  if (
    !errors.startsOn &&
    !errors.dueOn &&
    values.startsOn &&
    values.dueOn &&
    values.dueOn < values.startsOn
  ) {
    errors.dueOn = "The due date cannot be before the start date.";
  }

  const status = values.status || "discovery";
  if (!isProjectStatus(status)) {
    errors.status = `Choose one of: ${PROJECT_STATUSES.join(", ")}.`;
  }

  let financial: ProjectFinancialInput | null = null;

  if (options.allowFinancial) {
    const amount = parseAmount(values.valueAmount);

    if (amount === null && options.hasExistingValue) {
      errors.valueAmount =
        "A recorded project value can be corrected but not removed.";
    } else if (amount !== null) {
      const currency = values.valueCurrency || "USD";
      const rate = parseAmount(values.exchangeRate);
      const bookedOn = values.bookedOn || new Date().toISOString().slice(0, 10);

      if (Number.isNaN(amount) || amount < 0) {
        errors.valueAmount = "Enter the value as a positive number.";
      } else if (amount > AMOUNT_MAX) {
        errors.valueAmount = "That value is too large to record.";
      }

      if (currency !== "PKR" && currency !== "USD") {
        errors.valueCurrency = "Projects are booked in PKR or USD.";
      }

      if (rate === null) {
        errors.exchangeRate = "Record the PKR rate used on the booking date.";
      } else if (Number.isNaN(rate) || rate <= 0) {
        errors.exchangeRate = "The rate must be greater than zero.";
      }

      if (!isIsoDate(bookedOn)) {
        errors.bookedOn = "Use a real date.";
      }

      if (
        !errors.valueAmount &&
        !errors.valueCurrency &&
        !errors.exchangeRate &&
        !errors.bookedOn
      ) {
        financial = {
          amount: amount as number,
          currency: currency as "PKR" | "USD",
          rate: rate as number,
          bookedOn,
        };
      }
    }
  }

  if (Object.keys(errors).length) return { errors, parsed: null };

  return {
    errors,
    parsed: {
      name,
      clientId: values.clientId,
      description: values.description || null,
      leadId: values.leadId || null,
      startsOn: values.startsOn || null,
      dueOn: values.dueOn || null,
      status: status as ProjectStatus,
      financial,
    },
  };
}

export function errorSummary(errors: FieldErrors) {
  const count = Object.keys(errors).length;
  if (!count) return null;
  return count === 1
    ? "One field needs attention."
    : `${count} fields need attention.`;
}
