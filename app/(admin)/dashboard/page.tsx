import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CalendarOff,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  Plus,
  ReceiptText,
} from "lucide-react";
import { PageHeading } from "@/components/admin/page-heading";
import { KpiCard } from "@/components/admin/kpi-card";
import { DeliveryPulse } from "@/components/admin/delivery-pulse";
import { requireViewer, type Viewer } from "@/data/auth";
import {
  getDashboardData,
  type DashboardData,
  type DashboardProject,
  type ProjectStatus,
} from "@/data/dashboard";
import {
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_TONE,
} from "@/lib/projects/status";

export const metadata = { title: "Overview · Internal platform" };

const ACTIVE_STATUSES = "discovery,building,review,live,retainer";

const statusLabels = PROJECT_STATUS_LABEL;
const statusStyles = PROJECT_STATUS_TONE;

export default async function DashboardPage() {
  const viewer = await requireViewer();
  const data = await getDashboardData(viewer);
  return <DashboardView viewer={viewer} data={data} />;
}

function DashboardView({
  viewer,
  data,
}: {
  viewer: Viewer;
  data: DashboardData;
}) {
  const firstName = viewer.fullName.split(" ")[0];

  return (
    <div className="mx-auto max-w-[1480px]">
      <PageHeading
        title={`Good morning, ${firstName}.`}
        action={
          viewer.role === "owner" ? (
            <Link
              href="/projects/new"
              data-button-fill
              className="button-fill-fx button-fill-fx--lift group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#15181b] px-4 text-sm font-semibold text-white shadow-sm transition [--button-fill-color:#2fe85c] [--button-fill-hover-text:#101512]"
            >
              <Plus className="size-4 text-[#2fe85c] transition-colors group-hover:text-[#101512]" />
              <span className="button-fill-fx__label">New project</span>
            </Link>
          ) : undefined
        }
      />

      <section
        aria-label="Needs attention"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          icon={FolderKanban}
          label={viewer.role === "member" ? "My projects" : "Active projects"}
          value={String(data.activeCount)}
          href={`/projects?status=${ACTIVE_STATUSES}`}
          action="Open the list"
        />
        <KpiCard
          icon={Clock3}
          label="Overdue"
          value={String(data.overdueMilestones)}
          tone={data.overdueMilestones > 0 ? "danger" : "neutral"}
          href={data.overdueMilestones ? "/projects?view=table" : undefined}
          action={data.overdueMilestones ? "See what is behind" : undefined}
          note={data.overdueMilestones ? undefined : "Nothing outstanding"}
        />
        <KpiCard
          icon={CalendarClock}
          label="Due in 14 days"
          value={String(data.dueSoonCount)}
          href={data.dueSoonCount ? "/projects?view=table" : undefined}
          action={data.dueSoonCount ? "Check the dates" : undefined}
          note={data.dueSoonCount ? undefined : "Nothing due"}
        />
        <KpiCard
          icon={CalendarOff}
          label="No plan yet"
          value={String(data.planlessCount)}
          tone={data.planlessCount > 0 ? "warning" : "neutral"}
          href={data.planlessCount ? "/projects?view=table" : undefined}
          action={data.planlessCount ? "Give them a week" : undefined}
          note={data.planlessCount ? undefined : "Every project is planned"}
        />
      </section>

      {data.financials ? (
        <section
          aria-label="Money this month"
          className="mt-3 grid gap-3 sm:grid-cols-2"
        >
          <KpiCard
            icon={CircleDollarSign}
            label="Paid this month"
            value={formatMoney(data.financials.revenuePkr, "PKR")}
            tone="money"
            trend={{
              current: data.financials.revenuePkr,
              previous: data.financials.revenuePkrPrevious,
            }}
            window="vs last month"
            note={formatMoney(data.financials.revenueUsd, "USD")}
          />
          <KpiCard
            icon={ReceiptText}
            label="Unpaid"
            value={formatMoney(data.financials.unpaidPkr, "PKR")}
            tone={data.financials.overdueCount > 0 ? "danger" : "neutral"}
            note={
              data.financials.unpaidCount
                ? `${data.financials.unpaidCount} invoice${data.financials.unpaidCount === 1 ? "" : "s"}${data.financials.overdueCount ? ` · ${data.financials.overdueCount} past due` : ""}`
                : "Everything settled"
            }
          />
        </section>
      ) : null}

      <section aria-label="Recent delivery" className="mt-3">
        <DeliveryPulse weeks={data.delivery} />
      </section>

      <section className="mt-6 overflow-hidden rounded-[22px] border border-black/[0.07] bg-[#f8f8f3] shadow-[0_12px_40px_rgba(20,23,26,0.035)]">
        <div className="flex items-center justify-between border-b border-black/[0.065] px-4 py-4 sm:px-5 lg:px-6">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
              Active projects
            </h2>
          </div>
          <Link
            href="/projects"
            className="group flex items-center gap-1.5 text-xs font-semibold text-[#08743d]"
          >
            View all{" "}
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {data.projects.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[780px] text-left">
                <thead className="border-b border-black/[0.055] bg-black/[0.018] font-mono text-[9px] tracking-[0.12em] text-black/35 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Lead</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                    <th className="px-6 py-3 text-right font-medium">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.055]">
                  {data.projects.slice(0, 8).map((project) => (
                    <ProjectRow key={project.id} project={project} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-black/[0.06] md:hidden">
              {data.projects.slice(0, 8).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </>
        ) : (
          <EmptyProjects owner={viewer.role === "owner"} />
        )}
      </section>
    </div>
  );
}

function ProjectRow({ project }: { project: DashboardProject }) {
  return (
    <tr className="transition hover:bg-black/[0.018]">
      <td className="px-6 py-4">
        <Link href={`/projects/${project.publicId}`} className="block">
          <p className="text-sm font-semibold tracking-[-0.02em]">
            {project.name}
          </p>
          <p className="mt-1 text-[11px] text-black/38">{project.client}</p>
        </Link>
      </td>
      <td className="px-4 py-4">
        <Status status={project.status} />
      </td>
      <td className="px-4 py-4 text-xs text-black/55">{project.lead}</td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/[0.07]">
            <div
              className="h-full rounded-full bg-[#16a34a]"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="font-mono text-[9px] text-black/40">
            {project.progress}%
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-right text-xs text-black/48">
        {formatDate(project.dueOn)}
      </td>
    </tr>
  );
}

function ProjectCard({ project }: { project: DashboardProject }) {
  return (
    <Link
      href={`/projects/${project.publicId}`}
      className="block p-4 active:bg-black/[0.02]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{project.name}</p>
          <p className="mt-1 truncate text-[11px] text-black/40">
            {project.client}
          </p>
        </div>
        <span className="shrink-0">
          <Status status={project.status} />
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-[11px] text-black/43">
        <span className="truncate">{project.lead}</span>
        <span className="text-right">{formatDate(project.dueOn)}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
        <div
          className="h-full rounded-full bg-[#16a34a]"
          style={{ width: `${project.progress}%` }}
        />
      </div>
    </Link>
  );
}

function Status({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function EmptyProjects({ owner }: { owner: boolean }) {
  return (
    <div className="grid min-h-64 place-items-center px-5 py-12 text-center">
      <div>
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-black/[0.045]">
          <FolderKanban className="size-5 text-black/35" />
        </span>
        <h3 className="mt-4 text-sm font-semibold">No active projects yet</h3>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-black/40">
          {owner
            ? "Create the first project to start tracking its team, weekly milestones and technical details."
            : "Projects assigned to you will appear here."}
        </p>
      </div>
    </div>
  );
}

function formatDate(date: string | null) {
  if (!date) return "No due date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatMoney(value: number, currency: "PKR" | "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "PKR" ? 0 : 0,
  }).format(value);
}
