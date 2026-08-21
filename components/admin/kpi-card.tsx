import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Trend } from "@/data/dashboard";
import { cn } from "@/lib/utils";

const SURFACE: Record<"neutral" | "warning" | "danger" | "money", string> = {
  neutral: "border-black/[0.07] bg-[#f8f8f3]",
  warning: "border-amber-600/20 bg-amber-500/[0.07]",
  danger: "border-red-700/20 bg-red-600/[0.055]",
  money: "border-[#0f7a37]/20 bg-[#16a34a]/[0.06]",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  window: comparisonWindow = "vs last week",
  tone = "neutral",
  note,
  href,
  action,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: Trend;
  window?: string;
  tone?: "neutral" | "warning" | "danger" | "money";
  note?: string;
  href?: string;
  action?: string;
}) {
  const delta =
    trend && (trend.current !== 0 || trend.previous !== 0)
      ? trend.current - trend.previous
      : null;

  const card = (
    <Card
      className={cn(
        "h-full gap-0 py-0 shadow-none",
        SURFACE[tone],
        href &&
          "transition duration-200 group-hover:-translate-y-0.5 group-hover:border-black/[0.14] group-hover:shadow-[0_14px_36px_rgba(20,23,26,0.07)] group-focus-visible:border-[#16a34a]/50",
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
            {label}
          </span>
          {href ? (
            <ArrowRight className="size-3.5 shrink-0 text-black/20 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#08743d]" />
          ) : Icon ? (
            <Icon
              className={cn(
                "size-4 shrink-0",
                tone === "danger"
                  ? "text-red-600/70"
                  : tone === "warning"
                    ? "text-amber-600/70"
                    : tone === "money"
                      ? "text-[#0b5f2c]/60"
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
                : tone === "money"
                  ? "text-[#0b5f2c]"
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

        {href && action ? (
          <p className="mt-2.5 text-[11.5px] font-medium text-[#08743d]">
            {action}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className="group block focus-visible:outline-none">
      {card}
    </Link>
  );
}
