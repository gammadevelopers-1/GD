import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Button,
} from "gd-website";
import { CircleGauge, FolderKanban, UsersRound } from "lucide-react";

export function FilterPanel() {
  return (
    <Sheet defaultOpen>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Filter projects</SheetTitle>
          <SheetDescription>
            Narrow the portfolio by status and owner.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4">
          {["Discovery", "Building", "Review", "Live", "Retainer"].map(
            (label) => (
              <label
                key={label}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  defaultChecked={label === "Building"}
                  className="size-4 accent-[#16a34a]"
                />
                {label}
              </label>
            ),
          )}
        </div>
        <SheetFooter>
          <Button>Apply filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function MobileNav() {
  return (
    <Sheet defaultOpen>
      <SheetContent side="left" className="bg-sidebar text-sidebar-foreground w-64 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Jump to a section of the workspace.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-1 p-3">
          {[
            { label: "Overview", icon: CircleGauge, active: false },
            { label: "Projects", icon: FolderKanban, active: true },
            { label: "Team", icon: UsersRound, active: false },
          ].map(({ label, icon: Icon, active }) => (
            <span
              key={label}
              className={
                active
                  ? "flex items-center gap-3 rounded-md bg-[#2fe85c]/10 px-3 py-2 text-[13.5px] font-semibold text-[#2fe85c]"
                  : "text-sidebar-foreground/80 flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] font-medium"
              }
            >
              <Icon className="size-[18px]" />
              {label}
            </span>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
