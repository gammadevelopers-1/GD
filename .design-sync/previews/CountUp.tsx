import { CountUp } from "gd-website";

export function StatRow() {
  return (
    <div className="bg-background flex gap-12 p-10">
      <div>
        <p className="text-[44px] leading-none font-medium">
          <CountUp value={38} suffix="%" />
        </p>
        <p className="mt-2 text-sm text-black/55">Support load removed</p>
      </div>
      <div>
        <p className="text-[44px] leading-none font-medium">
          <CountUp value={14} />
        </p>
        <p className="mt-2 text-sm text-black/55">Systems in production</p>
      </div>
      <div>
        <p className="text-[44px] leading-none font-medium">
          <CountUp value={4.8} decimals={1} />
        </p>
        <p className="mt-2 text-sm text-black/55">Avg. weeks to launch</p>
      </div>
    </div>
  );
}

export function WithSuffix() {
  return (
    <div className="bg-background p-10">
      <p className="text-[44px] leading-none font-medium">
        <CountUp value={1240} suffix="+" />
      </p>
      <p className="mt-2 text-sm text-black/55">Hours returned to clients</p>
    </div>
  );
}
