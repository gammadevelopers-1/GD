"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  Bell,
  Check,
  Loader2,
  LogOut,
  Monitor,
  ShieldCheck,
  Smartphone,
  Tablet,
  UserRound,
} from "lucide-react";
import {
  changeMyPassword,
  revokeSession,
  saveMyNotifications,
  signOutEverywhere,
} from "@/app/(admin)/settings/actions";
import { ConfirmAction } from "@/components/admin/projects/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MyProfile } from "@/data/profile";
import type { MySession } from "@/data/sessions";
import { describeDevice } from "@/lib/sessions/user-agent";
import { IDLE_FORM } from "@/lib/projects/form-state";
import { PASSWORD_MIN, ROLE_LABELS } from "@/lib/team/records";
import { formatDate, timeAgo } from "@/lib/projects/format";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  INPUT,
  TONE_SOFT,
} from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const SECTIONS = [
  { value: "account", label: "Account", icon: UserRound },
  { value: "security", label: "Security", icon: ShieldCheck },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "sessions", label: "Sessions", icon: Monitor },
] as const;

const STRENGTH = [
  { label: "—", bar: "bg-black/15", ink: "text-black/40" },
  { label: "Weak", bar: "bg-red-500", ink: "text-red-600" },
  { label: "Fair", bar: "bg-amber-500", ink: "text-amber-600" },
  { label: "Good", bar: "bg-lime-500", ink: "text-lime-700" },
  { label: "Strong", bar: "bg-gd-green", ink: "text-gd-green-ink" },
];

function scorePassword(value: string) {
  let score = 0;
  if (value.length >= PASSWORD_MIN) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
}

function Panel({
  title,
  children,
  tone = "default",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <Card
      className={cn(
        "py-0 shadow-none",
        tone === "danger"
          ? "border-red-700/20 bg-red-600/[0.03]"
          : "bg-gd-panel border-black/[0.07]",
      )}
    >
      <CardContent className="p-5">
        <h2
          className={cn(
            "mb-4 font-mono text-[9px] tracking-[0.16em] uppercase",
            tone === "danger" ? "text-red-700" : "text-black/35",
          )}
        >
          {title}
        </h2>
        {children}
      </CardContent>
    </Card>
  );
}

export function SettingsWorkspace({
  profile,
  sessions,
}: {
  profile: MyProfile;
  sessions: MySession[];
}) {
  return (
    <Tabs orientation="vertical" defaultValue="account" className="gap-6">
      <div className="shrink-0 sm:w-52">
        <span className="mb-1.5 block px-3 font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
          Settings
        </span>
        <TabsList
          variant="line"
          className="h-fit w-full flex-col items-stretch gap-1 bg-transparent p-0"
        >
          {SECTIONS.map((section) => (
            <TabsTrigger
              key={section.value}
              value={section.value}
              className="data-[state=active]:bg-brand/10 data-[state=active]:text-gd-green-deep h-auto w-full justify-start gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-black/55 transition-colors duration-150 after:hidden hover:bg-black/[0.04] hover:text-black data-[state=active]:font-semibold"
            >
              <section.icon className="size-3.75" />
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="min-w-0 flex-1">
        <TabsContent value="account" className="max-w-[680px]">
          <AccountPanel profile={profile} />
        </TabsContent>
        <TabsContent value="security" className="max-w-[680px]">
          <PasswordPanel />
        </TabsContent>
        <TabsContent value="notifications" className="max-w-[680px]">
          <NotificationsPanel profile={profile} />
        </TabsContent>
        <TabsContent value="sessions" className="max-w-[680px]">
          <SessionsPanel sessions={sessions} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function AccountPanel({ profile }: { profile: MyProfile }) {
  return (
    <Panel title="Account">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="account-email"
            className="text-[12px] font-normal text-black/55"
          >
            Email
          </Label>
          <Input
            variant="admin"
            id="account-email"
            value={profile.email ?? "Not recorded"}
            readOnly
            className={cn(
              "h-10 cursor-default bg-black/[0.03] text-black/55 hover:border-black/[0.09]",
            )}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="account-full-name"
            className="text-[12px] font-normal text-black/55"
          >
            Official name
          </Label>
          <Input
            variant="admin"
            id="account-full-name"
            value={profile.fullName}
            readOnly
            className={cn(
              "h-10 cursor-default bg-black/[0.03] text-black/55 hover:border-black/[0.09]",
            )}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-black/[0.06] pt-4">
        <Badge
          variant="outline"
          className={cn("rounded-full font-semibold", TONE_SOFT.muted)}
        >
          {ROLE_LABELS[profile.role]}
        </Badge>
        <span className="font-mono text-[10.5px] tracking-[0.14em] text-black/40 uppercase">
          Joined {formatDate(profile.createdAt.slice(0, 10))}
        </span>
        <Button
          asChild
          variant="outline"
          className={cn(BUTTON_SECONDARY, "ml-auto h-9 px-3 text-xs")}
        >
          <Link href="/profile">Edit profile</Link>
        </Button>
      </div>
    </Panel>
  );
}

function PasswordPanel() {
  const [state, action, pending] = useActionState(changeMyPassword, IDLE_FORM);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const missing = PASSWORD_MIN - password.length;
  const tooShort = password.length > 0 && missing > 0;
  const mismatch = confirmation.length > 0 && confirmation !== password;
  const valid = password.length >= PASSWORD_MIN && confirmation === password;
  const score = password ? scorePassword(password) : 0;
  const strength = STRENGTH[score];

  return (
    <Panel title="Password">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="new-password"
              className="text-[12px] font-normal text-black/55"
            >
              New password
            </Label>
            <PasswordInput
              id="new-password"
              name="password"
              autoComplete="new-password"
              placeholder={`At least ${PASSWORD_MIN} characters`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={cn(INPUT, "h-10")}
              required
            />
            {tooShort ? (
              <span className="block text-[12px] text-red-700">
                {missing} more character{missing === 1 ? "" : "s"} needed.
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirm-password"
              className="text-[12px] font-normal text-black/55"
            >
              Confirm password
            </Label>
            <PasswordInput
              id="confirm-password"
              name="confirmation"
              autoComplete="new-password"
              placeholder="Repeat password"
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
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="h-1.25 flex-1 overflow-hidden rounded-sm bg-black/[0.08]">
            <span
              className={cn(
                "block h-full rounded-sm transition-[width,background-color] duration-250",
                strength.bar,
              )}
              style={{ width: `${(score / 4) * 100}%` }}
            />
          </div>
          <span
            className={cn(
              "w-13 text-right font-mono text-[10px] transition-colors duration-250",
              strength.ink,
            )}
          >
            {strength.label}
          </span>
        </div>

        {state.status === "error" && state.message ? (
          <p role="alert" className="text-[12px] text-red-700">
            {state.message}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={pending || !valid}
            className={cn(BUTTON_PRIMARY, "h-10")}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Change password
          </Button>

          {state.status === "success" && state.message ? (
            <span className="text-gd-green-ink flex items-center gap-1.5 text-[12px]">
              <Check className="size-3.5" />
              {state.message}
            </span>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}

function NotificationsPanel({ profile }: { profile: MyProfile }) {
  const [state, action, pending] = useActionState(
    saveMyNotifications,
    IDLE_FORM,
  );

  const rows = [
    {
      name: "notifyMilestones",
      title: "Milestone & deadline reminders",
      body: "When a project milestone is near or due.",
      checked: profile.notifyMilestones,
    },
    {
      name: "notifyWeeklySummary",
      title: "Weekly summary",
      body: "A Monday digest of what moved last week.",
      checked: profile.notifyWeeklySummary,
    },
  ];

  return (
    <Panel title="Email notifications">
      <form action={action} className="space-y-3">
        {rows.map((row) => (
          <Label
            key={row.name}
            className="flex items-center gap-4 rounded-[13px] border border-black/[0.08] bg-white px-4 py-3 transition-colors duration-150 hover:border-black/20"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold text-black/85">
                {row.title}
              </span>
              <span className="mt-0.5 block text-[12px] font-normal text-black/50">
                {row.body}
              </span>
            </span>
            <Switch
              name={row.name}
              defaultChecked={row.checked}
              className="shrink-0"
            />
          </Label>
        ))}

        {state.status === "error" && state.message ? (
          <p role="alert" className="text-[12px] text-red-700">
            {state.message}
          </p>
        ) : null}

        <div className="flex items-center gap-3 pt-1">
          <Button
            type="submit"
            disabled={pending}
            className={cn(BUTTON_PRIMARY, "h-10")}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save preferences
          </Button>

          {state.status === "success" && state.message ? (
            <span className="text-gd-green-ink flex items-center gap-1.5 text-[12px]">
              <Check className="size-3.5" />
              {state.message}
            </span>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}

function DeviceIcon({ kind }: { kind: MySession["device"]["kind"] }) {
  if (kind === "mobile") return <Smartphone className="size-4" />;
  if (kind === "tablet") return <Tablet className="size-4" />;
  return <Monitor className="size-4" />;
}

function since(value: string) {
  const span = timeAgo(value);
  return span === "now" ? "just now" : `${span} ago`;
}

function SessionRow({ session }: { session: MySession }) {
  const [ending, startEnding] = useTransition();

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 transition-colors duration-150",
        session.current
          ? "border-brand/45 bg-brand/[0.04]"
          : "border-black/[0.07] hover:border-black/[0.14]",
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg",
          session.current
            ? "bg-brand/12 text-gd-green-deep"
            : "bg-black/[0.05] text-black/45",
        )}
      >
        <DeviceIcon kind={session.device.kind} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-black/85">
          {describeDevice(session.device)}
          {session.current ? (
            <Badge
              variant="outline"
              className={cn("rounded-full font-semibold", TONE_SOFT.ok)}
            >
              This device
            </Badge>
          ) : null}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-black/42 tabular-nums">
          {session.ip ?? "Address not recorded"} · signed in{" "}
          {since(session.createdAt)}
          {session.current ? null : ` · active ${since(session.lastSeenAt)}`}
        </p>
      </div>

      {session.current ? null : (
        <form
          action={(formData) => startEnding(() => revokeSession(formData))}
          className="shrink-0"
        >
          <input type="hidden" name="sessionId" value={session.id} />
          <Button
            type="submit"
            variant="outline"
            disabled={ending}
            className={cn(
              BUTTON_SECONDARY,
              "h-8.5 px-3 text-xs hover:border-red-700/40 hover:text-red-700",
            )}
          >
            {ending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            End
          </Button>
        </form>
      )}
    </li>
  );
}

function SessionsPanel({ sessions }: { sessions: MySession[] }) {
  const [leaving, startLeaving] = useTransition();

  return (
    <Panel title={`Active sessions · ${sessions.length}`}>
      {sessions.length ? (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-black/40">
          No sessions on record for this account.
        </p>
      )}

      <p className="mt-3 text-[11.5px] text-black/40">
        Last-active time follows token refresh, roughly hourly, so it reads as
        &ldquo;around then&rdquo; rather than to the minute.
      </p>

      <div className="mt-3.5 border-t border-black/[0.06] pt-3.5">
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
          className={cn(
            BUTTON_SECONDARY,
            "h-9.5 px-3.5 text-xs hover:border-red-700/40 hover:text-red-700",
          )}
          onConfirm={() => startLeaving(() => signOutEverywhere())}
        />
      </div>
    </Panel>
  );
}
