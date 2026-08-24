"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { FOCUS_RING, FOCUS_RING_DARK } from "@/lib/admin-ui";
import { Input } from "@/components/ui/input";

const passwordToggleVariants = cva(
  "absolute inset-y-0 right-0 grid cursor-pointer place-items-center transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      tone: {
        light: `text-black/40 hover:text-black ${FOCUS_RING}`,
        dark: `text-white/45 hover:text-white ${FOCUS_RING_DARK}`,
      },
      toggleSize: {
        default: "w-10 rounded-r-xl [&_svg]:size-4",
        sm: "w-8 rounded-r-lg [&_svg]:size-3.5",
      },
    },
    defaultVariants: { tone: "light", toggleSize: "default" },
  },
);

type PasswordInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "children"
> &
  VariantProps<typeof passwordToggleVariants> & {
    toggleClassName?: string;
    /**
     * Leave unset for a field that owns its own reveal. Pass both to let a
     * parent hold the state, which is how a list keeps one row revealed at a
     * time instead of leaving a trail of exposed secrets behind the cursor.
     */
    visible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
    /** The noun in the toggle's label: "Show password", "Show value". */
    revealNoun?: string;
  };

function PasswordInput({
  className,
  toggleClassName,
  disabled,
  tone,
  toggleSize,
  variant = "bare",
  visible,
  onVisibleChange,
  revealNoun = "password",
  ...props
}: PasswordInputProps) {
  const [ownVisible, setOwnVisible] = React.useState(false);
  const controlled = visible !== undefined;
  const shown = controlled ? visible : ownVisible;
  const Icon = shown ? EyeOff : Eye;

  return (
    <span data-slot="password-input" className="relative block">
      <Input
        variant={variant}
        {...props}
        type={shown ? "text" : "password"}
        data-slot="input"
        disabled={disabled}
        // Last, not first: the gutter the toggle sits in is not the caller's
        // to reclaim, and a caller's own `px-*` would otherwise merge over it
        // and let the text run under the icon.
        className={cn(className, toggleSize === "sm" ? "pr-8" : "pr-11")}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!controlled) setOwnVisible((was) => !was);
          onVisibleChange?.(!shown);
        }}
        aria-pressed={shown}
        aria-label={`${shown ? "Hide" : "Show"} ${revealNoun}`}
        className={cn(
          passwordToggleVariants({ tone, toggleSize }),
          toggleClassName,
        )}
      >
        <Icon />
      </button>
    </span>
  );
}

export { PasswordInput, passwordToggleVariants };
