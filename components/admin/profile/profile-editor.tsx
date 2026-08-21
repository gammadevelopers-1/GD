"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, UserRound } from "lucide-react";
import { saveMyProfile } from "@/app/(admin)/profile/actions";
import { Card, CardContent } from "@/components/ui/card";
import type { MyProfile } from "@/data/profile";
import { IDLE_FORM } from "@/lib/projects/form-state";
import { BUTTON_PRIMARY, INPUT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export function ProfileEditor({ profile }: { profile: MyProfile }) {
  const [state, action, pending] = useActionState(saveMyProfile, IDLE_FORM);
  const [preview, setPreview] = useState<string | null>(profile.avatarUrl);

  return (
    <Card className="border-black/[0.07] bg-[#f8f8f3] py-0 shadow-none">
      <CardContent className="p-5">
        <form action={action} className="space-y-5">
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#15181b] text-lg font-semibold text-[#2fe85c]">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="size-full object-cover" />
              ) : (
                <UserRound className="size-6" />
              )}
            </span>

            <label className="min-w-0 flex-1 space-y-1.5">
              <span className="text-[12px] text-black/55">Picture</span>
              <input
                type="file"
                name="avatar"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setPreview(
                    file ? URL.createObjectURL(file) : profile.avatarUrl,
                  );
                }}
                className={cn(
                  INPUT,
                  "h-10 py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-black/[0.06] file:px-2.5 file:py-1 file:text-xs file:font-medium",
                )}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[12px] text-black/55">Display name</span>
            <input
              name="displayName"
              defaultValue={profile.displayName ?? ""}
              minLength={2}
              maxLength={60}
              placeholder={profile.fullName}
              className={cn(INPUT, "h-10")}
            />
          </label>

          {state.status === "error" && state.message ? (
            <p role="alert" className="text-[12px] text-red-700">
              {state.message}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className={cn(BUTTON_PRIMARY, "h-10")}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save changes
            </button>

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
