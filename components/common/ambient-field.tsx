import { cn } from "@/lib/utils";

type AmbientVariant = "mint" | "blue" | "violet" | "warm";

export function AmbientField({
  className,
  variant = "mint",
}: {
  className?: string;
  variant?: AmbientVariant;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        `ambient-field ambient-field-${variant} pointer-events-none absolute inset-0 z-0 overflow-hidden`,
        className,
      )}
    >
      <span className="ambient-grid absolute inset-0" />
      <span className="ambient-orb ambient-orb-one absolute -top-44 left-[8%] size-96 rounded-full" />
      <span className="ambient-orb ambient-orb-two absolute right-[4%] -bottom-56 size-[30rem] rounded-full" />
    </div>
  );
}
