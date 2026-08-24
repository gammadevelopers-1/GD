"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { BannerCropper } from "@/components/admin/projects/banner-cropper";
import {
  BANNER_MAX_BYTES,
  BANNER_TOO_LARGE,
  BANNER_TYPES,
  type BannerFormState,
  IDLE_BANNER,
} from "@/lib/projects/banner";
import { toast } from "@/components/ui/sonner";

type BannerAction = (
  state: BannerFormState,
  formData: FormData,
) => Promise<BannerFormState>;

const PILL =
  "inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-xs font-semibold text-white transition duration-200 hover:bg-white/[0.16] focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none active:scale-[0.97] disabled:opacity-60";

export function BannerControl({
  projectId,
  hasBanner,
  save,
  remove,
}: {
  projectId: string;
  hasBanner: boolean;
  save: BannerAction;
  remove: BannerAction;
}) {
  const [saveState, saveAction, saving] = useActionState(save, IDLE_BANNER);
  const [removeState, removeAction, removing] = useActionState(
    remove,
    IDLE_BANNER,
  );
  const [pending, setPending] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const announced = useRef<string | null>(null);

  const serverError =
    saveState.status === "error"
      ? saveState.message
      : removeState.status === "error"
        ? removeState.message
        : null;
  const warning = saveState.status === "success" ? saveState.warning : null;

  const notice = localError ?? serverError ?? warning ?? null;
  const tone = localError || serverError ? "error" : "warning";

  useEffect(() => {
    if (!notice) {
      announced.current = null;
      return;
    }
    if (announced.current === notice) return;
    announced.current = notice;
    (tone === "error" ? toast.error : toast.warning)(notice);
  }, [notice, tone]);

  function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!BANNER_TYPES.includes(file.type)) {
      setLocalError("Use a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > BANNER_MAX_BYTES) {
      setLocalError(BANNER_TOO_LARGE);
      return;
    }

    setLocalError(null);
    setPending(file);
  }

  function upload(cropped: File) {
    setPending(null);
    if (cropped.size > BANNER_MAX_BYTES) {
      setLocalError(BANNER_TOO_LARGE);
      return;
    }
    const data = new FormData();
    data.set("projectId", projectId);
    data.set("file", cropped);
    startTransition(() => saveAction(data));
  }

  return (
    <div className="flex flex-col items-start gap-1.5 lg:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={BANNER_TYPES.join(",")}
          className="sr-only"
          onChange={pick}
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

        {hasBanner ? (
          <form action={removeAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <button
              disabled={removing}
              aria-label="Remove banner"
              title="Remove banner"
              className="grid size-9 place-items-center rounded-full bg-white/[0.08] text-white/80 transition duration-200 hover:bg-white/[0.16] hover:text-white focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none active:scale-[0.97] disabled:opacity-60"
            >
              <Trash2 className="size-3.5" />
            </button>
          </form>
        ) : null}
      </div>

      {pending ? (
        <BannerCropper
          key={`${pending.name}-${pending.size}-${pending.lastModified}`}
          file={pending}
          saving={saving}
          onCancel={() => setPending(null)}
          onSave={upload}
        />
      ) : null}
    </div>
  );
}
