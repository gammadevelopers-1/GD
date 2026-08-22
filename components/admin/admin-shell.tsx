"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CircleGauge,
  FilePenLine,
  FolderKanban,
  LogOut,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Mark } from "@/components/layout/mark";
import { logout } from "@/app/(auth)/login/actions";
import { AccountMenu } from "@/components/admin/account-menu";
import { NotificationBell } from "@/components/admin/notification-bell";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { AppRole, Viewer } from "@/data/auth";
import type { Inbox } from "@/data/notifications";

type NavItem = {
  label: string;
  href: string;
  icon: typeof CircleGauge;
  roles: AppRole[];
  inProgress?: boolean;
};

const workspaceNav: NavItem[] = [
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
];

const accountNav: NavItem[] = [
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

export function AdminShell({
  viewer,
  avatarUrl,
  inbox,
  defaultSidebarOpen,
  children,
}: {
  viewer: Viewer;
  avatarUrl: string | null;
  inbox: Inbox;
  defaultSidebarOpen: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const allowed = (items: NavItem[]) =>
    items.filter((item) => item.roles.includes(viewer.role));

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={defaultSidebarOpen}
        className="bg-background"
        style={{ "--sidebar-width": "17rem" } as React.CSSProperties}
      >
        <Sidebar
          collapsible="icon"
          className="group-data-[collapsible=icon]:[&_[data-sidebar=sidebar]]:overflow-hidden"
        >
          <SidebarHeader className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  tooltip="Gamma Developers"
                  className="group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0!"
                >
                  <Link href="/dashboard">
                    <Mark className="size-8 rounded-[9px] border border-white/10" />
                    <span className="font-semibold tracking-[-0.02em] text-white group-data-[collapsible=icon]:hidden">
                      Gamma Developers
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup className="group-data-[collapsible=icon]:p-1">
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {allowed(workspaceNav).map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="mx-3 my-1 h-px group-data-[collapsible=icon]:mx-1" />

            <SidebarGroup className="pt-0 group-data-[collapsible=icon]:p-1">
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {allowed(accountNav).map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="group-data-[collapsible=icon]:p-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <form action={logout}>
                  <SidebarMenuButton
                    size="lg"
                    tooltip="Sign out"
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground gap-3 px-3 text-[13.5px] font-medium group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0! [&_svg]:size-[18px]"
                  >
                    <LogOut />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Sign out
                    </span>
                  </SidebarMenuButton>
                </form>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="text-foreground min-w-0 overflow-x-clip">
          <header className="sticky top-0 z-30 bg-[#eef0e9]/80 backdrop-blur-xl">
            <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">
              <SidebarTrigger className="-ml-1 text-black/60 hover:text-black" />

              <div className="ml-auto flex items-center gap-2">
                <NotificationBell inbox={inbox} />
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

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        size="lg"
        isActive={
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        }
        tooltip={item.label}
        className="gap-3 px-3 text-[13.5px] font-medium transition-colors duration-150 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0! data-active:bg-[#2fe85c]/10 data-active:font-semibold data-active:text-[#2fe85c] data-active:hover:bg-[#2fe85c]/16 data-active:hover:text-[#2fe85c] [&_svg]:size-[18px]"
      >
        <Link href={item.href}>
          <item.icon />
          <span className="group-data-[collapsible=icon]:hidden">
            {item.label}
          </span>
          {item.inProgress ? (
            <span
              title="In progress"
              className="ml-auto size-1.5 rounded-full bg-[#2fe85c]/40 group-data-[collapsible=icon]:hidden"
            />
          ) : null}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
