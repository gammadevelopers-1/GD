"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { saveMyProfile } from "@/app/(admin)/profile/actions";
import { EDIT_FIELD_ID } from "@/components/admin/profile/profile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { MyProfile } from "@/data/profile";
import { IDLE_FORM } from "@/lib/projects/form-state";
import { BUTTON_PRIMARY } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function ProfileEditor({ profile }: { profile: MyProfile }) {
  const [state, action, pending] = useActionState(saveMyProfile, IDLE_FORM);

  return (
    <Card className="border-black/[0.07] bg-[#f8f8f3] py-0 shadow-none">
      <CardContent className="p-5">
        <h2 className="mb-4 font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
          Edit details
        </h2>

        <form action={action} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor={EDIT_FIELD_ID}
              className="text-[12px] font-normal text-black/55"
            >
              Display name
            </Label>
            <Input
              variant="admin"
              id={EDIT_FIELD_ID}
              name="displayName"
              defaultValue={profile.displayName ?? ""}
              minLength={2}
              maxLength={60}
              placeholder={profile.fullName}
              className={cn("h-10")}
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
