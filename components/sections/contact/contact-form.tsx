"use client";

import { useState, type FormEvent } from "react";
import { contact } from "@/lib/content/home";
import { FormSelect } from "@/components/common/form-select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FIELD =
  "h-12 rounded-xl border border-black/14 bg-[#fbfbf8] px-3.75 text-[15px] outline-none transition-[border-color,box-shadow] duration-200 focus:border-brand focus:shadow-[0_0_0_3px_rgba(47,232,92,0.16)]";
const LABEL =
  "text-muted-foreground flex flex-col gap-1.75 text-[13px] font-medium";

export function ContactForm() {
  const [message, setMessage] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(contact.success);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-border rounded-[24px] border bg-white p-6 shadow-[0_30px_70px_-34px_rgba(16,24,40,0.34)] sm:p-9.5"
    >
      <div className="grid gap-4.5 sm:grid-cols-2">
        <label className={LABEL}>
          Full name
          <Input
            variant="bare"
            required
            placeholder="Sara Malik"
            className={FIELD}
          />
        </label>
        <label className={LABEL}>
          Work email
          <Input
            variant="bare"
            required
            type="email"
            placeholder="you@company.com"
            className={FIELD}
          />
        </label>
        <label className={LABEL}>
          Company
          <Input variant="bare" placeholder="Cortek" className={FIELD} />
        </label>
        <div className={LABEL}>
          Team size
          <FormSelect
            name="teamSize"
            ariaLabel="Team size"
            defaultValue="1–10"
            options={contact.teamSizes.map((size) => ({
              value: size,
              label: size,
            }))}
            triggerClassName={`${FIELD} text-foreground`}
          />
        </div>
      </div>

      <label className={`${LABEL} mt-4.5`}>
        What’s the messiest part of your day?
        <Textarea
          rows={5}
          placeholder="Leads arrive on WhatsApp and get missed. We retype every booking into two systems..."
          variant="bare"
          className="focus:border-brand resize-y rounded-xl border border-black/14 bg-[#fbfbf8] px-3.75 py-3.25 text-[15px] leading-[1.55] transition-[border-color,box-shadow] duration-200 outline-none focus:shadow-[0_0_0_3px_rgba(47,232,92,0.16)]"
        />
      </label>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3.5">
        <p className="max-w-[34ch] text-xs text-black/40">
          {contact.disclaimer}
        </p>
        <Button
          variant="marketing"
          size="marketing"
          type="submit"
          data-button-fill
          className="cursor-pointer px-7.5"
        >
          <span className="button-fill-fx__label">{contact.cta}</span>
        </Button>
      </div>

      <p
        aria-live="polite"
        className="text-gd-light-emerald mt-4 min-h-5 text-[13.5px] font-medium"
      >
        {message}
      </p>
    </form>
  );
}
