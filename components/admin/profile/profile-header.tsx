"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Camera, Check, Copy, ImageUp, Loader2, SquarePen, Trash2 } from "lucide-react";
import {
  removeMyBanner,
  saveMyAvatar,
  saveMyBanner,
} from "@/app/(admin)/profile/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IDLE_FORM } from "@/lib/projects/form-state";
import { TONE_SOFT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export const EDIT_FIELD_ID = "profile-display-name";

export type ProfileStat = { label: string; value: string; suffix?: string };

const DEFAULT_COVER =
  "[background:radial-gradient(ellipse_50%_130%_at_82%_-10%,rgba(47,232,92,0.5),transparent_60%),linear-gradient(120deg,#0f1512,#08743d_78%,#2fe85c)]";

export function ProfileHeader({
  name,
  roleLabel,
  subtitle,
  email,
  avatarUrl,
  bannerUrl,
  initials,
  stats,
}: {
  name: string;
  roleLabel: string;
  subtitle: string;
  email: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  initials: string;
  stats: ProfileStat[];
}) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function focusEditor() {
    const field = document.getElementById(EDIT_FIELD_ID);
    if (!(field instanceof HTMLInputElement)) return;
    field.scrollIntoView({ block: "center", behavior: "smooth" });
    field.focus();
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-black/[0.07] bg-[#f8f8f3]">
      <Cover url={bannerUrl} />

      <div className="-mt-8 flex flex-wrap items-end gap-5 px-5 pb-6 sm:px-7">
        <Portrait url={avatarUrl} initials={initials} />

        <div className="min-w-0 flex-1 pb-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[26px] leading-none font-semibold tracking-[-0.04em]">
              {name}
            </h1>
           
            <Badge
              variant="outline"
              className={cn("rounded-full font-semibold", TONE_SOFT.muted)}
            >
              {roleLabel}
            </Badge>
          </div>
          <p className="mt-1.5 text-[13.5px] text-black/55">{subtitle}</p>
        </div>

        <div className="flex gap-2.5 pb-1">
          {email ? (
            <Button
              type="button"
              variant="outline"
              onClick={copyEmail}
              className="h-9.5 rounded-xl border-black/10 bg-white text-[13px] font-medium text-black/65 transition duration-200 hover:border-black/25 hover:text-black active:scale-[0.98]"
            >
              {copied ? (
                <Check className="size-3.5 text-[#0b5f2c]" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copied" : "Copy email"}
            </Button>
          ) : null}

          <Button
            type="button"
            onClick={focusEditor}
            className="h-9.5 rounded-xl bg-[#15181b] text-[13px] font-semibold text-white transition duration-200 hover:bg-black hover:shadow-[0_10px_24px_rgba(20,23,26,0.18)] active:scale-[0.98]"
          >
            <SquarePen className="size-3.5" />
            Edit profile
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-2 border-t border-black/[0.07] sm:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "px-5 py-4 transition-colors duration-150 hover:bg-white/60 sm:px-7",
              index < stats.length - 1 && "sm:border-r sm:border-black/[0.06]",
              index % 2 === 0 && "max-sm:border-r max-sm:border-black/[0.06]",
              index < 2 && "max-sm:border-b max-sm:border-black/[0.06]",
            )}
          >
            <dd className="font-display text-[22px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
              {stat.value}
              {stat.suffix ? (
                <span className="text-[13px] font-medium text-black/40">
                  {" "}
                  {stat.suffix}
                </span>
              ) : null}
            </dd>
            <dt className="mt-1.5 font-mono text-[9.5px] tracking-[0.14em] text-black/40 uppercase">
              {stat.label}
            </dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

function usePicturePreview(url: string | null) {
  const [preview, setPreview] = useState<string | null>(url);
  const [settled, setSettled] = useState<string | null>(url);

  if (url !== settled) {
    setSettled(url);
    setPreview(url);
  }

  return [preview, setPreview] as const;
}

function Cover({ url }: { url: string | null }) {
  const [state, action, pending] = useActionState(saveMyBanner, IDLE_FORM);
  const [removing, startRemoving] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = usePicturePreview(url);
  const busy = pending || removing;

  return (
    <div
      className={cn(
        "group/cover relative h-33",
        preview ? "bg-[#0f1512]" : DEFAULT_COVER,
      )}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_0)] [background-size:22px_22px] opacity-50"
        />
      )}

      <form ref={form} action={action} className="contents">
        <input
          ref={picker}
          type="file"
          name="banner"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setPreview(URL.createObjectURL(file));
            form.current?.requestSubmit();
          }}
        />
      </form>

      <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
        {state.status === "error" && state.message ? (
          <span
            role="alert"
            className="rounded-lg bg-red-950/70 px-2.5 py-1.5 text-[11.5px] font-medium text-red-100 backdrop-blur-sm"
          >
            {state.message}
          </span>
        ) : null}

        {url ? (
          <button
            type="button"
            disabled={busy}
            aria-label="Remove cover"
            onClick={() =>
              startRemoving(async () => {
                setPreview(null);
                await removeMyBanner();
              })
            }
            className="grid size-8.5 cursor-pointer place-items-center rounded-lg border border-white/20 bg-black/35 text-white/80 backdrop-blur-sm transition duration-200 hover:border-white/40 hover:bg-black/55 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => picker.current?.click()}
          className="inline-flex h-8.5 cursor-pointer items-center gap-2 rounded-lg border border-white/20 bg-black/35 px-3 text-[12.5px] font-medium text-white backdrop-blur-sm transition duration-200 hover:border-white/40 hover:bg-black/55 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ImageUp className="size-3.5" />
          )}
          Edit cover
        </button>
      </div>
    </div>
  );
}

function Portrait({
  url,
  initials,
}: {
  url: string | null;
  initials: string;
}) {
  const [state, action, pending] = useActionState(saveMyAvatar, IDLE_FORM);
  const form = useRef<HTMLFormElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = usePicturePreview(url);

  return (
    <div className="shrink-0">
      <form ref={form} action={action} className="contents">
        <input
          ref={picker}
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setPreview(URL.createObjectURL(file));
            form.current?.requestSubmit();
          }}
        />
      </form>

      <button
        type="button"
        disabled={pending}
        onClick={() => picker.current?.click()}
        aria-label="Change picture"
        className="group/pick relative block cursor-pointer rounded-3xl focus-visible:ring-2 focus-visible:ring-[#16a34a]/60 focus-visible:outline-none"
      >
        <Avatar className="size-24 rounded-3xl ring-4 ring-[#f8f8f3] after:rounded-3xl">
          {preview ? (
            <AvatarImage src={preview} alt="" className="rounded-3xl" />
          ) : null}
          <AvatarFallback className="rounded-3xl bg-[#15181b] font-mono text-3xl font-semibold text-[#2fe85c]">
            {initials}
          </AvatarFallback>
        </Avatar>

        <span
          className={cn(
            "absolute inset-0 grid place-items-center rounded-3xl bg-black/45 text-white transition-opacity duration-200",
            pending
              ? "opacity-100"
              : "opacity-0 group-hover/pick:opacity-100 group-focus-visible/pick:opacity-100",
          )}
        >
          {pending ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <Camera className="size-6" />
          )}
        </span>

       
      </button>

      {state.status === "error" && state.message ? (
        <p role="alert" className="mt-2 max-w-24 text-[11px] text-red-700">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
