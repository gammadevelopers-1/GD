import { Suspense } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarRange,
  Check,
  Info,
  LockKeyhole,
  Pencil,
  Signal,
  X,
} from "lucide-react";
import { PanelSkeleton } from "@/components/admin/skeletons";
import { Progress } from "@/components/ui/progress";
import {
  type ClientAccessActions,
  ClientAccessPanel,
} from "@/components/admin/projects/client-access";
import { getClientAccess } from "@/data/client-access";
import { requireRole } from "@/data/auth";
import {
  type ProjectFinancial,
  type ProjectShell,
  type ProjectWeeks,
  getProjectCore,
  getProjectFinancial,
  getProjectWeeks,
} from "@/data/project-detail";
import { type ProjectTab as Tab, projectTabHref } from "@/lib/projects/tabs";
import {
  TONE_BAR,
  TONE_CHIP,
  TONE_TEXT,
  deadlineSignal,
  deliverySignal,
  formatDate,
  formatMoney,
} from "@/lib/projects/format";
import {
  PROJECT_STATUS_CHIP,
  PROJECT_STATUS_LABEL,
} from "@/lib/projects/status";
import { CARD_STATUS_CHIP, CARD_STATUS_LABEL } from "@/lib/projects/board";
import { cn } from "@/lib/utils";
import {
  regenerateClientPassword,
  revokeClientAccess,
  setClientMilestoneEditing,
} from "../../client-actions";

type OverviewProject = ProjectShell & ProjectWeeks;

function currentWeekCards(week: ProjectWeeks["weeks"][number]) {
  return [...week.workCards, ...week.ideaCards];
}

const NOTICES: Record<string, { tone: "ok" | "warning"; message: string }> = {
  created: { tone: "ok", message: "Project created." },
  restored: {
    tone: "ok",
    message: "Project restored. It is back in the portfolio.",
  },
  "value-not-saved": {
    tone: "warning",
    message:
      "The project was created, but its value was not recorded. Add it from Edit project.",
  },
};

export default async function ProjectOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { projectId: publicId } = await params;
  const { notice: noticeKey } = await searchParams;
  const notice = noticeKey ? NOTICES[noticeKey] : undefined;

  return (
    <div className="space-y-4">
      {notice ? (
        <div
          role="status"
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
            notice.tone === "ok"
              ? "border-[#2fe85c]/30 bg-[#2fe85c]/10 text-[#08743d]"
              : "border-amber-200 bg-amber-50 text-amber-800",
          )}
        >
          <span>{notice.message}</span>
          <Link
            href={`/projects/${publicId}`}
            aria-label="Dismiss"
            className="shrink-0 opacity-60 transition hover:opacity-100"
          >
            <X className="size-4" />
          </Link>
        </div>
      ) : null}

      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewSection publicId={publicId} />
      </Suspense>

      <Suspense fallback={null}>
        <ClientAccessSection publicId={publicId} />
      </Suspense>
    </div>
  );
}

// Three independent reads, so they go out together rather than one after the
// other. getProjectCore is already resolved from the layout's request cache,
// which is why it costs nothing to ask for it again here.
async function OverviewSection({ publicId }: { publicId: string }) {
  const [viewer, project] = await Promise.all([
    requireRole(["owner", "member"]),
    getProjectCore(publicId),
  ]);
  if (!project) return null;

  const isOwner = viewer.role === "owner";
  const [financial, weeks] = await Promise.all([
    getProjectFinancial(project.id, viewer),
    getProjectWeeks(project.id, isOwner, false),
  ]);

  return (
    <Overview
      project={{ ...project, ...weeks }}
      financial={financial}
      isOwner={isOwner}
      tabHref={(tab: Tab) => projectTabHref(project.publicId, tab)}
    />
  );
}

async function ClientAccessSection({ publicId }: { publicId: string }) {
  const [viewer, project] = await Promise.all([
    requireRole(["owner", "member"]),
    getProjectCore(publicId),
  ]);
  if (!project || viewer.role !== "owner") return null;

  const grants = await getClientAccess(project.id, viewer);

  const actions: ClientAccessActions = {
    regenerate: regenerateClientPassword,
    setEditing: setClientMilestoneEditing,
    revoke: revokeClientAccess,
  };

  return (
    <ClientAccessPanel
      publicId={project.publicId}
      grants={grants}
      actions={actions}
    />
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <PanelSkeleton lines={8} />
      <div className="space-y-4">
        <PanelSkeleton lines={5} />
        <PanelSkeleton lines={3} />
      </div>
    </div>
  );
}

function Overview({
  project,
  financial,
  isOwner,
  tabHref,
}: {
  project: OverviewProject;
  financial: ProjectFinancial | null;
  isOwner: boolean;
  tabHref: (tab: Tab) => string;
}) {
  const signal = deliverySignal(project);
  const deadline = deadlineSignal(project.dueOn, project.status);
  const gaps = missingInformation(project, isOwner, tabHref);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-4">
        <Panel title="Delivery signal" icon={Signal}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                TONE_CHIP[signal.tone],
              )}
            >
              {signal.label}
            </span>
            <span className={cn("text-[11px]", TONE_TEXT[deadline.tone])}>
              {deadline.label}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-black/55">
            {describeDelivery(project)}
          </p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-black/45">
              <span>Overall progress</span>
              <span className="font-mono">{project.progress}%</span>
            </div>
            <Progress
              value={project.progress}
              aria-label={`${project.name} progress`}
              className="mt-2 h-2 bg-black/[0.07]"
              indicatorClassName={cn("rounded-full", TONE_BAR[signal.tone])}
            />
          </div>

          {project.currentWeek ? (
            <div className="mt-5 rounded-xl border border-black/[0.06] bg-black/[0.015] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarRange className="size-4 text-black/35" />
                  <h3 className="text-sm font-semibold">
                    Week {project.currentWeek.number}
                  </h3>
                  {project.currentWeek.isCurrent &&
                  isThisWeek(
                    project.currentWeek.dueOn,
                    project.currentWeek.startsOn,
                  ) ? (
                    <span className="rounded-full bg-[#2fe85c]/15 px-2 py-0.5 text-[9px] font-semibold text-[#08743d]">
                      Current week
                    </span>
                  ) : null}
                </div>
                <span className="font-mono text-[10px] text-black/40">
                  {project.currentWeek.done}/{project.currentWeek.total} done ·
                  due {formatDate(project.currentWeek.dueOn)}
                </span>
              </div>

              {currentWeekCards(project.currentWeek).length ? (
                <ul className="mt-3 space-y-1.5">
                  {currentWeekCards(project.currentWeek)
                    .slice(0, 4)
                    .map((card) => (
                      <li
                        key={card.id}
                        className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 text-[13px] transition-colors duration-150 hover:bg-black/[0.03]"
                      >
                        <span
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded border",
                            card.status === "completed"
                              ? "border-[#16a34a] bg-[#16a34a] text-white"
                              : "border-black/15 bg-white text-transparent",
                          )}
                        >
                          <Check className="size-2.5" />
                        </span>
                        <span
                          className={cn(
                            "min-w-0 truncate",
                            card.status === "completed"
                              ? "text-black/35 line-through"
                              : "text-black/70",
                          )}
                        >
                          {card.title}
                        </span>
                        {card.status !== "completed" ? (
                          <span
                            className={cn(
                              "ml-auto shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                              CARD_STATUS_CHIP[card.status],
                            )}
                          >
                            {CARD_STATUS_LABEL[card.status]}
                          </span>
                        ) : null}
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="mt-3 text-[13px] text-black/40">
                  This week has no items yet.
                </p>
              )}

              <Link
                href={tabHref("milestone")}
                prefetch
                className="mt-3 inline-flex rounded text-[11px] font-semibold text-[#08743d] transition hover:underline focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none"
              >
                Open Milestone →
              </Link>
            </div>
          ) : null}
        </Panel>

        {gaps.length ? (
          <Panel title="Worth completing" icon={Info}>
            <ul className="space-y-2.5">
              {gaps.map((gap) => (
                <li
                  key={gap.label}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/[0.06] bg-white/50 px-3.5 py-2.5 transition duration-150 hover:border-black/[0.13] hover:bg-white"
                >
                  <span className="text-[13px] text-black/60">{gap.label}</span>
                  {gap.href ? (
                    <Link
                      href={gap.href}
                      className="text-[11px] font-semibold text-[#08743d] hover:underline"
                    >
                      {gap.action} →
                    </Link>
                  ) : (
                    <span className="text-[11px] text-black/35">
                      {gap.action}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>

      <div className="space-y-4">
        <Panel title="Project information" icon={CalendarDays}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Detail label="Client" value={project.clientName ?? "Not set"} />
            <Detail
              label="Status"
              value={PROJECT_STATUS_LABEL[project.status]}
              chip={PROJECT_STATUS_CHIP[project.status]}
            />
            <Detail label="Start date" value={formatDate(project.startsOn)} />
            <Detail label="Due date" value={formatDate(project.dueOn)} />
            <Detail
              label="Project lead"
              value={project.leadName ?? "Unassigned"}
            />
            <Detail
              label="Team size"
              value={`${project.memberCount} ${project.memberCount === 1 ? "person" : "people"}`}
            />
          </div>
        </Panel>

        {isOwner ? (
          <ValuePanel financial={financial} publicId={project.publicId} />
        ) : null}
      </div>
    </div>
  );
}

function ValuePanel({
  financial,
  publicId,
}: {
  financial: ProjectFinancial | null;
  publicId: string;
}) {
  return (
    <section className="panel-dark relative overflow-hidden rounded-[18px] border border-black/[0.07] p-5 text-white">
      <div className="pointer-events-none absolute -top-20 -right-10 size-52 rounded-full bg-[#2fe85c]/10 blur-3xl" />
      <div className="relative flex items-center gap-2">
        <LockKeyhole className="size-3.5 text-[#69ee88]" />
        <p className="text-[11px] font-medium text-[#69ee88]">
          Owner only · project value
        </p>
      </div>

      {financial ? (
        <>
          <p className="mt-4 text-2xl font-semibold tracking-[-0.045em]">
            {formatMoney(financial.amount, financial.currency)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MoneyCell
              label="In PKR"
              value={formatMoney(financial.amountPkr, "PKR")}
            />
            <MoneyCell
              label="In USD"
              value={formatMoney(financial.amountUsd, "USD")}
            />
          </div>
          <p className="mt-3 text-[11px] leading-4 text-white/35">
            Booked {formatDate(financial.bookedOn)} at{" "}
            {financial.rate.toLocaleString("en-US")} PKR per USD. Stored as
            agreed and converted only for display.
          </p>
        </>
      ) : (
        <>
          <p className="mt-4 text-sm text-white/45">
            No value recorded for this project yet.
          </p>
          <Link
            href={`/projects/${publicId}/edit`}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/[0.08] px-3.5 text-xs font-semibold text-white transition duration-200 hover:bg-white/[0.16] focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none active:scale-[0.97]"
          >
            <Pencil className="size-3.5" />
            Record the value
          </Link>
        </>
      )}
    </section>
  );
}

function MoneyCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 transition-colors duration-200 hover:border-white/[0.14] hover:bg-white/[0.06]">
      <p className="text-[10px] text-white/28">{label}</p>
      <p className="mt-1.5 truncate text-[13px] font-semibold">{value}</p>
    </div>
  );
}

function describeDelivery(project: OverviewProject) {
  if (!project.weeks.length) {
    return "No milestone weeks are planned yet, so there is nothing to measure progress against.";
  }
  if (project.overdueItems > 0) {
    return `${project.overdueItems} item${project.overdueItems === 1 ? "" : "s"} from earlier weeks ${project.overdueItems === 1 ? "is" : "are"} still open. That is what makes this project look behind — not the due date.`;
  }
  if (project.doneItems === project.totalItems) {
    return "Every planned milestone item is done. Plan the next week to keep the signal meaningful.";
  }
  return "Nothing is overdue from previous weeks. Current work is on schedule.";
}

function isThisWeek(dueOn: string, startsOn: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  return (startsOn ?? dueOn) <= today && dueOn >= today;
}

function missingInformation(
  project: OverviewProject,
  isOwner: boolean,
  tabHref: (tab: Tab) => string,
) {
  const gaps: Array<{ label: string; action: string; href?: string }> = [];
  const editHref = `/projects/${project.publicId}/edit`;

  if (!project.description) {
    gaps.push({
      label: "No description — a new joiner cannot tell what this project is.",
      action: isOwner ? "Add one" : "Ask an owner",
      href: isOwner ? editHref : undefined,
    });
  }
  if (!project.clientId) {
    gaps.push({
      label: "No client attached — invoices and reporting will need one.",
      action: isOwner ? "Attach a client" : "Ask an owner",
      href: isOwner ? editHref : undefined,
    });
  }
  if (!project.startsOn || !project.dueOn) {
    gaps.push({
      label: "Dates are incomplete, so deadlines cannot be trusted.",
      action: isOwner ? "Set dates" : "Ask an owner",
      href: isOwner ? editHref : undefined,
    });
  }
  if (!project.leadId) {
    gaps.push({
      label: "No project lead — nobody owns this delivery.",
      action: isOwner ? "Assign a lead" : "Ask an owner",
      href: isOwner ? editHref : undefined,
    });
  }
  if (project.memberCount === 0) {
    gaps.push({
      label: "Nobody is assigned, so no team member can open this project.",
      action: "Open Team",
      href: tabHref("team"),
    });
  }
  if (!project.weeks.length) {
    gaps.push({
      label: "No milestone weeks planned, so there is no progress to report.",
      action: "Open Milestone",
      href: tabHref("milestone"),
    });
  }

  return gaps;
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof CalendarDays;
  children: React.ReactNode;
}) {
  return (
    <section className="card-surface rounded-2xl border border-black/[0.06] p-5 hover:border-black/[0.12]">
      <div className="mb-5 flex items-center gap-2.5">
        <Icon className="size-4 text-black/35" />
        <h2 className="text-[14px] font-semibold tracking-[-0.025em]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Detail({
  label,
  value,
  chip,
}: {
  label: string;
  value: string;
  chip?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-black/38">{label}</p>
      {chip ? (
        <span
          className={cn(
            "mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold",
            chip,
          )}
        >
          {value}
        </span>
      ) : (
        <p className="mt-2 text-sm font-medium text-black/65">{value}</p>
      )}
    </div>
  );
}
