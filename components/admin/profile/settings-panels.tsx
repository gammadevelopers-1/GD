"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  Bell,
  BellOff,
  Check,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Loader2,
  LogOut,
  Monitor,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Tablet,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  changeMyPassword,
  endEveryUserSession,
  endUserSession,
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
import type { MySession, PersonSessions } from "@/data/sessions";
import { describeDevice } from "@/lib/sessions/user-agent";
import { IDLE_FORM, type SimpleFormState } from "@/lib/projects/form-state";
import { PASSWORD_MIN, ROLE_LABELS } from "@/lib/team/records";
import { formatDate, timeAgo } from "@/lib/projects/format";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  FOCUS_RING,
  INPUT,
  TONE_SOFT,
} from "@/lib/admin-ui";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "@/components/ui/sonner";
import {
  askForPush,
  type PushPermission,
  showPush,
  usePushPermission,
} from "@/lib/hooks/use-desktop-notifications";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const SECTIONS = [
  { value: "account", label: "Account", icon: UserRound },
  { value: "security", label: "Security", icon: ShieldCheck },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "sessions", label: "My sessions", icon: Monitor },
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
  people,
}: {
  profile: MyProfile;
  sessions: MySession[];
  people: PersonSessions[] | null;
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

          {people ? (
            <span className="mt-2.5 block border-t border-black/[0.08] pt-2.5">
              <TabsTrigger
                value="people"
                className="data-[state=active]:bg-brand/10 data-[state=active]:text-gd-green-deep h-auto w-full justify-start gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-black/55 transition-colors duration-150 after:hidden hover:bg-black/[0.04] hover:text-black data-[state=active]:font-semibold"
              >
                <UsersRound className="size-3.75" />
                User sessions
                <span className="ml-auto rounded-full bg-black/[0.07] px-1.5 py-px font-mono text-[9px] text-black/55 tabular-nums">
                  {people.length}
                </span>
              </TabsTrigger>
            </span>
          ) : null}
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
        {people ? (
          <TabsContent value="people">
            <UserSessionsPanel people={people} />
          </TabsContent>
        ) : null}
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
    <div className="space-y-4">
      <BrowserPushPanel />

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
    </div>
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

const PUSH_LABEL: Record<PushPermission, string> = {
  granted: "On",
  denied: "Blocked",
  default: "Off",
  unsupported: "Not supported",
};

const PUSH_TONE: Record<PushPermission, string> = {
  granted: TONE_SOFT.ok,
  denied: TONE_SOFT.danger,
  default: TONE_SOFT.warning,
  unsupported: TONE_SOFT.muted,
};

const PUSH_COPY: Record<PushPermission, string> = {
  granted:
    "Important events reach this device even when the tab is in the background — a task assigned to you, a milestone due, a device signed out.",
  denied:
    "This browser is blocking notifications for the site. Turn them back on in its site settings, then reload.",
  default:
    "Get a pop-up on this device for important events — a task assigned to you, a milestone due, a device signed out — even when the tab is behind something else.",
  unsupported: "This browser cannot show desktop notifications.",
};

function BrowserPushPanel() {
  const permission = usePushPermission();
  const [asking, startAsking] = useTransition();

  return (
    <Panel title="Browser notifications">
      <div
        className={cn(
          "flex items-start gap-3.5 rounded-[14px] border p-4",
          permission === "granted"
            ? "border-gd-green-edge/35 bg-brand/[0.06]"
            : permission === "denied"
              ? "border-red-700/20 bg-red-600/[0.03]"
              : "border-black/10 bg-white",
        )}
      >
        <span
          className={cn(
            "grid size-10.5 shrink-0 place-items-center rounded-xl",
            permission === "denied"
              ? "bg-red-700 text-white"
              : "bg-gd-panel-dark text-brand",
          )}
        >
          {permission === "denied" ? (
            <BellOff className="size-5" />
          ) : (
            <Bell className="size-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-black/85">
            Desktop pop-ups
            <Badge
              variant="outline"
              className={cn(
                "rounded-full font-semibold",
                PUSH_TONE[permission],
              )}
            >
              {PUSH_LABEL[permission]}
            </Badge>
          </p>

          <p className="mt-1 mb-3 max-w-[52ch] text-[12.5px] leading-[1.5] text-black/55">
            {PUSH_COPY[permission]}
          </p>

          {permission === "granted" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const sent = showPush(
                  "Test notification",
                  "This is how an important event will reach you.",
                );
                if (!sent) {
                  toast.error("The browser would not show it.");
                }
              }}
              className={cn(BUTTON_SECONDARY, "h-9 px-3.5 text-xs")}
            >
              <Send className="size-3.5" />
              Send a test
            </Button>
          ) : permission === "default" ? (
            <Button
              type="button"
              disabled={asking}
              onClick={() =>
                startAsking(async () => {
                  const result = await askForPush();
                  if (result === "granted") {
                    showPush(
                      "Notifications on",
                      "Important events will reach you here.",
                    );
                    toast.success("Browser notifications enabled.");
                  } else if (result === "denied") {
                    toast.error("This browser blocked notifications.");
                  }
                })
              }
              className={cn(BUTTON_PRIMARY, "h-9.5 px-3.5 text-xs")}
            >
              {asking ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Bell className="size-3.5" />
              )}
              Enable browser notifications
            </Button>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

function useActionToast(state: SimpleFormState) {
  useEffect(() => {
    if (!state.message) return;
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state]);
}

function PersonSessionRow({
  session,
  person,
}: {
  session: MySession;
  person: PersonSessions;
}) {
  const [state, end, ending] = useActionState(endUserSession, IDLE_FORM);
  useActionToast(state);

  const device = describeDevice(session.device);

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
          {device}
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
          {since(session.createdAt)} · active {since(session.lastSeenAt)}
        </p>
      </div>

      {session.current ? null : (
        <ConfirmAction
          label={
            <span className="inline-flex items-center gap-1.5">
              <LogOut className="size-3.5" />
              Sign out
            </span>
          }
          confirmLabel="Sign out device"
          question={`${person.name}'s ${device} stops working once its current access token expires, within the hour.`}
          pending={ending}
          className={cn(
            BUTTON_SECONDARY,
            "h-9 shrink-0 px-3 text-xs hover:border-red-700/40 hover:text-red-700",
          )}
          onConfirm={() => {
            const data = new FormData();
            data.set("sessionId", session.id);
            end(data);
          }}
        />
      )}
    </li>
  );
}

function PersonCard({
  person,
  open,
  onOpenChange,
}: {
  person: PersonSessions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, endAll, ending] = useActionState(
    endEveryUserSession,
    IDLE_FORM,
  );
  useActionToast(state);

  const count = person.sessions.length;
  const newest = person.sessions[0];

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white"
    >
      <div
        className={cn(
          "flex items-center gap-3 bg-[#faf9f4] px-3.5 py-3",
          open && "border-b border-black/[0.06]",
        )}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="bare"
            size="none"
            type="button"
            aria-label={`${open ? "Collapse" : "Expand"} ${person.name}`}
            className={cn(
              "grid size-6 shrink-0 place-items-center rounded-md text-black/45 transition duration-150 hover:bg-black/[0.06] hover:text-black",
              FOCUS_RING,
            )}
          >
            <ChevronRight
              className={cn(
                "size-4 transition-transform duration-200 motion-reduce:transition-none",
                open && "rotate-90",
              )}
            />
          </Button>
        </CollapsibleTrigger>

        <span className="bg-gd-panel-dark text-brand grid size-9.5 shrink-0 place-items-center rounded-xl font-mono text-[12px] font-semibold">
          {person.initials}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold tracking-[-0.01em] text-black/85">
            {person.name}
            <span
              className={cn(
                "rounded-full border px-1.5 py-px font-mono text-[8.5px] tracking-[0.1em] uppercase",
                person.role === "owner" ? TONE_SOFT.ok : TONE_SOFT.muted,
              )}
            >
              {ROLE_LABELS[person.role]}
            </span>
            {person.isYou ? (
              <span
                className={cn(
                  "rounded-full border px-1.5 py-px font-mono text-[8.5px] tracking-[0.1em] uppercase",
                  TONE_SOFT.info,
                )}
              >
                You
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] text-black/50">
            {person.email} ·{" "}
            <b className="font-semibold text-black/70">
              {count} active device{count === 1 ? "" : "s"}
            </b>
            {newest ? ` · active ${since(newest.lastSeenAt)}` : null}
          </p>
        </div>

        {count ? (
          <ConfirmAction
            label={
              <span className="inline-flex items-center gap-1.5">
                <LogOut className="size-3.5" />
                Sign out all
              </span>
            }
            confirmLabel="Sign out all"
            question={`Every device ${person.name} is signed in on stops working within the hour.${person.isYou ? " The browser you are in now is left alone — end it from My sessions." : ""}`}
            pending={ending}
            className={cn(
              BUTTON_SECONDARY,
              "h-9 shrink-0 px-3 text-xs hover:border-red-700/40 hover:text-red-700",
            )}
            onConfirm={() => {
              const data = new FormData();
              data.set("profileId", person.profileId);
              endAll(data);
            }}
          />
        ) : (
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              TONE_SOFT.muted,
            )}
          >
            Nothing signed in
          </span>
        )}
      </div>

      <CollapsibleContent>
        {count ? (
          <ul className="space-y-2 p-3.5">
            {person.sessions.map((session) => (
              <PersonSessionRow
                key={session.id}
                session={session}
                person={person}
              />
            ))}
          </ul>
        ) : (
          <p className="px-3.5 py-3.5 text-[12px] text-black/40">
            No device is signed in to this account.
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function UserSessionsPanel({ people }: { people: PersonSessions[] }) {
  const [query, setQuery] = useState("");
  const [shut, setShut] = useState<Record<string, boolean>>({});

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return people;
    return people.filter((person) =>
      `${person.name} ${person.email} ${ROLE_LABELS[person.role]}`
        .toLowerCase()
        .includes(needle),
    );
  }, [people, query]);

  const allShut =
    shown.length > 0 && shown.every((person) => shut[person.profileId]);
  const live = people.reduce(
    (total, person) => total + person.sessions.length,
    0,
  );

  return (
    <Panel title={`Signed in · ${live} device${live === 1 ? "" : "s"}`}>
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-45 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.75 -translate-y-1/2 text-black/40" />
          <Input
            variant="admin"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people…"
            aria-label="Search people"
            className="h-9.5 pl-9"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const next: Record<string, boolean> = {};
            for (const person of shown) next[person.profileId] = !allShut;
            setShut(next);
          }}
          className={cn(BUTTON_SECONDARY, "h-9.5 px-3.5 text-xs")}
        >
          {allShut ? (
            <ChevronsUpDown className="size-3.5" />
          ) : (
            <ChevronsDownUp className="size-3.5" />
          )}
          {allShut ? "Expand all" : "Collapse all"}
        </Button>
      </div>

      {shown.length ? (
        <div className="space-y-2.5">
          {shown.map((person) => (
            <PersonCard
              key={person.profileId}
              person={person}
              open={!shut[person.profileId]}
              onOpenChange={(next) =>
                setShut((current) => ({
                  ...current,
                  [person.profileId]: !next,
                }))
              }
            />
          ))}
        </div>
      ) : (
        <p className="py-2 text-[12px] text-black/40">
          Nobody matches “{query}”.
        </p>
      )}
    </Panel>
  );
}
