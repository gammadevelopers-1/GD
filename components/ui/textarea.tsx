import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "w-full min-w-0 transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 field-sizing-content min-h-16 rounded-lg border bg-transparent px-2.5 py-1.5 text-base focus-visible:ring-3 aria-invalid:ring-3 md:text-sm",
        admin:
          "rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-sm duration-150 placeholder:text-black/30 hover:border-black/20 focus:border-[#16a34a] focus-visible:ring-2 focus-visible:ring-[#16a34a]/20 aria-invalid:border-red-500/60",
        "admin-sm":
          "rounded-lg border border-black/[0.09] bg-white px-2.5 py-1.5 text-xs duration-150 placeholder:text-black/30 hover:border-black/20 focus:border-[#16a34a] focus-visible:ring-2 focus-visible:ring-[#16a34a]/20 aria-invalid:border-red-500/60",
        bare: "",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Textarea({
  className,
  variant,
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Textarea, textareaVariants };
