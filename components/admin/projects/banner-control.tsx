"use client";

import { useActionState, useRef } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import {
  BANNER_FITS,
  BANNER_FIT_ORDER,
  type BannerFit,
  type BannerFormState,
  IDLE_BANNER,
} from "@/lib/projects/banner";
import { cn } from "@/lib/utils";

type BannerAction = (
  state: BannerFormState,
  formData: FormData,
) => Promise<BannerFormState>;

const PILL =
  "inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-xs font-semibold text-white transition duration-200 hover:bg-white/[0.16] focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none active:scale-[0.97] disabled:opacity-60";

export function BannerControl({
  projectId,
  hasBanner,
  fit,
  save,
  setFit,
  remove,
}: {
  projectId: string;
  hasBanner: boolean;
  fit: BannerFit;
  save: BannerAction;
  setFit: BannerAction;
  remove: BannerAction;
}) {
  const [saveState, saveAction, saving] = useActionState(save, IDLE_BANNER);
  const [fitState, fitAction, fitting] = useActionState(setFit, IDLE_BANNER);
  const [removeState, removeAction, removing] = useActionState(
    remove,
    IDLE_BANNER,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const error =
    saveState.status === "error"
      ? saveState.message
      : fitState.status === "error"
        ? fitState.message
        : removeState.status === "error"
          ? removeState.message
          : null;
  const warning = saveState.status === "success" ? saveState.warning : null;

  return (
    <div className="flex flex-col items-start gap-1.5 lg:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {hasBanner ? (
          <form
            action={fitAction}
            className="flex items-center gap-0.5 rounded-full bg-white/[0.08] p-0.5"
          >
            <input type="hidden" name="projectId" value={projectId} />
            {BANNER_FIT_ORDER.map((option) => (
              <button
                key={option}
                name="fit"
                value={option}
                disabled={fitting}
                aria-pressed={fit === option}
                className={cn(
                  "rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition duration-200 focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none disabled:opacity-60",
                  fit === option
                    ? "bg-[#2fe85c] text-[#101512]"
                    : "text-white/55 hover:text-white",
                )}
              >
                {BANNER_FITS[option]}
              </button>
            ))}
          </form>
        ) : null}

        <form ref={formRef} action={saveAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="fit" value={fit} />
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              if (event.target.files?.length) formRef.current?.requestSubmit();
            }}
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => inputRef.current?.click()}
            className={PILL}
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ImagePlus className="size-3.5" />
            )}
            {hasBanner ? "Replace" : "Add banner"}
          </button>
        </form>

        {hasBanner ? (
          <form action={removeAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <button
              disabled={removing}
              aria-label="Remove banner"
              title="Remove banner"
              className="grid size-9 place-items-center rounded-full bg-white/[0.08] text-white/60 transition duration-200 hover:bg-white/[0.16] hover:text-white focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none active:scale-[0.97] disabled:opacity-60"
            >
              <Trash2 className="size-3.5" />
            </button>
          </form>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="max-w-xs text-[11px] text-red-300 lg:text-right"
        >
          {error}
        </p>
      ) : null}
      {!error && warning ? (
        <p
          role="status"
          className="max-w-xs text-[11px] text-amber-300 lg:text-right"
        >
          {warning}
        </p>
      ) : null}
    </div>
  );
}
