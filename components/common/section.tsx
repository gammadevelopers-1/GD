import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const sectionVariants = cva("marketing-section relative isolate", {
  variants: {
    tone: {
      light:
        "[--section-line:rgba(20,23,26,0.08)] bg-gd-light-background text-gd-light-headline",
      surface:
        "[--section-line:rgba(20,23,26,0.08)] bg-surface text-gd-light-headline",
      dark: "dark-heading [--section-line:rgba(255,255,255,0.08)] bg-gd-dark-background text-gd-dark-headline",
      backdrop:
        "dark-heading [--section-line:rgba(255,255,255,0.08)] bg-backdrop-dark text-gd-dark-headline",
    },
    divide: {
      none: "",
      top: "border-t border-[var(--section-line)]",
      bottom: "border-b border-[var(--section-line)]",
      both: "border-y border-[var(--section-line)]",
    },
  },
  defaultVariants: {
    tone: "light",
    divide: "none",
  },
});

type SectionProps = React.ComponentProps<"section"> &
  VariantProps<typeof sectionVariants> & {
    bleed?: boolean;
    containerClassName?: string;
  };

export function Section({
  tone,
  divide,
  bleed = false,
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      data-slot="section"
      data-tone={tone ?? "light"}
      className={cn(sectionVariants({ tone, divide }), className)}
      {...props}
    >
      {bleed ? (
        children
      ) : (
        <div
          className={cn("marketing-container relative z-1", containerClassName)}
        >
          {children}
        </div>
      )}
    </section>
  );
}

export { sectionVariants };
