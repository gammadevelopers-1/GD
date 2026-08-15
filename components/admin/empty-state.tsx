import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-56 place-items-center rounded-[22px] border border-dashed border-black/10 bg-white/35 px-6 py-10 text-center">
      <div>
        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-black/[0.045]">
          <Icon className="size-[18px] text-black/35" />
        </span>
        <h2 className="mt-4 text-sm font-semibold">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-black/42">
          {description}
        </p>
        {action ? (
          <div className="mt-5 flex justify-center">{action}</div>
        ) : null}
      </div>
    </div>
  );
}
