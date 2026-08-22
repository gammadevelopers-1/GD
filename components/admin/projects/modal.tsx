"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FOCUS_RING, ICON_BUTTON } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  title,
  description,
  onClose,
  size = "md",
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  size?: "md" | "lg";
  children: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/35 backdrop-blur-none supports-backdrop-filter:backdrop-blur-none"
        className={cn(
          "w-[calc(100vw-2rem)] gap-0 rounded-[20px] border border-black/[0.08] bg-[#f8f8f3] p-0 text-black shadow-[0_30px_80px_rgba(20,23,26,0.22)] ring-0",
          size === "lg" ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="flex max-h-[85vh] flex-col">
          <DialogHeader className="flex-row items-start justify-between gap-4 space-y-0 border-b border-black/[0.07] px-5 py-4 text-left">
            <div className="min-w-0">
              <DialogTitle className="text-[15px] leading-normal font-semibold tracking-[-0.025em]">
                {title}
              </DialogTitle>
              {description ? (
                <DialogDescription className="mt-1 text-[12px] leading-5 text-black/60">
                  {description}
                </DialogDescription>
              ) : (
                <DialogDescription className="sr-only">
                  {title}
                </DialogDescription>
              )}
            </div>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close"
                className={cn(ICON_BUTTON, "shrink-0")}
              >
                <X className="size-4" />
              </button>
            </DialogClose>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmAction({
  label,
  confirmLabel,
  question,
  pending,
  className,
  onConfirm,
}: {
  label: React.ReactNode;
  confirmLabel: string;
  question: string;
  pending?: boolean;
  className?: string;
  onConfirm: () => void;
}) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className={className}
      >
        {label}
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-[12px] text-black/60">{question}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
        className={cn(
          "rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-60",
          FOCUS_RING,
        )}
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setAsking(false)}
        className={cn(
          "rounded-lg px-2 py-1 text-[11px] font-medium text-black/60 transition hover:text-black",
          FOCUS_RING,
        )}
      >
        Cancel
      </button>
    </span>
  );
}
