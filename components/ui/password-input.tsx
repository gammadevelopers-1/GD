"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

function PasswordInput({
  className,
  toggleClassName,
  disabled,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  toggleClassName?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <span data-slot="password-input" className="relative block">
      <input
        {...props}
        type={visible ? "text" : "password"}
        data-slot="input"
        disabled={disabled}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setVisible((shown) => !shown)}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        className={cn(
          "absolute inset-y-0 right-0 grid w-10 cursor-pointer place-items-center rounded-r-xl text-black/35 transition-colors duration-150 hover:text-black focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
          toggleClassName,
        )}
      >
        <Icon className="size-4" />
      </button>
    </span>
  );
}

export { PasswordInput };
