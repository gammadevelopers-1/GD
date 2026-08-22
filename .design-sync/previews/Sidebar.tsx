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
  SidebarTrigger,
  TooltipProvider,
} from "gd-website";
import {
  Building2,
  CircleGauge,
  FolderKanban,
  LogOut,
  UsersRound,
} from "lucide-react";

const navigation = [
  { label: "Overview", icon: CircleGauge, active: false },
  { label: "Projects", icon: FolderKanban, active: true },
  { label: "Team", icon: UsersRound, active: false },
  { label: "Clients", icon: Building2, active: false },
];

export function Expanded() {
  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen
        style={{ "--sidebar-width": "17rem" } as React.CSSProperties}
      >
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" tooltip="Gamma Developers">
                  <span className="size-8 shrink-0 rounded-[9px] border border-white/10 bg-[#2fe85c]/15" />
                  <span className="font-semibold tracking-[-0.02em] text-white">
                    Gamma Developers
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {navigation.map(({ label, icon: Icon, active }) => (
                    <SidebarMenuItem key={label}>
                      <SidebarMenuButton
                        size="lg"
                        isActive={active}
                        tooltip={label}
                        className="gap-3 px-3 text-[13.5px] font-medium data-active:bg-[#2fe85c]/10 data-active:font-semibold data-active:text-[#2fe85c] [&_svg]:size-[18px]"
                      >
                        <Icon />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Sign out"
                  className="text-sidebar-foreground/70 gap-3 px-3 text-[13.5px] font-medium [&_svg]:size-[18px]"
                >
                  <LogOut />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex h-14 items-center gap-3 border-b border-black/[0.06] px-4">
            <SidebarTrigger className="-ml-1 text-black/60" />
            <p className="text-[13px] font-medium text-black/60">
              Northwind Logistics
            </p>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

export function CollapsedIcon() {
  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={false}
        style={{ "--sidebar-width": "17rem" } as React.CSSProperties}
      >
        <Sidebar collapsible="icon">
          <SidebarHeader className="items-center p-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Gamma Developers"
                  className="mx-auto justify-center px-0!"
                >
                  <span className="size-8 shrink-0 rounded-[9px] border border-white/10 bg-[#2fe85c]/15" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup className="p-1">
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {navigation.map(({ label, icon: Icon, active }) => (
                    <SidebarMenuItem key={label}>
                      <SidebarMenuButton
                        size="lg"
                        isActive={active}
                        tooltip={label}
                        className="mx-auto justify-center gap-0 px-0! data-active:bg-[#2fe85c]/10 data-active:text-[#2fe85c] [&_svg]:size-[18px]"
                      >
                        <Icon />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex h-14 items-center gap-3 border-b border-black/[0.06] px-4">
            <SidebarTrigger className="-ml-1 text-black/60" />
            <p className="text-[13px] font-medium text-black/60">
              Northwind Logistics
            </p>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
