import { KpiCard } from "gd-website";
import { AlertTriangle, Clock, DollarSign, Rocket } from "lucide-react";

export function Default() {
  return (
    <div className="bg-background max-w-xs p-6">
      <KpiCard
        label="Retainer revenue"
        value="$18,400"
        icon={DollarSign}
        tone="money"
        trend={{ current: 18400, previous: 15200 }}
      />
    </div>
  );
}

export function ToneSweep() {
  return (
    <div className="bg-background grid max-w-3xl grid-cols-2 gap-4 p-6">
      <KpiCard
        label="Active projects"
        value="12"
        icon={Rocket}
        tone="neutral"
        trend={{ current: 12, previous: 10 }}
      />
      <KpiCard
        label="Overdue milestones"
        value="3"
        icon={Clock}
        tone="warning"
        trend={{ current: 3, previous: 1 }}
      />
      <KpiCard
        label="At-risk retainers"
        value="2"
        icon={AlertTriangle}
        tone="danger"
        trend={{ current: 2, previous: 4 }}
      />
      <KpiCard
        label="MRR"
        value="$41,900"
        icon={DollarSign}
        tone="money"
        trend={{ current: 41900, previous: 38650 }}
      />
    </div>
  );
}

export function LinkedWithAction() {
  return (
    <div className="bg-background max-w-xs p-6">
      <KpiCard
        label="Unbilled work"
        value="$6,050"
        tone="warning"
        href="/dashboard/invoices"
        action="Review invoices"
      />
    </div>
  );
}

export function NoteOnly() {
  return (
    <div className="bg-background max-w-xs p-6">
      <KpiCard
        label="Team headcount"
        value="9"
        tone="neutral"
        note="No change since onboarding froze in July."
      />
    </div>
  );
}
