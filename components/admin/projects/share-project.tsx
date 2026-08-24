"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Loader2, Share2 } from "lucide-react";
import type { ShareState } from "@/app/(admin)/projects/client-actions";
import { Modal } from "@/components/admin/projects/modal";
import { Issued } from "@/components/admin/projects/issued-access";
import { INPUT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const IDLE: ShareState = { status: "idle", message: null };

export type ShareAction = (
  state: ShareState,
  formData: FormData,
) => Promise<ShareState>;

export function ShareProject({
  projectId,
  publicId,
  share,
}: {
  projectId: string;
  publicId: string;
  share: ShareAction;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(share, IDLE);

  const issued = state.issued;

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-xs font-semibold text-white transition duration-200 hover:bg-white/[0.16] hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)] focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none active:scale-[0.97]"
      >
        <Share2 className="size-3.5" />
        Share project
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Share this project"
        description={issued ? undefined : " "}
      >
        {issued ? (
          <Issued issued={issued} onClose={close} />
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="publicId" value={publicId} />

            <label className="block space-y-1.5">
              <span className="text-[12px] text-black/55">Client name</span>
              <input
                name="fullName"
                required
                maxLength={120}
                autoFocus
                placeholder="How they should be addressed"
                className={cn(INPUT, "h-10")}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[12px] text-black/55">Client email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="name@company.com"
                className={cn(INPUT, "h-10")}
              />
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-black/[0.09] bg-white px-3.5 py-3">
              <input
                type="checkbox"
                name="canEditMilestones"
                className="mt-0.5 size-4 shrink-0 accent-[#16a34a]"
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-black/80">
                  Allow editing the milestone board
                </span>
              </span>
            </label>

            {state.status === "error" && state.message ? (
              <p
                role="alert"
                className="flex items-start gap-2 text-[12px] text-red-700"
              >
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {state.message}
              </p>
            ) : null}

            <Button
              variant="admin-primary"
              size="none"
              type="submit"
              disabled={pending}
              className="h-10 w-full"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Create access
            </Button>

            <p className="text-[11.5px] leading-5 text-black/40">
              A password is generated for them. It is shown to you once, on the
              next screen.
            </p>
          </form>
        )}
      </Modal>
    </>
  );
}
