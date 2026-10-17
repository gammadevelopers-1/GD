import { cn } from "@/lib/utils";

type EyebrowProps = React.ComponentProps<"span"> & {
  dot?: boolean;
};

export function Eyebrow({
  dot = true,
  className,
  children,
  ...props
}: EyebrowProps) {
  return (
    <span
      data-slot="eyebrow"
      className={cn(
        "shimmer-label t-eyebrow inline-flex items-center gap-2",
        className,
      )}
      {...props}
    >
      {dot ? (
        <span className="bg-brand size-1.5 rounded-full shadow-[0_0_9px_rgba(47,232,92,0.6)]" />
      ) : null}
      {children}
    </span>
  );
}
