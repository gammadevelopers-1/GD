"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
          "gap-0 overflow-hidden rounded-[20px] border border-black/[0.08] bg-[#f8f8f3] p-0 text-black shadow-[0_30px_80px_rgba(20,23,26,0.22)] ring-0",
          size === "lg"
            ? "w-[min(calc(100vw-2rem),48rem)] max-w-[min(calc(100vw-2rem),48rem)]"
            : "w-[min(calc(100vw-2rem),32rem)] max-w-[min(calc(100vw-2rem),32rem)]",
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
              <Button
                variant="admin-icon"
                size="none"
                type="button"
                aria-label="Close"
                className="shrink-0"
              >
                <X className="size-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-4">
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

  return (
    <>
      <button
        type="button"
        onClick={() => setAsking(true)}
        className={className}
      >
        {label}
      </button>

      <Modal
        open={asking}
        onClose={() => setAsking(false)}
        title={confirmLabel}
      >
        <p className="text-[13px] leading-6 text-black/60">{question}</p>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="admin-secondary"
            size="none"
            type="button"
            onClick={() => setAsking(false)}
            className="h-9 px-3.5 text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="admin-danger"
            size="none"
            type="button"
            disabled={pending}
            autoFocus
            onClick={() => {
              setAsking(false);
              onConfirm();
            }}
            className="h-9 px-3.5 text-xs"
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </Modal>
    </>
  );
}
