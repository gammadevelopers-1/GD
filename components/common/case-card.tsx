import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type CaseCardData = {
  slug: string;
  sector: string;
  title: string;
  body: string;
  tags: readonly string[];
  image: string;
};

type CaseCardProps = {
  item: CaseCardData;
  className?: string;
};

export function CaseCard({ item, className }: CaseCardProps) {
  return (
    <Link
      href={`/work/${item.slug}`}
      data-slot="case-card"
      className={cn(
        "border-border bg-surface focus-visible:ring-ring group/case flex h-full flex-col overflow-hidden rounded-[20px] border transition-colors duration-300 hover:border-black/25 focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-black/5">
        <Image
          src={item.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover/case:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-6.5">
        <span className="font-mono text-[10.5px] tracking-[0.14em] text-black/40 uppercase">
          {item.sector}
        </span>
        <h3 className="font-display text-gd-light-headline mt-3 text-xl leading-[1.2] font-semibold tracking-[-0.025em]">
          {item.title}
        </h3>
        <p className="text-gd-light-muted mt-2.5 text-[14px] leading-[1.55]">
          {item.body}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-black/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] text-black/45 uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
