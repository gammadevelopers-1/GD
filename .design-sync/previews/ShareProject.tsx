import { ShareProject, StatusControl } from "gd-website";

const noop = async () => {};

export function OnProjectHeader() {
  return (
    <div className="panel-dark flex items-center justify-between gap-6 p-6">
      <div>
        <p className="font-mono text-[9px] tracking-[0.16em] text-white/40 uppercase">
          Harbor Freight Co
        </p>
        <p className="font-display mt-1 text-lg font-semibold tracking-[-0.03em] text-white">
          Northwind Logistics
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusControl
          projectId="northwind-logistics"
          status="building"
          action={noop}
        />
        <ShareProject
          projectId="northwind-logistics"
          publicId="northwind-logistics"
          share={noop}
        />
      </div>
    </div>
  );
}

export function InToolbar() {
  return (
    <div className="panel-dark flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
      <span className="shrink-0 text-[11px] text-white/40">
        Union Bay Retail
      </span>
      <span aria-hidden className="shrink-0 text-white/20">
        /
      </span>
      <h1 className="font-display min-w-0 flex-1 truncate text-[15px] font-semibold tracking-[-0.03em] text-white">
        Returns triage agent
      </h1>
      <ShareProject
        projectId="returns-triage"
        publicId="returns-triage"
        share={noop}
      />
    </div>
  );
}
