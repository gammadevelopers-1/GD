import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full min-w-0 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-input file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 h-8 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 aria-invalid:ring-3 md:text-sm",
        admin:
          "rounded-xl border border-black/[0.09] bg-white px-3 text-sm transition duration-150 placeholder:text-black/30 hover:border-black/20 focus:border-black/35 focus-visible:ring-0 focus-visible:outline-none",
        "admin-sm":
          "rounded-lg border border-black/[0.09] bg-white px-2.5 text-xs transition duration-150 placeholder:text-black/30 hover:border-black/20 focus:border-black/35 focus-visible:ring-0 focus-visible:outline-none",
        bare: "",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Input({
  className,
  type,
  variant,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Input, inputVariants };
