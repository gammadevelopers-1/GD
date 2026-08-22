import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "gd-website";
import { Filter } from "lucide-react";

export function Closed() {
  return (
    <div className="bg-background flex items-center gap-3 p-10">
      <Popover>
        <PopoverTrigger className="inline-flex h-9 items-center gap-2 rounded-xl border border-black/[0.09] bg-white px-3 text-[12.5px] font-medium text-black/70 transition hover:border-black/20 hover:text-black">
          <Filter className="size-3.5" />
          Filter
        </PopoverTrigger>
      </Popover>
    </div>
  );
}

export function Open() {
  return (
    <div className="bg-background flex items-center gap-3 p-10">
      <Popover defaultOpen>
        <PopoverTrigger className="inline-flex h-9 items-center gap-2 rounded-xl border border-black/[0.09] bg-white px-3 text-[12.5px] font-medium text-black/70 transition hover:border-black/20 hover:text-black">
          <Filter className="size-3.5" />
          Filter
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Filter by status</PopoverTitle>
            <PopoverDescription>
              Show projects matching any of these.
            </PopoverDescription>
          </PopoverHeader>
          <div className="space-y-1.5">
            {["Discovery", "Building", "Review", "Live", "Retainer"].map(
              (label) => (
                <label
                  key={label}
                  className="flex items-center gap-2.5 text-[12.5px] text-black/70"
                >
                  <input
                    type="checkbox"
                    defaultChecked={label === "Building"}
                    className="size-3.5 accent-[#2fe85c]"
                  />
                  {label}
                </label>
              ),
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
