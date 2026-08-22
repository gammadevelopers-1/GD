import { AmbientField } from "gd-website";

export function Mint() {
  return (
    <div className="bg-secondary relative isolate h-64 overflow-hidden p-8">
      <AmbientField variant="mint" />
      <div className="relative z-1">
        <p className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
          Mint
        </p>
        <h3 className="font-display mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Systems that hold, after we leave.
        </h3>
      </div>
    </div>
  );
}

export function Blue() {
  return (
    <div className="bg-secondary relative isolate h-64 overflow-hidden p-8">
      <AmbientField variant="blue" />
      <div className="relative z-1">
        <p className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
          Blue
        </p>
        <h3 className="font-display mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Agents that reach production.
        </h3>
      </div>
    </div>
  );
}

export function Violet() {
  return (
    <div className="bg-secondary relative isolate h-64 overflow-hidden p-8">
      <AmbientField variant="violet" />
      <div className="relative z-1">
        <p className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
          Violet
        </p>
        <h3 className="font-display mt-2 text-2xl font-semibold tracking-[-0.03em]">
          What we build for SMBs.
        </h3>
      </div>
    </div>
  );
}

export function Warm() {
  return (
    <div className="bg-secondary relative isolate h-64 overflow-hidden p-8">
      <AmbientField variant="warm" />
      <div className="relative z-1">
        <p className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
          Warm
        </p>
        <h3 className="font-display mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Proof, everywhere.
        </h3>
      </div>
    </div>
  );
}
