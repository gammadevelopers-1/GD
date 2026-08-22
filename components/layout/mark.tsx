import { site } from "@/lib/content/site";

export function Mark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`text-brand grid size-[25px] shrink-0 place-items-center rounded-[7px] bg-[#14171a] font-mono text-[10.5px] font-semibold ${className}`}
    >
      
      {site.mark}
    </span>
  );
}
