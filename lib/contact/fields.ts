/**
 * The questions on /contact, in one place.
 *
 * The form renders from these lists and the route validates against them, so a
 * select can only ever come back holding something we offered. Adding a
 * question is a list here, a field in the form, a column in the migration.
 */

export const ROLES = [
  "Founder / CEO",
  "C-suite",
  "Director / Head of",
  "Manager",
  "Operations",
  "Technology / IT",
  "Other",
] as const;

export const HEADCOUNTS = [
  "1–10",
  "11–50",
  "51–200",
  "201–500",
  "500+",
] as const;

export const REVENUES = [
  "Under $500k",
  "$500k – $2M",
  "$2M – $10M",
  "$10M – $50M",
  "$50M+",
  "Prefer not to say",
] as const;

export const STAGES = [
  "Exploring what is possible",
  "We know the problem, not the fix",
  "We tried something and it did not stick",
  "Ready to build",
  "Replacing a system we already run",
] as const;

export const BUDGETS = [
  "Not set yet",
  "Under $10k",
  "$10k – $25k",
  "$25k – $50k",
  "$50k – $100k",
  "$100k+",
] as const;

export const TIMELINES = [
  "As soon as possible",
  "Within a month",
  "This quarter",
  "Next quarter",
  "Still planning",
] as const;

export type LeadInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  roleTitle: string;
  headcount: string;
  revenue: string;
  stage: string;
  budget: string;
  timeline: string;
  summary: string;
};

/** Mirrors app_contact_leads_email_shape so the two cannot drift. */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Addresses that tell us nothing about who is writing. */
const FREE_MAIL = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "mail.com",
  "gmx.com",
  "yandex.com",
]);

export function isFreeMail(email: string) {
  return FREE_MAIL.has(email.split("@")[1]?.toLowerCase() ?? "");
}

function text(raw: unknown, max: number) {
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

export type LeadParse =
  | { ok: true; value: LeadInput }
  | { ok: false; field: keyof LeadInput; error: string };

function bad(field: keyof LeadInput, error: string): LeadParse {
  return { ok: false, field, error };
}

/**
 * Trusts nothing. Every select has to hold one of the strings we offered, so a
 * hand-rolled POST cannot write "budget: <script>" into the console a person
 * reads.
 */
export function parseLead(raw: unknown): LeadParse {
  const body = (raw ?? {}) as Record<string, unknown>;

  const value: LeadInput = {
    firstName: text(body.firstName, 80),
    lastName: text(body.lastName, 80),
    email: text(body.email, 254).toLowerCase(),
    phone: text(body.phone, 40),
    company: text(body.company, 160),
    country: text(body.country, 80),
    roleTitle: text(body.roleTitle, 80),
    headcount: text(body.headcount, 40),
    revenue: text(body.revenue, 40),
    stage: text(body.stage, 80),
    budget: text(body.budget, 40),
    timeline: text(body.timeline, 40),
    summary: text(body.summary, 4000),
  };

  if (!value.firstName) return bad("firstName", "Tell us your first name.");
  if (!value.lastName) return bad("lastName", "Tell us your last name.");
  if (!EMAIL.test(value.email))
    return bad("email", "That email address does not look right.");
  if (!value.company) return bad("company", "Tell us where you work.");
  if (!value.country)
    return bad("country", "Tell us which country you are in.");

  const oneOf: Array<[keyof LeadInput, readonly string[], string]> = [
    ["roleTitle", ROLES, "Pick your role."],
    ["headcount", HEADCOUNTS, "Pick a headcount."],
    ["revenue", REVENUES, "Pick a revenue band."],
    ["stage", STAGES, "Pick where you are."],
    ["budget", BUDGETS, "Pick a budget."],
    ["timeline", TIMELINES, "Pick a timeline."],
  ];

  for (const [field, options, message] of oneOf) {
    if (!options.includes(value[field])) return bad(field, message);
  }

  if (value.summary.length < 10)
    return bad("summary", "A sentence or two about the problem, please.");

  return { ok: true, value };
}

/** The shape app_submit_contact_lead reads. */
export function leadPayload(
  value: LeadInput,
  meta: {
    sourcePath: string;
    referrer: string;
    ipHash: string;
    userAgent: string;
  },
) {
  return {
    first_name: value.firstName,
    last_name: value.lastName,
    email: value.email,
    phone: value.phone,
    company: value.company,
    country: value.country,
    role_title: value.roleTitle,
    headcount: value.headcount,
    revenue: value.revenue,
    stage: value.stage,
    budget: value.budget,
    timeline: value.timeline,
    summary: value.summary,
    source_path: meta.sourcePath,
    referrer: meta.referrer,
    ip_hash: meta.ipHash,
    user_agent: meta.userAgent,
  };
}

/** The notification that lands in the shared inbox. */
export function leadEmail(value: LeadInput, consoleUrl: string) {
  const name = `${value.firstName} ${value.lastName}`;
  const lines = [
    `${name} · ${value.roleTitle} · ${value.company}`,
    `${value.email}${value.phone ? ` · ${value.phone}` : ""}`,
    `${value.country}`,
    "",
    `Headcount   ${value.headcount}`,
    `Revenue     ${value.revenue}`,
    `Stage       ${value.stage}`,
    `Budget      ${value.budget}`,
    `Timeline    ${value.timeline}`,
    "",
    "What they want solved:",
    value.summary,
    "",
    consoleUrl
      ? `Reply to this email to answer ${value.firstName} directly, or work the lead in the console:\n${consoleUrl}`
      : `Reply to this email to answer ${value.firstName} directly.`,
  ];

  return {
    subject: `Enquiry · ${value.company} · ${name}`,
    body: lines.join("\n"),
  };
}
