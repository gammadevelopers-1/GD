import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  Plus,
  ReceiptText,
} from "lucide-react";
import { PageHeading } from "@/components/admin/page-heading";
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
        eyebrow={new Intl.DateTimeFormat("en", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }).format(new Date())}
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
        aria-label="Company signals"
        className={`grid gap-3 sm:grid-cols-2 ${data.financials ? "xl:grid-cols-4" : "lg:grid-cols-3"}`}
      >
        <MetricCard
          icon={FolderKanban}
          label={
            viewer.role === "member" ? "My active projects" : "Active projects"
          }
          value={String(data.activeCount)}
          note="Current workload"
          accent
        />
        <MetricCard
          icon={CalendarClock}
          label="Due in 14 days"
          value={String(data.dueSoonCount)}
          note={data.dueSoonCount ? "Needs attention" : "Nothing due soon"}
        />
        <MetricCard
          icon={Clock3}
          label="Overdue milestones"
          value={String(data.overdueMilestones)}
          note={
            data.overdueMilestones ? "Across past weeks" : "Everything on track"
          }
          warning={data.overdueMilestones > 0}
        />
        {data.financials ? (
          <FinancialMetric
            label="Revenue this month"
            pkr={data.financials.revenuePkr}
            usd={data.financials.revenueUsd}
            icon={CircleDollarSign}
            footer={`${data.financials.unpaidCount} invoice${data.financials.unpaidCount === 1 ? "" : "s"} unpaid`}
          />
        ) : null}
      </section>

      <section className="mt-6 overflow-hidden rounded-[22px] border border-black/[0.07] bg-[#f8f8f3] shadow-[0_12px_40px_rgba(20,23,26,0.035)]">
        <div className="flex items-center justify-between border-b border-black/[0.065] px-4 py-4 sm:px-5 lg:px-6">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
              Active projects
            </h2>
            <p className="mt-1 text-xs text-black/40">
              A live view of delivery across the team.
            </p>
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

      {data.financials ? (
        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
          <div className="rounded-[22px] border border-black/[0.07] bg-[#15181b] p-5 text-white sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] tracking-[0.14em] text-[#2fe85c] uppercase">
                  Money waiting
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.035em]">
                  Unpaid invoices
                </h2>
              </div>
              <ReceiptText className="size-5 text-white/25" />
            </div>
            <div className="mt-8 flex flex-wrap items-end gap-x-7 gap-y-2">
              <p className="text-3xl font-semibold tracking-[-0.05em]">
                {formatMoney(data.financials.unpaidPkr, "PKR")}
              </p>
              <p className="pb-1 text-sm text-white/40">
                {formatMoney(data.financials.unpaidUsd, "USD")}
              </p>
            </div>
            <p className="mt-4 text-xs text-white/35">
              Amounts use the exchange rate stored on each invoice.
            </p>
          </div>
          <div className="rounded-[22px] border border-black/[0.07] bg-[#f8f8f3] p-5 sm:p-6">
            <p className="font-mono text-[9px] tracking-[0.14em] text-black/35 uppercase">
              This week
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.035em]">
              What needs attention
            </h2>
            <div className="mt-6 space-y-3">
              <Signal
                label="Overdue milestone items"
                value={data.overdueMilestones}
              />
              <Signal label="Projects due soon" value={data.dueSoonCount} />
              <Signal
                label="Unpaid invoices"
                value={data.financials.unpaidCount}
              />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  accent = false,
  warning = false,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: string;
  note: string;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-[20px] border p-4 sm:p-5 ${accent ? "border-[#2fe85c]/20 bg-[#dff7df]" : "border-black/[0.07] bg-[#f8f8f3]"}`}
    >
      {accent ? (
        <div className="absolute -top-14 -right-10 size-28 rounded-full bg-[#2fe85c]/20 blur-2xl" />
      ) : null}
      <div className="relative flex items-start justify-between">
        <p className="text-xs font-medium text-black/48">{label}</p>
        <span
          className={`grid size-8 place-items-center rounded-lg ${accent ? "bg-[#15181b] text-[#2fe85c]" : "bg-black/[0.045] text-black/45"}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="relative mt-5 text-[2rem] leading-none font-semibold tracking-[-0.055em]">
        {value}
      </p>
      <p
        className={`relative mt-3 text-[11px] ${warning ? "font-medium text-amber-700" : "text-black/38"}`}
      >
        {note}
      </p>
    </article>
  );
}

function FinancialMetric({
  label,
  pkr,
  usd,
  icon: Icon,
  footer,
}: {
  label: string;
  pkr: number;
  usd: number;
  icon: typeof CircleDollarSign;
  footer: string;
}) {
  return (
    <article className="rounded-[20px] border border-black/[0.07] bg-[#f8f8f3] p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-black/48">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-black/[0.045] text-black/45">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-5 text-[1.45rem] leading-none font-semibold tracking-[-0.045em]">
        {formatMoney(pkr, "PKR")}
      </p>
      <p className="mt-2 text-xs text-black/42">{formatMoney(usd, "USD")}</p>
      <p className="mt-3 text-[11px] text-black/38">{footer}</p>
    </article>
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

function Signal({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-black/[0.035] px-3.5 py-3 text-xs">
      <span className="text-black/52">{label}</span>
      <span
        className={`font-mono font-semibold ${value ? "text-amber-700" : "text-[#08743d]"}`}
      >
        {value}
      </span>
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
