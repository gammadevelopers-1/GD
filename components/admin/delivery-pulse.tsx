import { Card, CardContent } from "@/components/ui/card";
import type { DeliveryWeek } from "@/data/dashboard";
import { cn } from "@/lib/utils";

export function DeliveryPulse({ weeks }: { weeks: DeliveryWeek[] }) {
  const quiet = weeks.every((week) => week.done === 0);

  return (
    <Card className="gap-0 border-black/[0.07] bg-[#f8f8f3] py-0 shadow-none">
      <CardContent className="p-5">
        <span className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
          Work closed, last six weeks
        </span>

        {quiet ? (
          <p className="mt-4 text-[12px] text-black/40">
            Nothing has been ticked off in six weeks.
          </p>
        ) : (
          <div className="mt-4 flex items-end gap-2">
            {weeks.map((week) => {
              const height = Math.max(
                6,
                Math.round((week.done / week.total) * 56),
              );
              const now = week.label === "Now";
              return (
                <div
                  key={week.label}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums",
                      now ? "text-[#08743d]" : "text-black/35",
                    )}
                  >
                    {week.done}
                  </span>
                  <div
                    style={{ height: `${height}px` }}
                    className={cn(
                      "w-full rounded-t-[3px]",
                      now ? "bg-[#16a34a]" : "bg-black/15",
                    )}
                  />
                  <span
                    className={cn(
                      "font-mono text-[9px] tracking-[0.08em]",
                      now ? "text-[#08743d]" : "text-black/30",
                    )}
                  >
                    {week.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
