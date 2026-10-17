import {
  Calendar,
  FileText,
  Globe,
  Inbox,
  Lock,
  MessageSquare,
  Phone,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NODES = [
  { x: 14, y: 20, icon: Inbox },
  { x: 37, y: 10, icon: Phone },
  { x: 63, y: 11, icon: Receipt },
  { x: 86, y: 21, icon: Globe },
  { x: 93, y: 47, icon: Wallet },
  { x: 84, y: 76, icon: Calendar },
  { x: 61, y: 89, icon: MessageSquare },
  { x: 36, y: 88, icon: FileText },
  { x: 13, y: 74, icon: Users },
  { x: 7, y: 47, icon: Lock },
] as const;

const HUB = { x: 50, y: 48 };
const HEX = "M12 2 21 7 21 17 12 22 3 17 3 7Z";

export function AiNetwork({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "ai-network pointer-events-none absolute inset-0",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        {NODES.map((node, i) => (
          <line
            key={i}
            x1={HUB.x}
            y1={HUB.y}
            x2={node.x}
            y2={node.y}
            className="ai-network__branch"
          />
        ))}
      </svg>

      {NODES.map((node, i) => (
        <span
          key={i}
          className="ai-network__node"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <svg viewBox="0 0 24 24" className="ai-network__hex">
            <path d={HEX} />
          </svg>
          <node.icon className="relative size-4.5" strokeWidth={1.6} />
        </span>
      ))}

      <span
        className="ai-network__hub"
        style={{ left: `${HUB.x}%`, top: `${HUB.y}%` }}
      >
        <span className="ai-network__ring" />
        <svg viewBox="0 0 24 24" className="ai-network__hex">
          <path d={HEX} />
        </svg>
      </span>
    </div>
  );
}
