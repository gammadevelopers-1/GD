import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "gd-website";

export function OpenAbove() {
  return (
    <TooltipProvider>
      <div className="flex h-40 items-end justify-center p-6">
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <button className="rounded-xl bg-[#15181b] px-4 py-2 text-sm font-semibold text-white">
              Mark complete
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            Week 6 still has 2 unfinished tasks
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export function OpenBelow() {
  return (
    <TooltipProvider>
      <div className="flex h-40 items-start justify-center p-6">
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <span className="rounded-lg border border-black/[0.1] bg-white px-3 py-1.5 text-xs text-black/60">
              Working links
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Copy repository URL
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
