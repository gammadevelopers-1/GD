import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Archive,
  ArrowLeft,
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
import { ProjectTabs } from "@/components/admin/projects/project-tabs";
import {
  type ProjectTab as Tab,
  isProjectTab,
  projectTabHref,
} from "@/lib/projects/tabs";
import {
  type BoardActions,
  BoardsPanel,
} from "@/components/admin/projects/boards-panel";
import { getBoardContext } from "@/data/board-context";
import { StatusControl } from "@/components/admin/projects/status-control";
import { TeamPanel } from "@/components/admin/projects/team-panel";
import {
  type TechnicalDetails,
  TechnicalPanel,
} from "@/components/admin/projects/technical-panel";
import { CredentialsPanel } from "@/components/admin/projects/credentials-panel";
import {
  type EnvActions,
  EnvPanel,
} from "@/components/admin/projects/env-panel";
import { getEnvFiles, getEnvGroups } from "@/data/env";
import { getCredentialAudit, getProjectCredentials } from "@/data/credentials";
import { credentialsConfigured } from "@/lib/credentials/crypto";
import { requireRole } from "@/data/auth";
import type { Viewer } from "@/data/auth";
import {
  type ProjectDetail,
  type ProjectFinancial,
  getActivePeople,
  getProjectDetail,
  getProjectFinancial,
} from "@/data/project-detail";
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
import { setProjectStatus } from "../actions";
import { addMilestoneWeek, setMilestoneWeekArchived } from "../milestone-actions";
import {
  carryCard,
  createCard,
  draftCard,
  moveCard,
  organiseWeek,
  saveCard,
  setCardArchived,
  uploadAttachment,
} from "../board-actions";
import {
  addProjectMember,
  removeProjectMember,
  restoreProjectMember,
  setProjectLead,
  updateMemberResponsibility,
} from "../team-actions";
import { saveTechnicalDetails } from "../technical-actions";
import {
  archiveEnvFile,
  createEnvGroup,
  downloadEnvFile,
  grantEnvGroupAccess,
  renameEnvGroup,
  saveEnvVariables,
  setEnvGroupArchived,
  uploadEnvFile,
} from "../env-actions";
import {
  copyCredentialSecret,
  createCredential,
  grantCredentialAccess,
  replaceCredentialSecret,
  revokeCredentialAccess,
  setCredentialArchived,
  updateCredentialMetadata,
} from "../credential-actions";

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

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string; notice?: string }>;
}) {
  const viewer = await requireRole(["owner", "member"]);
  // The URL carries the public id; everything below the lookup works on the
  // internal uuid, which forms and actions expect.
  const { projectId: publicId } = await params;
  const query = await searchParams;
  const activeTab: Tab = isProjectTab(query.tab) ? query.tab : "overview";

  const project = await getProjectDetail(publicId, viewer);
  if (!project) notFound();

  const isOwner = viewer.role === "owner";
  const onThisProject =
    isOwner || project.members.some((member) => member.id === viewer.id);

  const notice = query.notice ? NOTICES[query.notice] : undefined;
  const tabHref = (tab: Tab) => projectTabHref(project.publicId, tab);

  return (
    <div className="mx-auto max-w-[1480px]">
      <Link
        href="/projects"
        className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-black/42 transition hover:text-black"
      >
        <ArrowLeft className="size-3.5" /> All projects
      </Link>

      {notice ? (
        <div
          role="status"
          className={cn(
            "mb-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
            notice.tone === "ok"
              ? "border-[#2fe85c]/30 bg-[#2fe85c]/10 text-[#08743d]"
              : "border-amber-200 bg-amber-50 text-amber-800",
          )}
        >
          <span>{notice.message}</span>
          <Link
            href={`/projects/${project.publicId}`}
            aria-label="Dismiss"
            className="shrink-0 opacity-60 transition hover:opacity-100"
          >
            <X className="size-4" />
          </Link>
        </div>
      ) : null}

      <ProjectHeader
        project={project}
        viewer={viewer}
        activeTab={activeTab}
      />

      <div className="mt-4">
        {activeTab === "overview" ? (
          isOwner ? (
            <Suspense fallback={<OverviewSkeleton />}>
              <OverviewSection
                project={project}
                viewer={viewer}
                tabHref={tabHref}
              />
            </Suspense>
          ) : (
            <Overview
              project={project}
              financial={null}
              isOwner={false}
              tabHref={tabHref}
            />
          )
        ) : null}
        {activeTab === "team" ? (
          isOwner ? (
            <Suspense fallback={<TeamSkeleton />}>
              <TeamSection project={project} isOwner />
            </Suspense>
          ) : (
            <TeamSection project={project} isOwner={false} />
          )
        ) : null}
        {activeTab === "milestones" ? (
          <Suspense fallback={<BoardsSkeleton />}>
            <BoardsSection
              projectId={project.id}
              viewer={viewer}
              weeks={project.weeks}
              isOwner={isOwner}
            />
          </Suspense>
        ) : null}
        {activeTab === "technical" ? (
          <Suspense fallback={<TechnicalSkeleton />}>
            <TechnicalSections
              projectId={project.id}
              viewer={viewer}
              details={technicalDetails(project)}
              members={project.members.map((member) => ({
                id: member.id,
                name: member.name,
              }))}
              isOwner={isOwner}
              canEditDetails={onThisProject}
              projectArchived={project.isArchived}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}

// Only owners get the extra fetches on these tabs — the value panel and the
// add-member picker. Streaming them behind the tab keeps the header and the
// rest of the content off that wait; members render with no fetch at all.
async function OverviewSection({
  project,
  viewer,
  tabHref,
}: {
  project: ProjectDetail;
  viewer: Viewer;
  tabHref: (tab: Tab) => string;
}) {
  const financial = await getProjectFinancial(project.id, viewer);
  return (
    <Overview
      project={project}
      financial={financial}
      isOwner
      tabHref={tabHref}
    />
  );
}

async function TeamSection({
  project,
  isOwner,
}: {
  project: ProjectDetail;
  isOwner: boolean;
}) {
  const people = isOwner ? await getActivePeople() : [];
  return (
    <TeamPanel
      projectId={project.id}
      members={project.members}
      formerMembers={project.formerMembers}
      people={people}
      isOwner={isOwner}
      addMember={addProjectMember}
      updateResponsibility={updateMemberResponsibility}
      removeMember={removeProjectMember}
      restoreMember={restoreProjectMember}
      setLead={setProjectLead}
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

function TeamSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <PanelSkeleton lines={5} />
      <PanelSkeleton lines={4} />
    </div>
  );
}

function BoardsSkeleton() {
  return (
    <div className="space-y-4">
      <PanelSkeleton lines={6} />
      <PanelSkeleton lines={4} />
    </div>
  );
}

function TechnicalSkeleton() {
  return (
    <div className="space-y-6">
      <PanelSkeleton lines={5} />
      <PanelSkeleton lines={5} />
    </div>
  );
}

async function BoardsSection({
  projectId,
  viewer,
  weeks,
  isOwner,
}: {
  projectId: string;
  viewer: Viewer;
  weeks: ProjectDetail["weeks"];
  isOwner: boolean;
}) {
  const context = await getBoardContext(projectId, viewer, weeks);

  const actions: BoardActions = {
    createCard,
    saveCard,
    moveCard,
    carryCard,
    setCardArchived,
    uploadFile: uploadAttachment.bind(null, {
      status: "idle",
      message: null,
    }),
    organiseWeek,
    draftCard,
    addWeek: addMilestoneWeek,
    setWeekArchived: setMilestoneWeekArchived,
  };

  return (
    <BoardsPanel
      projectId={projectId}
      weeks={weeks}
      canManage={context.canManage}
      canUpdateStatus={context.canUpdateStatus}
      isOwner={isOwner}
      credentials={context.credentials}
      signedUrls={context.signedUrls}
      actions={actions}
    />
  );
}

function currentWeekCards(week: ProjectDetail["weeks"][number]) {
  return [...week.workCards, ...week.ideaCards];
}

async function TechnicalSections({
  projectId,
  viewer,
  details,
  members,
  isOwner,
  canEditDetails,
  projectArchived,
}: {
  projectId: string;
  viewer: Viewer;
  details: TechnicalDetails | null;
  members: Array<{ id: string; name: string }>;
  isOwner: boolean;
  canEditDetails: boolean;
  projectArchived: boolean;
}) {
  const [credentials, envGroups, envFiles] = await Promise.all([
    getProjectCredentials(projectId, viewer),
    getEnvGroups(projectId, viewer),
    getEnvFiles(projectId, viewer),
  ]);
  const audit = await getCredentialAudit(credentials, viewer);

  const envVariables = credentials.filter((entry) => entry.envGroupId);
  const looseCredentials = credentials.filter((entry) => !entry.envGroupId);

  const envActions: EnvActions = {
    createGroup: createEnvGroup,
    renameGroup: renameEnvGroup,
    setGroupArchived: setEnvGroupArchived,
    saveVariables: saveEnvVariables,
    grantGroup: grantEnvGroupAccess,
    uploadFile: uploadEnvFile,
    archiveFile: archiveEnvFile,
    downloadFile: downloadEnvFile,
    copy: copyCredentialSecret,
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="px-1 text-[11px] font-semibold tracking-[0.1em] text-black/35 uppercase">
          Environment &amp; secrets
        </h2>
        <EnvPanel
          projectId={projectId}
          groups={envGroups}
          variables={envVariables}
          files={envFiles}
          members={members}
          isOwner={isOwner}
          vaultReady={credentialsConfigured()}
          actions={envActions}
        />
      </div>

      <div className="space-y-4">
        <h2 className="px-1 text-[11px] font-semibold tracking-[0.1em] text-black/35 uppercase">
          Technical resources
        </h2>
        <TechnicalPanel
          projectId={projectId}
          details={details}
          canEdit={canEditDetails}
          isArchived={projectArchived}
          save={saveTechnicalDetails}
        />
        <CredentialsPanel
          projectId={projectId}
          credentials={looseCredentials}
          members={members}
          audit={audit}
          isOwner={isOwner}
          vaultReady={credentialsConfigured()}
          projectArchived={projectArchived}
          actions={{
            create: createCredential,
            updateMetadata: updateCredentialMetadata,
            replaceSecret: replaceCredentialSecret,
            grant: grantCredentialAccess,
            setArchived: setCredentialArchived,
            revoke: revokeCredentialAccess,
            copy: copyCredentialSecret,
          }}
        />
      </div>
    </div>
  );
}

function ProjectHeader({
  project,
  viewer,
  activeTab,
}: {
  project: ProjectDetail;
  viewer: Viewer;
  activeTab: Tab;
}) {
  const isOwner = viewer.role === "owner";
  const deadline = deadlineSignal(project.dueOn, project.status);

  return (
    <section className="panel-dark overflow-hidden rounded-[20px] border border-black/[0.07] text-white">
      <div className="relative px-4 pt-5 pb-5 sm:px-6">
        <div className="pointer-events-none absolute -top-32 right-8 size-80 rounded-full bg-[#2fe85c]/12 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2fe85c]/45 to-transparent" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-white/40">
                {project.clientName ?? "No client yet"}
              </span>
              {project.isArchived ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  <Archive className="size-3" /> Archived
                </span>
              ) : null}
            </div>
            <h1 className="font-display mt-2 text-2xl font-semibold tracking-[-0.045em] sm:text-[2rem]">
              {project.name}
            </h1>
            {project.description ? (
              <p className="mt-2 max-w-2xl text-[13px] leading-5 text-white/45">
                {project.description}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {isOwner ? (
              <>
                <StatusControl
                  projectId={project.id}
                  status={project.status}
                  action={setProjectStatus}
                />
                <Link
                  href={`/projects/${project.publicId}/edit`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-xs font-semibold text-white transition duration-200 hover:bg-white/[0.16] hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)] focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none active:scale-[0.97]"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
              </>
            ) : (
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  "bg-[#2fe85c]/12 text-[#69ee88]",
                )}
              >
                {PROJECT_STATUS_LABEL[project.status]}
              </span>
            )}
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <HeaderMeta
            label="Project lead"
            value={project.leadName ?? "Unassigned"}
          />
          <HeaderMeta
            label="Team"
            value={`${project.members.length} assigned`}
          />
          <HeaderMeta
            label="Due date"
            value={formatDate(project.dueOn)}
            note={deadline.label}
          />
          <HeaderMeta
            label="Milestones"
            value={
              project.totalItems
                ? `${project.doneItems}/${project.totalItems} done`
                : "Not planned"
            }
          />
        </div>
      </div>

      <ProjectTabs publicId={project.publicId} activeTab={activeTab} />
    </section>
  );
}

function HeaderMeta({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 transition duration-300 hover:-translate-y-0.5 hover:border-[#2fe85c]/30 hover:bg-white/[0.06]">
      <p className="text-[10px] text-white/28">{label}</p>
      <p className="mt-1.5 truncate text-[12px] font-medium text-white/75">
        {value}
      </p>
      {note ? (
        <p className="mt-0.5 truncate text-[10px] text-white/35">{note}</p>
      ) : null}
    </div>
  );
}

function Overview({
  project,
  financial,
  isOwner,
  tabHref,
}: {
  project: ProjectDetail;
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
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.07]">
              <div
                className={cn("h-full rounded-full", TONE_BAR[signal.tone])}
                style={{ width: `${project.progress}%` }}
              />
            </div>
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
                href={tabHref("milestones")}
                className="mt-3 inline-flex rounded text-[11px] font-semibold text-[#08743d] transition hover:underline focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none"
              >
                Open all milestone weeks →
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
            <Detail
              label="Client"
              value={project.clientName ?? "Not set"}
            />
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
              value={`${project.members.length} ${project.members.length === 1 ? "person" : "people"}`}
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

function describeDelivery(project: ProjectDetail) {
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
  project: ProjectDetail,
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
  if (project.members.length === 0) {
    gaps.push({
      label: "Nobody is assigned, so no team member can open this project.",
      action: "Open Team",
      href: tabHref("team"),
    });
  }
  if (!project.weeks.length) {
    gaps.push({
      label: "No milestone weeks planned, so there is no progress to report.",
      action: "Open Milestones",
      href: tabHref("milestones"),
    });
  }

  return gaps;
}

function technicalDetails(project: ProjectDetail): TechnicalDetails | null {
  const technical = project.technical;
  if (!technical) return null;

  return {
    repositoryUrl: technical.repositoryUrl ?? "",
    hostingUrl: technical.hostingUrl ?? "",
    liveDomain: technical.liveDomain ?? "",
    stagingDomain: technical.stagingDomain ?? "",
    designUrl: technical.designUrl ?? "",
    technicalContact: technical.technicalContact ?? "",
    stackNotes: technical.stackNotes ?? "",
    onboardingNotes: technical.onboardingNotes ?? "",
    updatedBy: technical.updatedBy,
    updatedAt: technical.updatedAt,
  };
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
