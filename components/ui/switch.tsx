"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch focus-visible:border-ring focus-visible:ring-ring/50 data-[state=unchecked]:bg-input data-[state=checked]:bg-gd-green relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent p-0.5 transition-colors duration-200 outline-none focus-visible:ring-3 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-[size=default]:h-6 data-[size=default]:w-11 data-[size=sm]:h-5 data-[size=sm]:w-9",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-background pointer-events-none block rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] ring-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
