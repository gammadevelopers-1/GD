"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CircleDollarSign,
  CircleGauge,
  ContactRound,
  FilePenLine,
  FolderKanban,
  Library,
  LogOut,
  Menu,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Mark } from "@/components/layout/site-nav";
import { logout } from "@/app/(auth)/login/actions";
import type { AppRole, Viewer } from "@/data/auth";
import { cn } from "@/lib/utils";

const navigation: Array<{
  label: string;
  href: string;
  icon: typeof CircleGauge;
  roles: AppRole[];
  inProgress?: boolean;
}> = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: CircleGauge,
    roles: ["owner", "member", "finance"],
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    roles: ["owner", "member"],
  },
  {
    label: "People",
    href: "/people",
    icon: UsersRound,
    roles: ["owner", "member"],
    inProgress: true,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Building2,
    roles: ["owner"],
    inProgress: true,
  },
  {
    label: "CMS",
    href: "/cms",
    icon: FilePenLine,
    roles: ["owner"],
    inProgress: true,
  },
];

const plannedNavigation: Array<{
  label: string;
  icon: typeof CircleGauge;
  roles: AppRole[];
}> = [
  {
    label: "Finance",
    icon: CircleDollarSign,
    roles: ["owner", "finance"],
  },
  { label: "Leads", icon: ContactRound, roles: ["owner"] },
  { label: "Assets", icon: Library, roles: ["owner", "member"] },
];

const titles: Record<string, string> = {
  dashboard: "Company overview",
  projects: "Projects",
  people: "People",
  clients: "Clients",
  cms: "Content management",
};

export function AdminShell({
  viewer,
  children,
}: {
  viewer: Viewer;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = navigation.filter((item) => item.roles.includes(viewer.role));
  const plannedItems = plannedNavigation.filter((item) =>
    item.roles.includes(viewer.role),
  );
  const root = pathname.split("/").filter(Boolean)[0] ?? "dashboard";

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <div className="app-canvas min-h-dvh overflow-x-clip bg-[#eef0e9] text-[#14171a]">
      <aside className="mesh-dark fixed inset-y-0 left-0 z-40 hidden w-60 flex-col overflow-y-auto border-r border-white/[0.07] px-3 py-4 text-white lg:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/[0.04]"
        >
          <Mark className="size-8 rounded-[9px] border border-white/10" />
          <p className="text-sm font-semibold tracking-[-0.02em]">
            Gamma Developers
          </p>
        </Link>

        <nav aria-label="Platform navigation" className="mt-7 space-y-1">
          {items.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              }
            />
          ))}
        </nav>

        {plannedItems.length ? (
          <div className="mt-6 space-y-1 border-t border-white/[0.06] pt-6">
            {plannedItems.map((item) => (
              <PlannedNavItem key={item.label} item={item} />
            ))}
          </div>
        ) : null}

        <div className="mt-auto">
          <form action={logout}>
            <button
              data-button-fill
              className="button-fill-fx button-fill-fx--lift flex w-full items-center gap-3 rounded-xl bg-white/[0.055] px-3 py-2.5 text-left text-sm text-white/45 transition [--button-fill-color:#2fe85c] [--button-fill-hover-text:#101512]"
            >
              <LogOut className="size-[17px]" />
              <span className="button-fill-fx__label">Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-black/6 bg-[#eef0e9]/80 backdrop-blur-xl">
          <div className="flex h-15.5 items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              aria-controls="mobile-platform-navigation"
              onClick={() => setMenuOpen(true)}
              data-button-fill
              className="button-fill-fx button-fill-fx--lift grid size-10 shrink-0 place-items-center rounded-xl border border-black/[0.08] bg-white/55 transition [--button-fill-color:#2fe85c] [--button-fill-hover-text:#101512] hover:border-black/15 focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:outline-none lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <p className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.025em]">
              {titles[root] ?? "Internal platform"}
            </p>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                disabled
                title="Search is coming soon"
                className="hidden h-9 cursor-not-allowed items-center gap-2 rounded-xl border border-black/[0.07] bg-white/40 px-3 text-[13px] text-black/30 md:flex"
              >
                <Search className="size-4" />
                <span>Search</span>
              </button>
              <div className="flex items-center gap-2.5 rounded-xl border border-black/[0.07] bg-white/55 p-1.5 pr-3 transition hover:border-black/[0.14] hover:bg-white/80">
                <span className="grid size-7 place-items-center rounded-lg bg-[#15181b] text-[10px] font-semibold text-[#2fe85c]">
                  {viewer.initials}
                </span>
                <div className="hidden leading-none sm:block">
                  <p className="max-w-28 truncate text-[11px] font-semibold">
                    {viewer.fullName}
                  </p>
                  <p className="mt-1 text-[9px] text-black/40 capitalize">
                    {viewer.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 px-4 py-6 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:py-8 xl:px-10">
          {children}
        </main>
      </div>

      {menuOpen ? (
        <div
          id="mobile-platform-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Platform navigation"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <button
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,330px)] flex-col overflow-y-auto bg-[#15181b] p-4 text-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between">
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3"
              >
                <Mark className="size-8 rounded-[9px]" />
                <span className="text-sm font-semibold">Gamma Developers</span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                data-button-fill
                className="button-fill-fx button-fill-fx--lift grid size-10 place-items-center rounded-xl bg-white/[0.06] transition [--button-fill-color:#2fe85c] [--button-fill-hover-text:#101512]"
                aria-label="Close navigation"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="mt-8 space-y-1">
              {items.map((item) => (
                <div key={item.href} onClick={() => setMenuOpen(false)}>
                  <NavItem
                    item={item}
                    active={
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`)
                    }
                  />
                </div>
              ))}
            </nav>
            {plannedItems.length ? (
              <div className="mt-6 space-y-1 border-t border-white/[0.07] pt-6">
                {plannedItems.map((item) => (
                  <PlannedNavItem key={item.label} item={item} />
                ))}
              </div>
            ) : null}
            <form action={logout} className="mt-auto pt-8">
              <button
                data-button-fill
                className="button-fill-fx button-fill-fx--lift flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white/55 transition [--button-fill-color:#2fe85c] [--button-fill-hover-text:#101512]"
              >
                <LogOut className="size-4" />
                <span className="button-fill-fx__label">Sign out</span>
              </button>
            </form>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function NavItem({
  item,
  active,
}: {
  item: (typeof navigation)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
        active
          ? "bg-[#2fe85c] font-semibold text-[#101512]"
          : "text-white/45 hover:bg-white/[0.055] hover:text-white",
      )}
    >
      <Icon
        className={cn(
          "size-[17px]",
          active ? "text-[#101512]" : "text-white/38 group-hover:text-white/80",
        )}
      />
      {item.label}
      {item.inProgress ? (
        <span
          title="In progress"
          className={cn(
            "ml-auto size-1.5 rounded-full",
            active ? "bg-[#101512]/25" : "bg-[#2fe85c]/45",
          )}
        />
      ) : null}
    </Link>
  );
}

function PlannedNavItem({
  item,
}: {
  item: (typeof plannedNavigation)[number];
}) {
  const Icon = item.icon;
  return (
    <div
      aria-disabled="true"
      title={`${item.label} — a later release`}
      className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/22"
    >
      <Icon className="size-[17px]" />
      <span>{item.label}</span>
    </div>
  );
}
