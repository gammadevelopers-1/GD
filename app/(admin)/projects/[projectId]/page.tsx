import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Circle,
  Code2,
  ExternalLink,
  LockKeyhole,
  UsersRound,
} from "lucide-react";
import { requireViewer } from "@/data/auth";
import { getProjectDetail } from "@/data/resources";
import { cn } from "@/lib/utils";
import { toggleMilestoneItem } from "../actions";

const tabs = ["overview", "team", "milestones", "technical"] as const;
type Tab = (typeof tabs)[number];

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const viewer = await requireViewer();
  const { projectId } = await params;
  const query = await searchParams;
  const activeTab: Tab = tabs.includes(query.tab as Tab)
    ? (query.tab as Tab)
    : "overview";
  const project = await getProjectDetail(projectId, viewer);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-[1480px]">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-black/42 transition hover:text-black"
      >
        <ArrowLeft className="size-3.5" /> All projects
      </Link>

      <section className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-[#15181b] text-white">
        <div className="relative px-5 pt-6 pb-7 sm:px-7 sm:pt-8 lg:px-9">
          <div className="pointer-events-none absolute -top-28 right-0 size-72 rounded-full bg-[#2fe85c]/12 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#2fe85c]/12 px-2.5 py-1 text-[10px] font-semibold text-[#69ee88] capitalize">
                  {project.status}
                </span>
                <span className="text-[11px] text-white/35">
                  {project.client}
                </span>
              </div>
              <h1 className="font-display mt-5 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                {project.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/42">
                {project.description ??
                  "No project description has been added yet."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-64">
              <DarkMeta label="Project lead" value={project.lead} />
              <DarkMeta label="Due date" value={date(project.dueOn)} />
            </div>
          </div>
        </div>
        <nav className="relative flex overflow-x-auto border-t border-white/[0.07] px-2 sm:px-5">
          {tabs.map((tab) => (
            <Link
              key={tab}
              href={`/projects/${project.id}${tab === "overview" ? "" : `?tab=${tab}`}`}
              className={cn(
                "relative shrink-0 px-4 py-4 text-xs font-medium capitalize transition",
                activeTab === tab
                  ? "text-white"
                  : "text-white/35 hover:text-white/65",
              )}
            >
              {tab}
              {activeTab === tab ? (
                <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-[#2fe85c]" />
              ) : null}
            </Link>
          ))}
        </nav>
      </section>

      <div className="mt-5">
        {activeTab === "overview" ? <Overview project={project} /> : null}
        {activeTab === "team" ? <Team project={project} /> : null}
        {activeTab === "milestones" ? <Milestones project={project} /> : null}
        {activeTab === "technical" ? <Technical project={project} /> : null}
      </div>
    </div>
  );
}

function Overview({
  project,
}: {
  project: NonNullable<Awaited<ReturnType<typeof getProjectDetail>>>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
      <Panel title="Project information" icon={CalendarDays}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Detail label="Client" value={project.client} />
          <Detail label="Status" value={project.status} capitalize />
          <Detail label="Start date" value={date(project.startsOn)} />
          <Detail label="Due date" value={date(project.dueOn)} />
          <Detail label="Project lead" value={project.lead} />
          <Detail
            label="Team size"
            value={`${project.members.length} people`}
          />
        </div>
      </Panel>
      <Panel title="Delivery signal" icon={Circle}>
        <p className="text-sm leading-6 text-black/48">
          {project.weeks.length
            ? `${project.weeks.length} milestone week${project.weeks.length === 1 ? "" : "s"} currently planned.`
            : "Weekly milestones have not been planned yet."}
        </p>
        {project.financial ? (
          <div className="mt-6 rounded-2xl bg-[#15181b] p-4 text-white">
            <p className="font-mono text-[8px] tracking-[0.13em] text-white/30 uppercase">
              Owner-only project value
            </p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.04em]">
              {money(project.financial.amount, project.financial.currency)}
            </p>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

function Team({
  project,
}: {
  project: NonNullable<Awaited<ReturnType<typeof getProjectDetail>>>;
}) {
  return (
    <Panel title="Assigned team" icon={UsersRound}>
      {project.members.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {project.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-2xl border border-black/[0.065] p-3.5"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-[#15181b] text-[10px] font-semibold text-[#2fe85c]">
                {initials(member.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{member.name}</p>
                <p className="mt-1 truncate text-[11px] text-black/40">
                  {member.responsibility}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-black/42">
          No team members have been assigned.
        </p>
      )}
    </Panel>
  );
}

function Milestones({
  project,
}: {
  project: NonNullable<Awaited<ReturnType<typeof getProjectDetail>>>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-3">
      {project.weeks.length ? (
        project.weeks.map((week) => {
          const overdue =
            week.dueOn < today && week.items.some((item) => !item.done);
          const done = week.items.filter((item) => item.done).length;
          return (
            <section
              key={week.id}
              className="overflow-hidden rounded-[20px] border border-black/[0.07] bg-[#f8f8f3]"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-4 sm:px-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold">
                      Week {week.number}
                    </h2>
                    {overdue ? (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-semibold text-red-700">
                        Overdue
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[10px] text-black/38">
                    Due {date(week.dueOn)}
                  </p>
                </div>
                <span className="font-mono text-[9px] text-black/35">
                  {done}/{week.items.length} done
                </span>
              </header>
              <div className="divide-y divide-black/[0.055]">
                {week.items.length ? (
                  week.items.map((item) => (
                    <form
                      key={item.id}
                      action={toggleMilestoneItem}
                      className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
                    >
                      <input type="hidden" name="itemId" value={item.id} />
                      <input
                        type="hidden"
                        name="projectId"
                        value={project.id}
                      />
                      <button
                        type="submit"
                        aria-label={
                          item.done
                            ? `Mark ${item.label} incomplete`
                            : `Mark ${item.label} complete`
                        }
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-lg border transition",
                          item.done
                            ? "border-[#16a34a] bg-[#16a34a] text-white"
                            : "border-black/15 bg-white text-transparent hover:border-[#16a34a]",
                        )}
                      >
                        <Check className="size-3.5" />
                      </button>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm",
                            item.done && "text-black/35 line-through",
                          )}
                        >
                          {item.label}
                        </p>
                        {item.assignee ? (
                          <p className="mt-1 text-[10px] text-black/35">
                            {item.assignee}
                          </p>
                        ) : null}
                      </div>
                    </form>
                  ))
                ) : (
                  <p className="px-5 py-5 text-sm text-black/40">
                    No items in this week.
                  </p>
                )}
              </div>
            </section>
          );
        })
      ) : (
        <Panel title="Weekly milestones" icon={CalendarDays}>
          <p className="text-sm text-black/42">
            No milestone weeks have been planned yet.
          </p>
        </Panel>
      )}
    </div>
  );
}

function Technical({
  project,
}: {
  project: NonNullable<Awaited<ReturnType<typeof getProjectDetail>>>;
}) {
  const technical = project.technical;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
      <Panel title="Technical details" icon={Code2}>
        {technical ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <LinkDetail label="Repository" value={technical.repositoryUrl} />
            <LinkDetail label="Hosting" value={technical.hostingUrl} />
            <LinkDetail label="Live domain" value={technical.liveDomain} />
            <LinkDetail
              label="Staging domain"
              value={technical.stagingDomain}
            />
            <LinkDetail label="Design file" value={technical.designUrl} />
            <Detail
              label="Technical contact"
              value={technical.technicalContact ?? "Not added"}
            />
          </div>
        ) : (
          <p className="text-sm text-black/42">
            No technical details have been added.
          </p>
        )}
      </Panel>
      <Panel title="Credentials" icon={LockKeyhole}>
        <div className="rounded-2xl border border-dashed border-black/10 bg-black/[0.02] p-4">
          <p className="text-sm font-semibold">
            Secrets are intentionally not enabled
          </p>
          <p className="mt-2 text-xs leading-5 text-black/42">
            The brief requires credentials to be built last, after access
            grants, encryption and audit logging have received a separate
            security review.
          </p>
        </div>
        {technical?.stackNotes ? (
          <div className="mt-5">
            <p className="font-mono text-[8px] tracking-wider text-black/30 uppercase">
              Stack notes
            </p>
            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-black/55">
              {technical.stackNotes}
            </p>
          </div>
        ) : null}
      </Panel>
    </div>
  );
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
    <section className="rounded-[20px] border border-black/[0.07] bg-[#f8f8f3] p-5 sm:p-6">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-black/[0.045]">
          <Icon className="size-4 text-black/45" />
        </span>
        <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
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
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-[8px] tracking-wider text-black/30 uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-sm font-medium text-black/65",
          capitalize && "capitalize",
        )}
      >
        {value}
      </p>
    </div>
  );
}
function LinkDetail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="font-mono text-[8px] tracking-wider text-black/30 uppercase">
        {label}
      </p>
      {value ? (
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-1.5 truncate text-sm font-medium text-[#08743d] hover:underline"
        >
          {value}
          <ExternalLink className="size-3 shrink-0" />
        </a>
      ) : (
        <p className="mt-2 text-sm text-black/35">Not added</p>
      )}
    </div>
  );
}
function DarkMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-3">
      <p className="font-mono text-[8px] tracking-wider text-white/25 uppercase">
        {label}
      </p>
      <p className="mt-1.5 truncate text-[11px] font-medium text-white/65">
        {value}
      </p>
    </div>
  );
}
function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(`${value}T00:00:00`))
    : "Not set";
}
function money(value: number, currency: "PKR" | "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
