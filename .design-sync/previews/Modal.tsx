import { Modal } from "gd-website";

const noop = () => {};

export function Default() {
  return (
    <Modal
      open
      title="Add a team member"
      description="They get access to this project's workspace and week plan."
      onClose={noop}
    >
      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-[12px] text-black/55">Name</span>
          <input
            defaultValue="Priya Anand"
            className="w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-sm outline-none"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[12px] text-black/55">Responsibility</span>
          <input
            defaultValue="Backend integrations"
            className="w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-sm outline-none"
          />
        </label>
      </div>
    </Modal>
  );
}

export function LargeWithoutDescription() {
  return (
    <Modal
      open
      title="Northwind Logistics — week 6 report"
      onClose={noop}
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-[13px] leading-6 text-black/60">
          Dispatch agent now reads inbound carrier email and books slots
          automatically. Two milestones remain before handover, both
          scheduled inside the retainer window.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-black/[0.07] bg-black/[0.015] p-3">
            <p className="font-mono text-[9px] tracking-[0.14em] text-black/40 uppercase">
              Done
            </p>
            <p className="font-display mt-1 text-xl font-semibold tracking-[-0.04em]">
              11
            </p>
          </div>
          <div className="rounded-xl border border-black/[0.07] bg-black/[0.015] p-3">
            <p className="font-mono text-[9px] tracking-[0.14em] text-black/40 uppercase">
              Open
            </p>
            <p className="font-display mt-1 text-xl font-semibold tracking-[-0.04em]">
              7
            </p>
          </div>
          <div className="rounded-xl border border-black/[0.07] bg-black/[0.015] p-3">
            <p className="font-mono text-[9px] tracking-[0.14em] text-black/40 uppercase">
              Overdue
            </p>
            <p className="font-display mt-1 text-xl font-semibold tracking-[-0.04em]">
              0
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
