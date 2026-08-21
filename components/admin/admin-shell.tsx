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
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Mark } from "@/components/layout/mark";
import { AccountMenu } from "@/components/admin/account-menu";
import {
  Sidebar,
  SidebarContent,
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
    label: "Team",
    href: "/team",
    icon: UsersRound,
    roles: ["owner"],
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Building2,
    roles: ["owner"],
  },
  {
    label: "CMS",
    href: "/cms",
    icon: FilePenLine,
    roles: ["owner"],
    inProgress: true,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
    roles: ["owner", "member", "finance"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["owner", "member", "finance"],
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

export function AdminShell({
  viewer,
  avatarUrl,
  defaultSidebarOpen,
  children,
}: {
  viewer: Viewer;
  avatarUrl: string | null;
  defaultSidebarOpen: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = navigation.filter((item) => item.roles.includes(viewer.role));
  const plannedItems = plannedNavigation.filter((item) =>
    item.roles.includes(viewer.role),
  );

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={defaultSidebarOpen}
        className="bg-background"
        style={{ "--sidebar-width": "17rem" } as React.CSSProperties}
      >
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
                <SidebarMenu className="gap-1.5">
                  {items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        size="lg"
                        isActive={
                          pathname === item.href ||
                          pathname.startsWith(`${item.href}/`)
                        }
                        tooltip={item.label}
                        className="gap-3 px-3 text-[13.5px] font-medium data-active:bg-[#2fe85c]/10 data-active:font-semibold data-active:text-[#2fe85c] [&_svg]:size-[18px]"
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
                  <SidebarMenu className="gap-1.5">
                    {plannedItems.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          type="button"
                          size="lg"
                          tooltip={`${item.label} — planned`}
                          className="text-sidebar-foreground/30 hover:text-sidebar-foreground/30 active:text-sidebar-foreground/30 cursor-default gap-3 px-3 text-[13.5px] hover:bg-transparent active:bg-transparent [&_svg]:size-[18px]"
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

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="text-foreground min-w-0 overflow-x-clip">
          <header className="sticky top-0 z-30 bg-[#eef0e9]/80 backdrop-blur-xl">
            <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">
              <SidebarTrigger className="-ml-1 text-black/60 hover:text-black" />

              <div className="ml-auto flex items-center gap-2">
                <AccountMenu viewer={viewer} avatarUrl={avatarUrl} />
              </div>
            </div>
          </header>

          <div className="min-w-0 px-4 pt-2 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pt-3 xl:px-10">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
