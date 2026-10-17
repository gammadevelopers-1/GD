import { cva } from "class-variance-authority";

import { CountUp } from "@/components/common/count-up";
import { cn } from "@/lib/utils";

const statBlockVariants = cva(
  "flex h-full flex-col rounded-[18px] border p-6.5 transition-colors duration-300",
  {
    variants: {
      tone: {
        light: "border-black/[0.08] bg-surface hover:border-black/20",
        dark: "hover:border-brand/50 border-white/10 bg-white/[0.05]",
      },
    },
    defaultVariants: { tone: "light" },
  },
);

const figureVariants = cva(
  "font-display text-[clamp(44px,4.6vw,62px)] leading-none font-bold tracking-[-0.045em] tabular-nums",
  {
    variants: {
      tone: {
        light: "text-gd-light-headline",
        dark: "text-brand",
      },
    },
    defaultVariants: { tone: "light" },
  },
);

const ink = {
  light: {
    unit: "text-gd-light-muted",
    body: "text-gd-light-muted",
    label: "text-black/40",
    source: "text-black/35",
  },
  dark: {
    unit: "text-gd-dark-muted",
    body: "text-gd-dark-muted",
    label: "text-white/40",
    source: "text-white/35",
  },
} as const;

type StatBlockProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  unit?: string;
  body: string;
  label: string;
  source?: string;
  tone?: "light" | "dark";
  className?: string;
};

export function StatBlock({
  value,
  decimals = 0,
  suffix = "",
  unit,
  body,
  label,
  source,
  tone = "light",
  className,
}: StatBlockProps) {
  const palette = ink[tone];

  return (
    <article
      data-slot="stat-block"
      className={cn(statBlockVariants({ tone }), className)}
    >
      <div className={figureVariants({ tone })}>
        <CountUp value={value} decimals={decimals} suffix={suffix} />
        {unit ? (
          <span
            className={cn("font-body ml-1.5 text-xl font-medium", palette.unit)}
          >
            {unit}
          </span>
        ) : null}
      </div>
      <p className={cn("t-body mt-3.5", palette.body)}>{body}</p>
      <p className={cn("t-eyebrow mt-auto pt-5", palette.label)}>{label}</p>
      {source ? (
        <p
          className={cn(
            "mt-1.5 font-mono text-[10px] tracking-[0.1em]",
            palette.source,
          )}
        >
          {source}
        </p>
      ) : null}
    </article>
  );
}
