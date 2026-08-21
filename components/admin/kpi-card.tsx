import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Trend } from "@/data/dashboard";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  window: comparisonWindow = "vs last week",
  tone = "neutral",
  note,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: Trend;
  window?: string;
  tone?: "neutral" | "warning" | "danger";
  note?: string;
}) {
  const delta =
    trend && (trend.current !== 0 || trend.previous !== 0)
      ? trend.current - trend.previous
      : null;

  return (
    <Card className="gap-0 border-black/[0.07] bg-[#f8f8f3] py-0 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
            {label}
          </span>
          {Icon ? (
            <Icon
              className={cn(
                "size-4 shrink-0",
                tone === "danger"
                  ? "text-red-600/70"
                  : tone === "warning"
                    ? "text-amber-600/70"
                    : "text-black/25",
              )}
            />
          ) : null}
        </div>

        <p
          className={cn(
            "font-display mt-3 text-[2rem] leading-none font-semibold tracking-[-0.05em] tabular-nums",
            tone === "danger"
              ? "text-red-700"
              : tone === "warning"
                ? "text-amber-800"
                : "text-[#14171a]",
          )}
        >
          {value}
        </p>

        {delta === null ? (
          note ? (
            <p className="mt-2.5 text-[11.5px] text-black/40">{note}</p>
          ) : null
        ) : (
          <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px]">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-mono font-semibold tabular-nums",
                delta > 0
                  ? "text-[#0b5f2c]"
                  : delta < 0
                    ? "text-red-700"
                    : "text-black/40",
              )}
            >
              {delta > 0 ? (
                <ArrowUpRight className="size-3" />
              ) : delta < 0 ? (
                <ArrowDownRight className="size-3" />
              ) : (
                <Minus className="size-3" />
              )}
              {delta > 0 ? "+" : ""}
              {delta}
            </span>
            <span className="text-black/40">{comparisonWindow}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
