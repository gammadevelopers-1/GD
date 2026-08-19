"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
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
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-label={title}
      className={cn(
        "m-auto w-[calc(100vw-2rem)] rounded-[20px] border border-black/[0.08] bg-[#f8f8f3] p-0 text-black shadow-[0_30px_80px_rgba(20,23,26,0.22)] backdrop:bg-black/35",
        size === "lg" ? "max-w-3xl" : "max-w-lg",
      )}
    >
      <div className="flex max-h-[85vh] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-black/[0.07] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-[12px] leading-5 text-black/45">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(ICON_BUTTON, "shrink-0")}
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </dialog>
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
          "rounded-lg px-2 py-1 text-[11px] font-medium text-black/45 transition hover:text-black",
          FOCUS_RING,
        )}
      >
        Cancel
      </button>
    </span>
  );
}
