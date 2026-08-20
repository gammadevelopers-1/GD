export function MetaSkeleton({ label }: { label: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5">
      <p className="text-[10px] text-white/28">{label}</p>
      <span className="mt-2 block h-2.5 w-20 animate-pulse rounded bg-white/[0.09]" />
    </div>
  );
}

export function HeroSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6" aria-busy>
        <span className="block h-2.5 w-20 animate-pulse rounded bg-white/[0.07]" />
        <span aria-hidden className="text-white/20">
          /
        </span>
        <span className="block h-3 w-48 animate-pulse rounded bg-white/[0.11]" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-5 sm:px-6" aria-busy>
      <span className="block h-2 w-28 animate-pulse rounded bg-white/[0.09]" />
      <span className="mt-3 block h-7 w-2/3 max-w-sm animate-pulse rounded-lg bg-white/[0.11] sm:h-8" />
      <span className="mt-3 block h-3 w-full max-w-xl animate-pulse rounded bg-white/[0.06]" />

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {["Project lead", "Team", "Due date", "Milestones"].map((label) => (
          <MetaSkeleton key={label} label={label} />
        ))}
      </div>
    </div>
  );
}
