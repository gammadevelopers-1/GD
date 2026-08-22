import { PortalTabs } from "gd-website";

export function OverviewActive() {
  return (
    <div className="panel-dark rounded-[20px] border border-black/[0.07]">
      <div className="px-4 pt-5 pb-1 sm:px-6">
        <span className="font-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">
          Project
        </span>
        <h1 className="font-display mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
          Northwind Logistics
        </h1>
      </div>
      <PortalTabs publicId="northwind-logistics" activeTab="overview" />
    </div>
  );
}

export function MilestoneActive() {
  return (
    <div className="panel-dark rounded-[20px] border border-black/[0.07]">
      <div className="px-4 pt-5 pb-1 sm:px-6">
        <span className="font-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">
          Project
        </span>
        <h1 className="font-display mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
          Harbor Freight Co.
        </h1>
      </div>
      <PortalTabs publicId="harbor-freight" activeTab="milestone" />
    </div>
  );
}
