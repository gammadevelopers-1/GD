"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Loader2, Share2 } from "lucide-react";
import { Modal } from "@/components/admin/projects/modal";
import { useCloseOnSuccess } from "@/components/admin/projects/use-close-on-success";
import { FormSelect } from "@/components/common/form-select";
import { type SimpleFormState, IDLE_FORM } from "@/lib/projects/form-state";
import { BUTTON_PRIMARY, INPUT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export type ShareTarget = { id: string; name: string; count: number };

export function ShareContainers({
  projectId,
  containers,
  members,
  action,
  preselected,
  open,
  onClose,
}: {
  projectId: string;
  containers: ShareTarget[];
  members: Array<{ id: string; name: string }>;
  action: (
    state: SimpleFormState,
    formData: FormData,
  ) => Promise<SimpleFormState>;
  preselected: string[];
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM);
  const [chosen, setChosen] = useState<string[]>(preselected);

  useCloseOnSuccess(state, onClose);

  const total = containers
    .filter((container) => chosen.includes(container.id))
    .reduce((sum, container) => sum + container.count, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share containers"
      description="Everyone you pick gets each variable in these containers granted to them by name."
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="projectId" value={projectId} />

        <fieldset className="space-y-2">
          <legend className="mb-2 text-[12px] text-black/55">Containers</legend>
          {containers.map((container) => (
            <label
              key={container.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition",
                chosen.includes(container.id)
                  ? "border-[#16a34a]/50 bg-[#16a34a]/[0.06]"
                  : "border-black/[0.09] bg-white hover:border-black/20",
              )}
            >
              <input
                type="checkbox"
                name="groupId"
                value={container.id}
                checked={chosen.includes(container.id)}
                onChange={(event) =>
                  setChosen((was) =>
                    event.target.checked
                      ? [...was, container.id]
                      : was.filter((id) => id !== container.id),
                  )
                }
                className="size-4 shrink-0 accent-[#16a34a]"
              />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-black/80">
                {container.name}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-black/40">
                {container.count}
              </span>
            </label>
          ))}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-[12px] text-black/55">Share with</span>
            <FormSelect
              name="profileId"
              required
              triggerClassName={cn(INPUT, "h-10")}
              options={[
                { value: "", label: "Choose someone" },
                ...members.map((member) => ({
                  value: member.id,
                  label: member.name,
                })),
              ]}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] text-black/55">They may</span>
            <FormSelect
              name="access"
              defaultValue="use"
              triggerClassName={cn(INPUT, "h-10")}
              options={[
                { value: "use", label: "Copy the value" },
                { value: "manage", label: "Copy and change it" },
              ]}
            />
          </label>
        </div>

        {state.status === "error" && state.message ? (
          <p
            role="alert"
            className="flex items-start gap-2 text-[12px] text-red-700"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || !chosen.length}
          className={cn(BUTTON_PRIMARY, "h-10 w-full")}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Share2 className="size-3.5" />
          )}
          {total ? `Share ${total} variable${total === 1 ? "" : "s"}` : "Share"}
        </button>
      </form>
    </Modal>
  );
}
