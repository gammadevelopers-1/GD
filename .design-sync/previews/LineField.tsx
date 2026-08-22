import { HeroProvider, LineField } from "gd-website";

export function Default() {
  return (
    <HeroProvider>
      <div className="bg-secondary relative isolate h-[500px] overflow-hidden">
        <div aria-hidden className="hero-gradient-base absolute inset-0 z-0" />
        <div
          aria-hidden
          className="hero-aurora hero-aurora-left absolute -top-[22%] -left-[18%] z-0 h-[76%] w-[64%] rounded-full"
        />
        <div
          aria-hidden
          className="hero-aurora hero-aurora-right absolute top-[12%] -right-[14%] z-0 h-[72%] w-[66%] rounded-full"
        />
        <LineField />
      </div>
    </HeroProvider>
  );
}
