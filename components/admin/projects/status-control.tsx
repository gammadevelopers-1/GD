"use client";

import { useRef, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { FormSelect } from "@/components/common/form-select";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  type ProjectStatus,
} from "@/lib/projects/status";

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
      <FormSelect
        id="project-status"
        name="status"
        defaultValue={status}
        disabled={pending}
        onValueChange={() => {
          const form = formRef.current;
          if (!form) return;
          startTransition(() => form.requestSubmit());
        }}
        triggerClassName="h-9 cursor-pointer appearance-none rounded-full border border-white/[0.12] bg-white/[0.06] py-0 pr-8 pl-3.5 text-xs font-semibold text-white capitalize transition outline-none hover:border-white/25 focus-visible:border-white/25 focus-visible:ring-2 focus-visible:ring-[#2fe85c]/40 disabled:opacity-60 [&>svg]:text-white/45"
        contentClassName="z-[70]"
        options={PROJECT_STATUSES.map((value) => ({
          value,
          label: PROJECT_STATUS_LABEL[value],
        }))}
      />
      {pending ? (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-white/45">
          <Loader2 className="size-3.5 animate-spin" />
        </span>
      ) : null}
    </form>
  );
}
