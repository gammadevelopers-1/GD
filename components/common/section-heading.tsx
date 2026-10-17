import { Eyebrow } from "@/components/common/eyebrow";
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
      <Eyebrow className="mb-5">{eyebrow}</Eyebrow>
      <h2 className="font-display t-h2">{title}</h2>
    </div>
  );
}
