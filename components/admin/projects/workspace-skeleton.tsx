export function WorkspaceSkeleton() {
  return (
    <div
      aria-busy
      className="flex min-h-0 flex-1 flex-col border-y border-black/[0.07] bg-white"
    >
      <div className="shrink-0 border-b border-black/[0.07] bg-[#f8f8f3] px-3 py-2 sm:px-4">
        <span className="block h-2.5 w-14 animate-pulse rounded bg-black/[0.07]" />
        <div className="mt-2.5 flex gap-1.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className="h-7 w-24 shrink-0 animate-pulse rounded-lg bg-black/[0.05]"
            />
          ))}
        </div>
      </div>
      <div className="h-11 shrink-0 border-b border-black/[0.07] bg-[#f8f8f3]" />
      <div className="mx-auto w-full max-w-[78ch] flex-1 space-y-4 px-6 py-10">
        <div className="h-7 w-2/5 animate-pulse rounded bg-black/[0.06]" />
        <div className="h-4 w-full animate-pulse rounded bg-black/[0.04]" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-black/[0.04]" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-black/[0.04]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-black/[0.04]" />
      </div>
    </div>
  );
}
