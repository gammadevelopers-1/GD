import { Eyebrow } from "@/components/common/eyebrow";
import { Reveal } from "@/components/common/reveal";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  body,
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "bg-gd-light-background border-b border-black/[0.08] pt-37 pb-16",
        className,
      )}
    >
      <div className="marketing-container">
        <Reveal className="max-w-[760px]">
          <Eyebrow className="mb-5">{eyebrow}</Eyebrow>
          <h1 className="font-display text-gd-light-headline text-[clamp(34px,5.4vw,60px)] leading-[1.02] font-bold tracking-[-0.045em]">
            {title}
          </h1>
          {body ? (
            <p className="text-gd-light-muted t-lead mt-5">{body}</p>
          ) : null}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
