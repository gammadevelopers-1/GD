"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Loader2, LogOut } from "lucide-react";
import {
  changeMyPassword,
  saveMyNotifications,
  signOutEverywhere,
} from "@/app/(admin)/settings/actions";
import { ConfirmAction } from "@/components/admin/projects/modal";
import { Card, CardContent } from "@/components/ui/card";
import type { MyProfile } from "@/data/profile";
import { IDLE_FORM } from "@/lib/projects/form-state";
import { PASSWORD_MIN } from "@/lib/team/records";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-black/[0.07] bg-[#f8f8f3] py-0 shadow-none">
      <CardContent className="p-5">
        <h2 className="mb-4 font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
          {title}
        </h2>
        {children}
      </CardContent>
    </Card>
  );
}

export function PasswordPanel() {
  const [state, action, pending] = useActionState(changeMyPassword, IDLE_FORM);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const tooShort = password.length > 0 && password.length < PASSWORD_MIN;
  const mismatch = confirmation.length > 0 && confirmation !== password;
  const valid = password.length >= PASSWORD_MIN && confirmation === password;

  return (
    <Panel title="Password">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-[12px] text-black/55">New password</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={cn(INPUT, "h-10")}
              required
            />
            {tooShort ? (
              <span className="block text-[12px] text-red-700">
                {PASSWORD_MIN - password.length} more character
                {PASSWORD_MIN - password.length === 1 ? "" : "s"} needed.
              </span>
            ) : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] text-black/55">Confirm password</span>
            <input
              name="confirmation"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className={cn(INPUT, "h-10")}
              required
            />
            {mismatch ? (
              <span className="block text-[12px] text-red-700">
                Those two passwords do not match.
              </span>
            ) : null}
          </label>
        </div>

        {state.status === "error" && state.message ? (
          <p role="alert" className="text-[12px] text-red-700">
            {state.message}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending || !valid}
            className={cn(BUTTON_PRIMARY, "h-10")}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Change password
          </button>

          {state.status === "success" && state.message ? (
            <span className="flex items-center gap-1.5 text-[12px] text-[#0b5f2c]">
              <Check className="size-3.5" />
              {state.message}
            </span>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}

export function NotificationsPanel({ profile }: { profile: MyProfile }) {
  const [state, action, pending] = useActionState(
    saveMyNotifications,
    IDLE_FORM,
  );

  return (
    <Panel title="Email">
      <form action={action} className="space-y-3">
        <label className="flex items-center gap-3 rounded-xl border border-black/[0.09] bg-white px-3.5 py-3">
          <input
            type="checkbox"
            name="notifyMilestones"
            defaultChecked={profile.notifyMilestones}
            className="size-4 shrink-0 accent-[#16a34a]"
          />
          <span className="text-[13px] text-black/75">
            Milestone and deadline reminders
          </span>
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-black/[0.09] bg-white px-3.5 py-3">
          <input
            type="checkbox"
            name="notifyWeeklySummary"
            defaultChecked={profile.notifyWeeklySummary}
            className="size-4 shrink-0 accent-[#16a34a]"
          />
          <span className="text-[13px] text-black/75">Weekly summary</span>
        </label>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className={cn(BUTTON_PRIMARY, "h-10")}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save preferences
          </button>

          {state.status === "success" && state.message ? (
            <span className="flex items-center gap-1.5 text-[12px] text-[#0b5f2c]">
              <Check className="size-3.5" />
              {state.message}
            </span>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}

export function SessionsPanel() {
  const [leaving, startLeaving] = useTransition();

  return (
    <Panel title="Sessions">
      <ConfirmAction
        label={
          <span className="inline-flex items-center gap-1.5">
            <LogOut className="size-3.5" />
            Sign out everywhere
          </span>
        }
        confirmLabel="Sign out everywhere"
        question="Sign out of every browser, including this one?"
        pending={leaving}
        className={cn(BUTTON_SECONDARY, "h-10 px-3 text-xs")}
        onConfirm={() => startLeaving(() => signOutEverywhere())}
      />
    </Panel>
  );
}
