import { Reveal, SectionHeading } from "gd-website";

export function Default() {
  return (
    <div className="bg-secondary p-10">
      <Reveal>
        <SectionHeading
          eyebrow="How we work"
          title="Ship where pilots die."
        />
      </Reveal>
    </div>
  );
}

export function Stagger() {
  return (
    <div className="bg-secondary p-10">
      <Reveal stagger className="grid sm:grid-cols-3 gap-4">
        {["Discovery", "Building", "Live"].map((label) => (
          <div
            key={label}
            className="card-surface rounded-2xl border border-black/[0.06] p-4"
          >
            <span className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
              {label}
            </span>
            <p className="font-display mt-2 text-sm font-semibold tracking-[-0.02em]">
              Northwind Logistics
            </p>
          </div>
        ))}
      </Reveal>
    </div>
  );
}

export function Delayed() {
  return (
    <div className="bg-secondary p-10">
      <Reveal delay={0.3}>
        <p className="text-muted-foreground max-w-md text-[15px] leading-relaxed">
          Six weeks is typical for a first agent in production. The audit
          itself takes half a day.
        </p>
      </Reveal>
    </div>
  );
}
