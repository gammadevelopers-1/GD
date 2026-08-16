"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Gives every `.spot` child a highlight that follows the pointer.
 *
 * One listener on the container rather than one per card, and the position is
 * written straight to CSS custom properties, so nothing re-renders while the
 * mouse moves.
 */
export function Spotlight({
  as: Tag = "div",
  className,
  children,
}: {
  as?: "div" | "section" | "ul";
  className?: string;
  children: React.ReactNode;
}) {
  const frame = useRef<number | null>(null);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;

    const card = (event.target as HTMLElement).closest<HTMLElement>(".spot");
    if (!card) return;

    const { clientX, clientY } = event;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const box = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${clientX - box.left}px`);
      card.style.setProperty("--spot-y", `${clientY - box.top}px`);
    });
  }, []);

  return (
    <Tag className={cn(className)} onPointerMove={onPointerMove}>
      {children}
    </Tag>
  );
}
