"use client";

import { useActionState, useRef, useState } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import { saveMyProfile } from "@/app/(admin)/profile/actions";
import { EDIT_FIELD_ID } from "@/components/admin/profile/profile-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { MyProfile } from "@/data/profile";
import { IDLE_FORM } from "@/lib/projects/form-state";
import { initials as toInitials } from "@/lib/projects/format";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export function ProfileEditor({ profile }: { profile: MyProfile }) {
  const [state, action, pending] = useActionState(saveMyProfile, IDLE_FORM);
  const [preview, setPreview] = useState<string | null>(profile.avatarUrl);
  const [fileName, setFileName] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  return (
    <Card className="border-black/[0.07] bg-[#f8f8f3] py-0 shadow-none">
      <CardContent className="p-5">
        <h2 className="mb-4 font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
          Edit details
        </h2>

        <form action={action} className="space-y-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => picker.current?.click()}
              aria-label="Change picture"
              className="group/pick relative shrink-0 cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none"
            >
              <Avatar className="size-16 rounded-2xl after:rounded-2xl">
                {preview ? (
                  <AvatarImage src={preview} alt="" className="rounded-2xl" />
                ) : null}
                <AvatarFallback className="rounded-2xl bg-[#15181b] font-mono text-lg font-semibold text-[#2fe85c]">
                  {toInitials(profile.displayName ?? profile.fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 grid place-items-center rounded-2xl bg-black/45 text-white opacity-0 transition-opacity duration-200 group-hover/pick:opacity-100 group-focus-visible/pick:opacity-100">
                <Camera className="size-5" />
              </span>
            </button>

            <div className="min-w-0 flex-1 space-y-2">
              <Label className="text-[12px] font-normal text-black/55">
                Picture
              </Label>
              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => picker.current?.click()}
                  className={cn(BUTTON_SECONDARY, "h-9 px-3 text-xs")}
                >
                  Choose file
                </Button>
                <span className="min-w-0 truncate text-[12px] text-black/40">
                  {fileName ??
                    (profile.avatarUrl
                      ? "Current picture"
                      : "PNG, JPEG or WebP")}
                </span>
              </div>
              <input
                ref={picker}
                type="file"
                name="avatar"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setFileName(file ? file.name : null);
                  setPreview(
                    file ? URL.createObjectURL(file) : profile.avatarUrl,
                  );
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={EDIT_FIELD_ID}
              className="text-[12px] font-normal text-black/55"
            >
              Display name
            </Label>
            <input
              id={EDIT_FIELD_ID}
              name="displayName"
              defaultValue={profile.displayName ?? ""}
              minLength={2}
              maxLength={60}
              placeholder={profile.fullName}
              className={cn(INPUT, "h-10")}
            />
          </div>

          {state.status === "error" && state.message ? (
            <p role="alert" className="text-[12px] text-red-700">
              {state.message}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={pending}
              className={cn(BUTTON_PRIMARY, "h-10")}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save changes
            </Button>

            {state.status === "success" && state.message ? (
              <span className="flex items-center gap-1.5 text-[12px] text-[#0b5f2c]">
                <Check className="size-3.5" />
                {state.message}
              </span>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
