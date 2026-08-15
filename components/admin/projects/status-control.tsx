"use client";

import { useRef, useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  type ProjectStatus,
} from "@/lib/projects/status";

/**
 * Moving a project along its lifecycle is the most frequent owner action, so
 * it lives in the project header rather than behind the edit form.
 */
export function StatusControl({
  projectId,
  status,
  action,
}: {
  projectId: string;
  status: ProjectStatus;
  action: (formData: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form ref={formRef} action={action} className="relative">
      <input type="hidden" name="projectId" value={projectId} />
      <label className="sr-only" htmlFor="project-status">
        Project status
      </label>
      <select
        id="project-status"
        name="status"
        defaultValue={status}
        disabled={pending}
        onChange={(event) => {
          const form = event.currentTarget.form;
          if (!form) return;
          startTransition(() => form.requestSubmit());
        }}
        className="h-9 cursor-pointer appearance-none rounded-full border border-white/[0.12] bg-white/[0.06] py-0 pr-8 pl-3.5 text-xs font-semibold text-white capitalize outline-none transition hover:border-white/25 focus-visible:ring-2 focus-visible:ring-[#2fe85c]/40 disabled:opacity-60"
      >
        {PROJECT_STATUSES.map((value) => (
          <option key={value} value={value} className="text-black">
            {PROJECT_STATUS_LABEL[value]}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-white/45">
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <ChevronDown className="size-3.5" />
        )}
      </span>
    </form>
  );
}
