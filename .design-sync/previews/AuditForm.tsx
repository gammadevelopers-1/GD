import { AuditForm, HeroProvider } from "gd-website";

export function Default() {
  return (
    <HeroProvider>
      <div className="bg-secondary p-10">
        <AuditForm />
      </div>
    </HeroProvider>
  );
}

export function InHeroContext() {
  return (
    <HeroProvider>
      <div className="bg-secondary p-10 text-center">
        <p className="font-mono text-[10px] tracking-[0.16em] text-black/40 uppercase">
          Free audit
        </p>
        <h2 className="font-display mx-auto mt-2 max-w-md text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em]">
          Tell us what's eating your week.
        </h2>
        <AuditForm />
      </div>
    </HeroProvider>
  );
}
