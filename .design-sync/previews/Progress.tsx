import { Progress } from "gd-website";

export function Default() {
  return (
    <div className="bg-background w-80 p-10">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
          Week 4 of 8
        </span>
        <span className="font-mono text-[9px] tabular-nums text-black/40">
          52%
        </span>
      </div>
      <Progress value={52} />
    </div>
  );
}

export function Low() {
  return (
    <div className="bg-background w-80 p-10">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
          Northwind Logistics
        </span>
        <span className="font-mono text-[9px] tabular-nums text-black/40">
          8%
        </span>
      </div>
      <Progress value={8} />
    </div>
  );
}

export function Complete() {
  return (
    <div className="bg-background w-80 p-10">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
          Onboarding checklist
        </span>
        <span className="font-mono text-[9px] tabular-nums text-black/40">
          100%
        </span>
      </div>
      <Progress
        value={100}
        indicatorClassName="bg-[#2fe85c]"
      />
    </div>
  );
}

export function Stack() {
  const rows = [
    { label: "Discovery", value: 100 },
    { label: "Building", value: 64 },
    { label: "Review", value: 12 },
  ];
  return (
    <div className="bg-background w-80 space-y-4 p-10">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
              {row.label}
            </span>
            <span className="font-mono text-[9px] tabular-nums text-black/40">
              {row.value}%
            </span>
          </div>
          <Progress value={row.value} />
        </div>
      ))}
    </div>
  );
}
