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
  UsersRound,
} from "lucide-react";
import { Mark } from "@/components/layout/site-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { logout } from "@/app/(auth)/login/actions";
import type { AppRole, Viewer } from "@/data/auth";

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
  defaultSidebarOpen,
  children,
}: {
  viewer: Viewer;
  defaultSidebarOpen: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = navigation.filter((item) => item.roles.includes(viewer.role));
  const plannedItems = plannedNavigation.filter((item) =>
    item.roles.includes(viewer.role),
  );
  const root = pathname.split("/").filter(Boolean)[0] ?? "dashboard";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultSidebarOpen} className="bg-background">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="lg" tooltip="Gamma Developers">
                  <Link href="/dashboard">
                    <Mark className="size-8 rounded-[9px] border border-white/10" />
                    <span className="font-semibold tracking-[-0.02em] text-white">
                      Gamma Developers
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          pathname === item.href ||
                          pathname.startsWith(`${item.href}/`)
                        }
                        tooltip={item.label}
                        className="data-active:bg-[#2fe85c]/10 data-active:text-[#2fe85c]"
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                          {item.inProgress ? (
                            <span
                              title="In progress"
                              className="ml-auto size-1.5 rounded-full bg-[#2fe85c]/40 group-data-[collapsible=icon]:hidden"
                            />
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {plannedItems.length ? (
              <SidebarGroup>
                <SidebarGroupLabel>Planned</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {plannedItems.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          type="button"
                          tooltip={`${item.label} — planned`}
                          className="cursor-default text-sidebar-foreground/35 hover:bg-transparent hover:text-sidebar-foreground/35 active:bg-transparent active:text-sidebar-foreground/35"
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ) : null}
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <form action={logout}>
                  <SidebarMenuButton tooltip="Sign out">
                    <LogOut />
                    <span>Sign out</span>
                  </SidebarMenuButton>
                </form>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-w-0 overflow-x-clip text-foreground">
          <header className="sticky top-0 z-30 border-b border-black/6 bg-[#eef0e9]/80 backdrop-blur-xl">
            <div className="flex h-15.5 items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">
              <SidebarTrigger className="-ml-1 text-black/60 hover:text-black" />
              <p className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.025em]">
                {titles[root] ?? "Internal platform"}
              </p>

              <div className="ml-auto flex items-center gap-2">
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

          <div className="min-w-0 px-4 py-6 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:py-8 xl:px-10">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
