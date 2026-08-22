import { Check } from "lucide-react";

const CELL = "rounded-[7px] border border-white/[0.07] bg-white/[0.06]";

function Board() {
  return (
    <div className="grid h-full grid-cols-3 gap-2 pt-1.5">
      {[
        { label: "New", rows: ["dim", "dim"] },
        { label: "Active", rows: ["lit", "dim"] },
        { label: "Won", rows: ["dim"] },
      ].map((col) => (
        <div key={col.label} className="flex flex-col gap-1.5">
          <span className="font-mono text-[8.5px] tracking-[0.1em] text-[#737a72] uppercase">
            {col.label}
          </span>
          {col.rows.map((row, i) => (
            <span
              key={i}
              className={
                row === "lit"
                  ? "h-6.5 rounded-[7px] border border-[rgba(47,232,92,0.4)] bg-[rgba(47,232,92,0.16)] shadow-[0_0_16px_-6px_rgba(47,232,92,0.6)]"
                  : `h-6.5 ${CELL}`
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Ranking() {
  return (
    <div className="flex h-full flex-col gap-1.75 pt-1.5">
      {[
        { rank: "01", width: "bg-[rgba(47,232,92,0.60)]", score: "92" },
        { rank: "02", width: "bg-[rgba(47,232,92,0.40)]", score: "88" },
        { rank: "03", width: "bg-white/[0.12]", score: "81" },
      ].map((row) => (
        <div key={row.rank} className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-[#737a72]">
            {row.rank}
          </span>
          <span className={`h-4 flex-1 rounded-[5px] ${row.width}`} />
          <span className="font-mono text-[9px] text-[#75efa0]">
            {row.score}
          </span>
        </div>
      ))}
    </div>
  );
}

function Approval() {
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <div className="flex items-center gap-2.25 rounded-[9px] border border-white/[0.07] bg-white/[0.05] px-3 py-2.5">
        <span className="size-2 rounded-full bg-[#febc2e]" />
        <span className="h-1.5 flex-1 rounded-sm bg-white/[0.12]" />
      </div>
      <div className="flex items-center gap-2.25 rounded-[9px] border border-[rgba(47,232,92,0.4)] bg-[rgba(47,232,92,0.12)] px-3 py-2.5">
        <span className="bg-brand grid size-4.5 place-items-center rounded-full text-[#101512]">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
        <span className="h-1.5 flex-1 rounded-sm bg-[rgba(47,232,92,0.4)]" />
      </div>
    </div>
  );
}

function Chart() {
  return (
    <div className="flex h-full flex-col gap-2 pt-1">
      <div className="flex gap-2">
        <span className={`h-8.5 flex-1 rounded-lg ${CELL}`} />
        <span className="h-8.5 flex-1 rounded-lg border border-[rgba(47,232,92,0.35)] bg-[rgba(47,232,92,0.14)]" />
      </div>
      <div className="flex flex-1 items-end gap-1.5 px-0.5">
        {["40%", "70%", "55%", "90%", "65%"].map((height, i) => (
          <span
            key={i}
            style={{ height }}
            className={`flex-1 rounded-t-[3px] ${
              i === 1
                ? "bg-[rgba(47,232,92,0.5)]"
                : i === 3
                  ? "bg-[rgba(47,232,92,0.8)]"
                  : "bg-white/[0.10]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Route() {
  return (
    <div className="relative h-full rounded-lg [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:22px_22px]">
      <svg
        aria-hidden
        viewBox="0 0 220 110"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        <path
          d="M20 88 C70 70 60 30 120 34 S190 60 200 24"
          stroke="#2fe85c"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute bottom-3.5 left-3.5 size-2.25 rounded-full bg-[#ff5f57]" />
      <span className="bg-brand absolute top-3 right-3.5 size-2.25 rounded-full shadow-[0_0_12px_rgba(47,232,92,0.8)]" />
    </div>
  );
}

function Calendar() {
  return (
    <div className="grid h-full grid-cols-7 content-center gap-1.25">
      {Array.from({ length: 21 }, (_, i) => (
        <span
          key={i}
          className={`aspect-square rounded-[4px] ${
            i === 9
              ? "bg-brand"
              : i === 12
                ? "bg-[rgba(47,232,92,0.3)]"
                : "bg-white/[0.06]"
          }`}
        />
      ))}
    </div>
  );
}

export const CASE_THUMBS = {
  board: Board,
  ranking: Ranking,
  approval: Approval,
  chart: Chart,
  route: Route,
  calendar: Calendar,
} as const;
