import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { TeamAccountState, TeamMember } from "@/data/team";
import { ROLE_LABELS } from "@/lib/team/records";
import { PANEL, ROW_HOVER, TONE_SOFT, type Tone } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

const STATE_LABELS: Record<TeamAccountState, string> = {
  active: "Active",
  invited: "Invited",
  created: "No invite sent",
  archived: "Archived",
};

const STATE_TONES: Record<TeamAccountState, Tone> = {
  active: "ok",
  invited: "info",
  created: "warning",
  archived: "muted",
};

export function TeamList({ members }: { members: TeamMember[] }) {
  return (
    <>
      <div className={cn(PANEL, "hidden overflow-hidden sm:block")}>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-black/[0.07]">
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Projects</Th>
              <Th>Account</Th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.id}
                className={cn(
                  "border-b border-black/[0.05] last:border-0",
                  ROW_HOVER,
                )}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/team/${member.id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar name={member.fullName} dimmed={!member.isActive} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-semibold tracking-[-0.02em]">
                        {member.fullName}
                      </span>
                      <span className="block truncate text-[11.5px] text-black/60">
                        {member.jobTitle ?? member.email ?? "No job title"}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-[12.5px] text-black/70">
                  {ROLE_LABELS[member.role]}
                </td>
                <td className="px-4 py-3 font-mono text-[12.5px] text-black/70">
                  {member.projectCount}
                </td>
                <td className="px-4 py-3">
                  <StateBadge state={member.state} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/team/${member.id}`}
                    aria-label={`Open ${member.fullName}`}
                    className="grid size-7 place-items-center rounded-lg text-black/55 transition hover:bg-black/[0.05] hover:text-black"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:hidden">
        {members.map((member) => (
          <Link
            key={member.id}
            href={`/team/${member.id}`}
            className={cn(PANEL, "block p-4")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={member.fullName} dimmed={!member.isActive} />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold tracking-[-0.02em]">
                    {member.fullName}
                  </p>
                  <p className="truncate text-[11.5px] text-black/60">
                    {member.jobTitle ?? member.email ?? "No job title"}
                  </p>
                </div>
              </div>
              <StateBadge state={member.state} />
            </div>
            <dl className="mt-4 flex gap-6">
              <div>
                <dt className="font-mono text-[9px] tracking-[0.14em] text-black/55 uppercase">
                  Role
                </dt>
                <dd className="mt-1 text-[12.5px] text-black/70">
                  {ROLE_LABELS[member.role]}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] tracking-[0.14em] text-black/55 uppercase">
                  Projects
                </dt>
                <dd className="mt-1 font-mono text-[12.5px] text-black/70">
                  {member.projectCount}
                </dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </>
  );
}

export function StateBadge({ state }: { state: TeamAccountState }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold",
        TONE_SOFT[STATE_TONES[state]],
      )}
    >
      {STATE_LABELS[state]}
    </span>
  );
}

function Avatar({ name, dimmed }: { name: string; dimmed?: boolean }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl bg-[#15181b] text-[11px] font-semibold text-[#2fe85c]",
        dimmed && "opacity-40",
      )}
    >
      {initials(name)}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 font-mono text-[9px] font-medium tracking-[0.14em] text-black/55 uppercase">
      {children}
    </th>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
