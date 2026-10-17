import { BrandLogo } from "@/components/common/brand-logo";
import { signOutClient } from "@/app/(portal)/portal/sign-in/actions";
import { PortalTabs } from "@/components/portal/portal-tabs";
import { ProjectSwitcher } from "@/components/portal/project-switcher";
import type { PortalTab } from "@/lib/portal/tabs";
import type { ClientViewer, PortalProject } from "@/data/portal";
import type { Portal } from "@/lib/portal/types";
import { PROJECT_STATUS_LABEL, isProjectStatus } from "@/lib/projects/status";
import { bannerFitClass } from "@/lib/projects/banner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type PortalMeta = {
  label: string;
  value: string;
  note?: string;
};

export function PortalTopBar({
  viewer,
  preview = false,
  projects = [],
  currentPublicId,
}: {
  viewer: ClientViewer | null;
  preview?: boolean;
  projects?: PortalProject[];
  currentPublicId?: string;
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#eef0e9]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1480px] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">
        <span className="flex items-center gap-2.5">
          <BrandLogo tone="dark" className="h-[19px]" />
        </span>

        {viewer && currentPublicId ? (
          <ProjectSwitcher
            projects={projects}
            currentPublicId={currentPublicId}
          />
        ) : null}

        {viewer ? (
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2.5 rounded-xl border border-black/[0.07] bg-white/55 p-1.5 pr-3">
              <span className="bg-gd-panel-dark text-brand grid size-7 place-items-center rounded-lg text-[10px] font-semibold">
                {viewer.initials}
              </span>
              <div className="hidden leading-none sm:block">
                <p className="max-w-32 truncate text-[11px] font-semibold">
                  {viewer.fullName}
                </p>
                <p className="mt-1 text-[9px] text-black/40">Client</p>
              </div>
            </div>
            <form action={signOutClient}>
              <Button
                variant="bare"
                size="none"
                type="submit"
                className="focus-visible:ring-brand/45 rounded-xl px-2.5 py-2 text-[11.5px] font-medium text-black/45 transition hover:bg-white/60 hover:text-black focus-visible:ring-2 focus-visible:outline-none"
              >
                Sign out
              </Button>
            </form>
          </div>
        ) : preview ? (
          <span className="ml-auto rounded-full border border-amber-700/25 bg-amber-400/25 px-2.5 py-1 text-[10.5px] font-semibold text-amber-900">
            Preview
          </span>
        ) : null}
      </div>
    </header>
  );
}

export function PortalHero({
  project,
  activeTab,
  tabBase,
  meta,
}: {
  project: Portal["project"];
  activeTab: PortalTab;
  tabBase?: string;
  meta: PortalMeta[];
}) {
  return (
    <section className="panel-dark overflow-hidden rounded-[20px] border border-black/[0.07] text-white">
      {project.bannerUrl ? (
        <div className="relative h-36 sm:h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.bannerUrl}
            alt=""
            className={cn(
              "absolute inset-0 size-full",
              bannerFitClass(project.bannerFit),
            )}
          />
          <div className="to-gd-panel-dark absolute inset-0 bg-gradient-to-b from-black/20 via-transparent" />
        </div>
      ) : null}

      <div className="relative px-4 pt-5 pb-5 sm:px-6">
        <div className="bg-brand/12 pointer-events-none absolute -top-32 right-8 size-80 rounded-full blur-3xl" />
        {project.bannerUrl ? null : (
          <div className="via-brand/45 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
        )}

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <span className="font-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">
              Project
            </span>
            <h1 className="font-display mt-2 text-2xl font-semibold tracking-[-0.045em] sm:text-[2rem]">
              {project.name}
            </h1>
            {project.description ? (
              <p className="mt-2 max-w-2xl text-[13px] leading-5 text-white/45">
                {project.description}
              </p>
            ) : null}
          </div>

          <span className="bg-brand/12 text-gd-mint-bright inline-flex h-fit shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold">
            {isProjectStatus(project.status)
              ? PROJECT_STATUS_LABEL[project.status]
              : project.status}
          </span>
        </div>

        {meta.length ? (
          <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {meta.map((entry) => (
              <div
                key={entry.label}
                className="hover:border-brand/30 min-w-0 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.06]"
              >
                <p className="text-[10px] text-white/28">{entry.label}</p>
                <p className="mt-1.5 truncate text-[12px] font-medium text-white/75">
                  {entry.value}
                </p>
                {entry.note ? (
                  <p className="mt-0.5 truncate text-[10px] text-white/35">
                    {entry.note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <PortalTabs
        publicId={project.publicId}
        activeTab={activeTab}
        base={tabBase}
      />
    </section>
  );
}
