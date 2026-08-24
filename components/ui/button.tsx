import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        "admin-primary":
          "gap-2 rounded-xl bg-gd-panel-dark px-4 text-sm font-semibold text-white hover:bg-black hover:shadow-[0_10px_24px_rgba(20,23,26,0.18)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-gd-green/40 focus-visible:outline-none",
        "admin-secondary":
          "gap-2 rounded-xl border border-black/[0.1] bg-white px-4 text-sm font-medium text-black/65 hover:border-black/25 hover:text-black active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-gd-green/40 focus-visible:outline-none",
        "admin-ghost":
          "gap-1.5 rounded-lg px-2.5 text-xs font-medium text-black/45 hover:bg-black/[0.045] hover:text-black active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-gd-green/40 focus-visible:outline-none",
        "admin-danger":
          "gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700 hover:shadow-[0_8px_20px_rgba(220,38,38,0.25)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-gd-green/40 focus-visible:outline-none",
        "admin-icon":
          "size-7 rounded-lg text-black/35 hover:bg-black/[0.05] hover:text-black active:scale-95 focus-visible:ring-2 focus-visible:ring-gd-green/40 focus-visible:outline-none",
        "admin-icon-danger":
          "size-7 rounded-lg text-black/35 hover:bg-red-50 hover:text-red-700 active:scale-95 focus-visible:ring-2 focus-visible:ring-gd-green/40 focus-visible:outline-none",
        bare: "",
        "admin-dashed":
          "w-full gap-2 rounded-[20px] border border-dashed border-black/12 bg-white/40 px-4 py-4 text-xs font-semibold text-black/50 hover:border-brand/60 hover:bg-brand/[0.06] hover:text-gd-green-deep active:scale-[0.995] focus-visible:ring-2 focus-visible:ring-gd-green/40 focus-visible:outline-none",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
