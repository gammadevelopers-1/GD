import { StateBadge } from "gd-website";

export function AllStates() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <StateBadge state="active" />
      <StateBadge state="invited" />
      <StateBadge state="created" />
      <StateBadge state="archived" />
    </div>
  );
}

export function InTeamRow() {
  return (
    <div className="card-surface max-w-sm rounded-2xl border border-black/[0.06] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13.5px] font-semibold tracking-[-0.02em]">
            Priya Anand
          </p>
          <p className="text-[11.5px] text-black/45">
            Backend integrations
          </p>
        </div>
        <StateBadge state="invited" />
      </div>
    </div>
  );
}
