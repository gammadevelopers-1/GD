import { BrandLogo } from "@/components/common/brand-logo";

export function PortalCard({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gd-panel-dark relative grid min-h-dvh overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(47,232,92,0.13),transparent_29%),radial-gradient(circle_at_84%_72%,rgba(110,231,183,0.07),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [mask-image:linear-gradient(to_right,black,transparent_78%)] [background-size:52px_52px] opacity-25" />

      <section className="relative hidden min-h-dvh flex-col justify-between border-r border-white/[0.07] p-12 lg:flex xl:p-16">
        <span className="flex w-fit items-center gap-3 text-sm font-medium text-white/80">
          <BrandLogo tone="light" className="h-[22px]" />
        </span>

        <div className="max-w-xl pb-8">
          <h1 className="font-display text-[clamp(3.2rem,6vw,6.8rem)] leading-[0.88] font-semibold tracking-[-0.055em] text-[#ecece4]">
            Your Project
            <br />
            In One Place
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-white/45">
            Progress, milestones and the people building it without waiting on
            an update.
          </p>
        </div>

        <span />
      </section>

      <section className="relative flex min-h-dvh items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandLogo tone="light" className="h-[24px]" />
          </div>

          <p className="text-brand font-mono text-[10px] tracking-[0.16em] uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-[2.3rem]">
            {title}
          </h2>
          {intro ? (
            <p className="mt-3 text-sm leading-6 text-white/40">{intro}</p>
          ) : null}

          <div className="mt-9">{children}</div>
        </div>
      </section>
    </div>
  );
}
