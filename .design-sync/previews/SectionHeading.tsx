import { SectionHeading } from "gd-website";

export function Default() {
  return (
    <div className="bg-background p-10">
      <SectionHeading
        eyebrow="What we build"
        title="Systems that hold, after we leave."
      />
    </div>
  );
}

export function ShortTitle() {
  return (
    <div className="bg-background p-10">
      <SectionHeading eyebrow="Proof" title="Agents that reach production." />
    </div>
  );
}
