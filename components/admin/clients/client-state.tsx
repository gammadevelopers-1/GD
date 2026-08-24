import type { ClientAccountState } from "@/data/clients";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LABELS: Record<ClientAccountState, string> = {
  active: "Signed in",
  invited: "Invited",
  created: "Not invited",
  archived: "Archived",
};

const TONES: Record<ClientAccountState, string> = {
  active: "border-gd-green-edge/30 bg-gd-green/14 text-gd-green-ink",
  invited: "border-blue-800/25 bg-blue-600/12 text-blue-900",
  created: "border-black/10 bg-black/[0.04] text-black/60",
  archived: "border-amber-700/30 bg-amber-500/20 text-amber-900",
};

export function ClientStateBadge({
  state,
  className,
}: {
  state: ClientAccountState;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-semibold", TONES[state], className)}
    >
      {LABELS[state]}
    </Badge>
  );
}
