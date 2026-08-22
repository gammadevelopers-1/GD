import { ComingSoon } from "gd-website";

export function Default() {
  return (
    <div className="bg-[#f8f8f3] p-6">
      <ComingSoon
        title="Client billing"
        description="Usage-based invoices generated straight from delivered weeks, with Stripe sync and PDF export."
        items={["Stripe sync", "Usage rules", "PDF export", "Auto reminders"]}
      />
    </div>
  );
}

export function Compact() {
  return (
    <div className="max-w-md bg-[#f8f8f3] p-6">
      <ComingSoon
        title="Team capacity view"
        description="A weekly heatmap of who is over-allocated before it becomes a delivery problem."
        compact
      />
    </div>
  );
}
