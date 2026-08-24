"use client";

import { Toaster as Sonner, toast } from "sonner";
import { TONE_INK } from "@/lib/admin-ui";

function Toaster({ ...props }: React.ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      offset={20}
      duration={5000}
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            "group flex w-full items-start gap-3 rounded-xl border border-black/[0.08] bg-[#f8f8f3] p-3.5 shadow-[0_18px_44px_rgba(20,23,26,0.16)]",
          icon: "mt-px shrink-0 [&>svg]:size-4",
          content: "flex min-w-0 flex-col gap-0.5",
          title:
            "text-[13px] leading-snug font-semibold tracking-[-0.01em] text-black",
          description: "text-[12px] leading-5 text-black/60",
          actionButton:
            "ml-auto shrink-0 rounded-lg bg-[#15181b] px-2.5 py-1 text-xs font-semibold text-white transition duration-200 hover:bg-black",
          cancelButton:
            "shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-black/50 transition duration-150 hover:bg-black/[0.045] hover:text-black",
          closeButton:
            "rounded-lg border-black/10 bg-white text-black/40 transition duration-150 hover:text-black",
          success: TONE_INK.ok,
          error: TONE_INK.danger,
          warning: TONE_INK.warning,
          info: TONE_INK.info,
          loading: TONE_INK.muted,
        },
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
