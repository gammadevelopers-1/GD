import { StatusControl } from "gd-website";

const noop = async () => {};

export function OnDarkHeader() {
  return (
    <div className="panel-dark flex items-center justify-between gap-6 p-6">
      <div>
        <p className="font-mono text-[9px] tracking-[0.16em] text-white/40 uppercase">
          Project
        </p>
        <p className="font-display mt-1 text-lg font-semibold tracking-[-0.03em] text-white">
          Northwind Logistics
        </p>
      </div>
      <StatusControl projectId="demo" status="building" action={noop} />
    </div>
  );
}

export function LiveStatus() {
  return (
    <div className="panel-dark p-6">
      <StatusControl projectId="demo" status="live" action={noop} />
    </div>
  );
}
