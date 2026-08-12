import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-72 place-items-center rounded-[22px] border border-dashed border-black/10 bg-white/35 px-6 py-12 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-black/[0.045]">
          <Icon className="size-5 text-black/35" />
        </span>
        <h2 className="mt-4 text-sm font-semibold">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-black/42">
          {description}
        </p>
      </div>
    </div>
  );
}
