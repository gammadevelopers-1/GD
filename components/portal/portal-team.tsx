import { Users } from "lucide-react";
import type { PortalPerson } from "@/lib/portal/types";
import { initials } from "@/lib/projects/format";

export function PortalTeam({ team }: { team: PortalPerson[] }) {
  return (
    <section className="card-surface rounded-2xl border border-black/[0.06] p-5">
      <div className="mb-5 flex items-center gap-2.5">
        <Users className="size-4 text-black/35" />
        <h2 className="text-[14px] font-semibold tracking-[-0.025em]">
          On this project
        </h2>
        {team.length ? (
          <span className="ml-auto font-mono text-[10px] text-black/35">
            {team.length}
          </span>
        ) : null}
      </div>

      {team.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {team.map((person) => (
            <li
              key={person.name}
              className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-black/[0.015] px-3.5 py-3"
            >
              {person.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={person.avatarUrl}
                  alt=""
                  className="size-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="bg-gd-panel-dark text-brand grid size-10 shrink-0 place-items-center rounded-full text-[11px] font-semibold">
                  {initials(person.name)}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-semibold tracking-[-0.02em] text-black/85">
                  {person.name}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-black/45">
                  {person.isLead
                    ? "Project lead"
                    : (person.responsibility ?? "On the team")}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-black/45">
          The team has not been assigned yet.
        </p>
      )}
    </section>
  );
}
