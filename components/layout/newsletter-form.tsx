"use client";

import { useState, type FormEvent } from "react";
import { newsletter } from "@/lib/content/home";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
  const [message, setMessage] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(newsletter.success);
  }

  return (
    <div>
      <form
        onSubmit={onSubmit}
        aria-label="Newsletter signup"
        className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.05] py-1.25 pr-1.25 pl-3 transition-colors duration-200 focus-within:border-[#2fe85c]"
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Email address</span>
          <Input
            variant="bare"
            type="email"
            required
            placeholder={newsletter.placeholder}
            className="w-full border-0 bg-transparent text-[13.5px] text-[#eceae2] outline-none placeholder:text-[#6d736a]"
          />
        </label>
        <button
          type="submit"
          aria-label="Subscribe"
          className="grid size-8.5 shrink-0 cursor-pointer place-items-center rounded-lg bg-[#2fe85c] text-[#0f1512] transition-transform duration-200 hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-[#2fe85c]/50 focus-visible:outline-none"
        >
          <svg
            aria-hidden
            viewBox="0 0 20 16"
            className="h-3.25 w-4"
            fill="none"
          >
            <path
              d="M2.5 8h14m-3.5-3.25L16.5 8 13 11.25"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
      <p
        aria-live="polite"
        className="mt-2.25 min-h-[15px] text-[11.5px] text-[#6d736a]"
      >
        {message}
      </p>
    </div>
  );
}
