"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronDown,
  CircleGauge,
  FilePenLine,
  FolderKanban,
  LogOut,
  Menu,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Mark } from "@/components/layout/site-nav";
import { logout } from "@/app/(auth)/login/actions";
import type { AppRole, Viewer } from "@/data/auth";
import { cn } from "@/lib/utils";

const navigation: Array<{
  label: string;
  href: string;
  icon: typeof CircleGauge;
  roles: AppRole[];
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
  },
  { label: "Clients", href: "/clients", icon: Building2, roles: ["owner"] },
  { label: "CMS", href: "/cms", icon: FilePenLine, roles: ["owner"] },
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
  const root = pathname.split("/").filter(Boolean)[0] ?? "dashboard";

  return (
    <div className="min-h-dvh bg-[#eef0e9] text-[#14171a]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-white/[0.07] bg-[#15181b] px-3 py-4 text-white lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2">
          <Mark className="size-8 rounded-[9px] border border-white/10" />
          <div>
            <p className="text-sm font-semibold tracking-[-0.02em]">
              Gamma Developers
            </p>
            <p className="mt-0.5 font-mono text-[8px] tracking-[0.16em] text-white/30 uppercase">
              Team Dashboard
            </p>
          </div>
        </Link>

        <nav aria-label="Platform navigation" className="mt-9 space-y-1">
          <p className="mb-3 px-3 font-mono text-[9px] tracking-[0.15em] text-white/25 uppercase">
            Workspace
          </p>
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

        <div className="mt-auto">
          

          <form action={logout}>
            <button className="bg-white/[0.055] flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/45 transition hover:bg-white/[0.025] hover:text-white">
              <LogOut className="size-[17px]" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-black/[0.07] bg-[#eef0e9]/88 backdrop-blur-xl">
          <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
              className="grid size-10 place-items-center rounded-xl border border-black/[0.08] bg-white/55 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-[-0.025em]">
                {titles[root] ?? "Internal platform"}
              </p>
              <p className="hidden text-[11px] text-black/40 sm:block">
                Private Gamma workspace
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button className="hidden h-10 items-center gap-2 rounded-xl border border-black/[0.07] bg-white/50 px-3 text-sm text-black/45 transition hover:bg-white md:flex">
                <Search className="size-4" />
                <span>Search</span>
                <kbd className="ml-4 rounded-md border border-black/[0.07] bg-black/[0.025] px-1.5 py-0.5 font-mono text-[9px]">
                  ⌘K
                </kbd>
              </button>
              <div className="flex items-center gap-2 rounded-xl border border-black/[0.07] bg-white/55 p-1.5 pr-2.5">
                <span className="grid size-7 place-items-center rounded-lg bg-[#15181b] text-[10px] font-semibold text-[#2fe85c]">
                  {viewer.initials}
                </span>
                <div className="hidden sm:block">
                  <p className="max-w-28 truncate text-[11px] leading-3.5 font-semibold">
                    {viewer.fullName}
                  </p>
                  <p className="mt-0.5 text-[9px] text-black/40 capitalize">
                    {viewer.role}
                  </p>
                </div>
                <ChevronDown className="hidden size-3.5 text-black/35 sm:block" />
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-10 xl:px-10">
          {children}
        </main>
      </div>

      <MobileNavigation items={items} pathname={pathname} />

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(86vw,330px)] bg-[#15181b] p-4 text-white shadow-2xl">
            <div className="flex items-center justify-between">
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
                className="grid size-10 place-items-center rounded-xl bg-white/[0.06]"
                aria-label="Close navigation"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="mt-10 space-y-1">
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
            <form action={logout} className="absolute inset-x-4 bottom-5">
              <button className="flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white/55">
                <LogOut className="size-4" /> Sign out
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
    </Link>
  );
}

function MobileNavigation({
  items,
  pathname,
}: {
  items: typeof navigation;
  pathname: string;
}) {
  return (
    <nav
      aria-label="Mobile platform navigation"
      className="fixed inset-x-3 bottom-3 z-40 flex h-[66px] items-center justify-around rounded-2xl border border-white/10 bg-[#15181b]/96 px-1.5 shadow-[0_18px_55px_rgba(0,0,0,0.32)] backdrop-blur-xl lg:hidden"
    >
      {items.slice(0, 5).map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[9px]",
              active ? "text-[#2fe85c]" : "text-white/38",
            )}
          >
            <Icon className="size-[18px]" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
