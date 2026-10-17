"use client";

import { track } from "@vercel/analytics";
import { useState, type FormEvent } from "react";

import { FormSelect } from "@/components/common/form-select";
import { contactPage } from "@/lib/content/contact";
import {
  BUDGETS,
  HEADCOUNTS,
  isFreeMail,
  parseLead,
  REVENUES,
  ROLES,
  STAGES,
  TIMELINES,
  type LeadInput,
} from "@/lib/contact/fields";
import { cn } from "@/lib/utils";

const { form } = contactPage;

const FIELD =
  "h-[52px] w-full rounded-[12px] border bg-white px-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-faint hover:border-line-strong focus:border-[rgba(13,119,40,0.55)] focus:shadow-[0_0_0_3px_rgba(47,232,92,0.13)]";

const LABEL = "t-meta text-ink-soft mb-2 block font-medium";

/**
 * SelectTrigger ships its own height and a `dark:` background. No dark variant
 * is configured for this site, so that background is Tailwind's default
 * prefers-color-scheme media query -- it would tint these boxes grey on a white
 * form for anyone whose OS is in dark mode. Both are pinned back here.
 */
const SELECT =
  "data-[size=default]:h-[52px] justify-between dark:bg-white dark:hover:bg-white";

function Required() {
  return (
    <span aria-hidden className="text-green-ink ml-0.5">
      *
    </span>
  );
}

/** Options carry a leading blank so the closed trigger reads "Choose one". */
function choices(options: readonly string[]) {
  return [
    { value: "", label: form.choose, disabled: true },
    ...options.map((option) => ({ value: option, label: option })),
  ];
}

export function ContactForm() {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [badField, setBadField] = useState<keyof LeadInput | null>(null);
  const [email, setEmail] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const formEl = event.currentTarget;
    const data = new FormData(formEl);
    const raw = Object.fromEntries(data.entries());

    // The same validator the route runs, so the message a person sees here is
    // the message the server would have sent back.
    const parsed = parseLead(raw);
    if (!parsed.ok) {
      setError(parsed.error);
      setBadField(parsed.field);
      return;
    }

    setSending(true);
    setError("");
    setBadField(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.value,
          website: String(raw.website ?? ""),
          sourcePath:
            typeof window === "undefined" ? "" : window.location.pathname,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        field?: keyof LeadInput;
      } | null;

      if (!response.ok || !result?.ok) {
        setError(result?.error || form.error);
        setBadField(result?.field ?? null);
        return;
      }

      formEl.reset();
      setEmail("");
      setDone(true);
      // Event name only. Vercel attaches the page it happened on, which is
      // the question worth answering; the answers themselves stay in Supabase.
      track("Enquiry sent");
    } catch {
      setError(form.error);
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="border-line rounded-[16px] border bg-white p-[clamp(28px,4vw,56px)] text-center shadow-[0_1px_2px_rgba(20,23,26,0.05),0_28px_64px_-44px_rgba(20,23,26,0.4)]">
        <span
          aria-hidden
          className="text-green-ink mx-auto grid size-12 place-items-center rounded-full bg-[rgba(13,119,40,0.1)] text-[20px] leading-none"
        >
          ✓
        </span>
        <h3 className="font-display text-ink mt-6 text-[clamp(22px,2.6vw,30px)] leading-[1.1] font-bold tracking-[-0.035em]">
          {form.success.title}
        </h3>
        <p className="text-ink-soft mx-auto mt-4 max-w-[46ch] text-[15px] leading-[1.65]">
          {form.success.body}
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="text-ink hover:text-green-ink mt-7 text-[14px] font-semibold underline underline-offset-4 transition-colors duration-200"
        >
          {form.success.again}
        </button>
      </div>
    );
  }

  const ring = (field: keyof LeadInput) =>
    cn(
      FIELD,
      badField === field
        ? "border-[#c2410c] shadow-[0_0_0_3px_rgba(194,65,12,0.12)]"
        : "border-line",
    );

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="border-line overflow-hidden rounded-[16px] border bg-white shadow-[0_1px_2px_rgba(20,23,26,0.05),0_28px_64px_-44px_rgba(20,23,26,0.4)]"
    >
      {/* Off-screen and hidden from assistive tech. Only a bot fills it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <input
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {/* 01 · You */}
      <Group index={0}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="firstName">
              {form.labels.firstName}
              <Required />
            </label>
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              placeholder={form.placeholders.firstName}
              className={ring("firstName")}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="lastName">
              {form.labels.lastName}
              <Required />
            </label>
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              placeholder={form.placeholders.lastName}
              className={ring("lastName")}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="email">
              {form.labels.email}
              <Required />
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={form.placeholders.email}
              className={ring("email")}
            />
            {isFreeMail(email) ? (
              <p className="text-dim mt-2 text-[12.5px] leading-[1.5]">
                {form.freeMailNote}
              </p>
            ) : null}
          </div>

          <div>
            <label className={LABEL} htmlFor="phone">
              {form.labels.phone}
              <span className="text-faint ml-1.5 font-normal">
                {form.optional}
              </span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder={form.placeholders.phone}
              className={ring("phone")}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="country">
              {form.labels.country}
              <Required />
            </label>
            <input
              id="country"
              name="country"
              autoComplete="country-name"
              placeholder={form.placeholders.country}
              className={ring("country")}
            />
          </div>

          <div>
            <span className={LABEL}>
              {form.labels.roleTitle}
              <Required />
            </span>
            <FormSelect
              name="roleTitle"
              ariaLabel={form.labels.roleTitle}
              options={choices(ROLES)}
              triggerClassName={cn(ring("roleTitle"), SELECT)}
            />
          </div>
        </div>
      </Group>

      {/* 02 · Your company */}
      <Group index={1}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="company">
              {form.labels.company}
              <Required />
            </label>
            <input
              id="company"
              name="company"
              autoComplete="organization"
              placeholder={form.placeholders.company}
              className={ring("company")}
            />
          </div>

          <div>
            <span className={LABEL}>
              {form.labels.headcount}
              <Required />
            </span>
            <FormSelect
              name="headcount"
              ariaLabel={form.labels.headcount}
              options={choices(HEADCOUNTS)}
              triggerClassName={cn(ring("headcount"), SELECT)}
            />
          </div>

          <div>
            <span className={LABEL}>
              {form.labels.revenue}
              <Required />
            </span>
            <FormSelect
              name="revenue"
              ariaLabel={form.labels.revenue}
              options={choices(REVENUES)}
              triggerClassName={cn(ring("revenue"), SELECT)}
            />
          </div>
        </div>
      </Group>

      {/* 03 · The work */}
      <Group index={2} last>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className={LABEL}>
              {form.labels.stage}
              <Required />
            </span>
            <FormSelect
              name="stage"
              ariaLabel={form.labels.stage}
              options={choices(STAGES)}
              triggerClassName={cn(ring("stage"), SELECT)}
            />
          </div>

          <div>
            <span className={LABEL}>
              {form.labels.budget}
              <Required />
            </span>
            <FormSelect
              name="budget"
              ariaLabel={form.labels.budget}
              options={choices(BUDGETS)}
              triggerClassName={cn(ring("budget"), SELECT)}
            />
          </div>

          <div>
            <span className={LABEL}>
              {form.labels.timeline}
              <Required />
            </span>
            <FormSelect
              name="timeline"
              ariaLabel={form.labels.timeline}
              options={choices(TIMELINES)}
              triggerClassName={cn(ring("timeline"), SELECT)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="summary">
              {form.labels.summary}
              <Required />
            </label>
            <textarea
              id="summary"
              name="summary"
              rows={6}
              placeholder={form.placeholders.summary}
              className={cn(
                ring("summary"),
                "h-auto resize-y py-3.5 leading-[1.6]",
              )}
            />
          </div>
        </div>
      </Group>

      <div className="border-line bg-ground/60 flex flex-col gap-5 border-t px-[clamp(20px,3.2vw,40px)] py-[clamp(20px,2.6vw,30px)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p aria-live="polite" className="min-h-0">
            {error ? (
              <span className="text-[13.5px] font-medium text-[#c2410c]">
                {error}
              </span>
            ) : (
              <span className="text-dim text-[13px]">{form.privacyNote}</span>
            )}
          </p>
          <p className="text-faint mt-1.5 text-[12.5px]">{form.replyNote}</p>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="bg-brand text-ink hover:bg-brand-hover inline-flex h-[52px] shrink-0 items-center justify-center rounded-[14px] px-7 text-[15px] font-semibold transition-[background-color,transform] duration-200 ease-out hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-current disabled:pointer-events-none disabled:opacity-60"
        >
          {sending ? form.sending : form.submit}
        </button>
      </div>
    </form>
  );
}

function Group({
  index,
  last,
  children,
}: {
  index: number;
  last?: boolean;
  children: React.ReactNode;
}) {
  const group = form.groups[index];

  return (
    <fieldset
      className={cn(
        "grid gap-6 px-[clamp(20px,3.2vw,40px)] py-[clamp(26px,3.4vw,42px)] lg:grid-cols-[210px_1fr] lg:gap-10",
        !last && "border-line border-b",
      )}
    >
      <legend className="sr-only">{group.title}</legend>

      <div className="lg:pt-1">
        <div className="flex items-center gap-2.5">
          <span className="t-eyebrow text-green-ink">{group.step}</span>
          <span aria-hidden className="bg-line h-px flex-1 lg:max-w-8" />
        </div>
        <h3 className="t-h4 text-ink mt-3">{group.title}</h3>
        <p className="text-dim mt-2 text-[13px] leading-[1.5]">{group.note}</p>
      </div>

      {children}
    </fieldset>
  );
}
