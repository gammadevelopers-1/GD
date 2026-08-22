import { ClientStateBadge } from "gd-website";

export function States() {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-[#f8f8f3] p-6">
      <ClientStateBadge state="active" />
      <ClientStateBadge state="invited" />
      <ClientStateBadge state="created" />
      <ClientStateBadge state="archived" />
    </div>
  );
}
