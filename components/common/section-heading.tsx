import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-[620px]", className)}>
      <span className="text-muted-foreground mb-5 inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase">
        <span className="bg-brand size-1.5 rounded-full shadow-[0_0_9px_rgba(47,232,92,0.6)]" />
        {eyebrow}
      </span>
      <h2 className="text-3xl leading-[1.06] font-medium tracking-[-0.03em] md:text-5xl">
        {title}
      </h2>
    </div>
  );
}
