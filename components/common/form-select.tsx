"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMPTY_VALUE = "__form_select_empty__";

export type FormSelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export function FormSelect({
  name,
  value,
  defaultValue = "",
  onValueChange,
  options,
  disabled,
  required,
  id,
  ariaLabel,
  ariaInvalid,
  triggerSize = "default",
  triggerClassName,
  contentClassName,
  itemClassName,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: FormSelectOption[];
  disabled?: boolean;
  required?: boolean;
  id?: string;
  ariaLabel?: string;
  ariaInvalid?: boolean;
  triggerSize?: "sm" | "default";
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const hiddenInputRef = React.useRef<HTMLInputElement>(null);
  const controlled = value !== undefined;
  const selectedValue = controlled ? value : internalValue;

  React.useEffect(() => {
    if (controlled) return;
    const form = triggerRef.current?.closest("form");
    if (!form) return;
    const reset = () => setInternalValue(defaultValue);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [controlled, defaultValue]);

  function change(nextValue: string) {
    const decoded = nextValue === EMPTY_VALUE ? "" : nextValue;
    if (hiddenInputRef.current) hiddenInputRef.current.value = decoded;
    if (!controlled) setInternalValue(decoded);
    onValueChange?.(decoded);
  }

  return (
    <>
      {name ? (
        <input
          ref={hiddenInputRef}
          type="hidden"
          name={name}
          value={selectedValue}
          disabled={disabled}
          readOnly
        />
      ) : null}
      <Select
        value={selectedValue === "" ? EMPTY_VALUE : selectedValue}
        onValueChange={change}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          ref={triggerRef}
          id={id}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          aria-required={required}
          size={triggerSize}
          className={triggerClassName}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            "z-[80] max-h-72 min-w-(--radix-select-trigger-width) rounded-xl border border-black/[0.08] bg-white/95 p-1.5 shadow-[0_18px_50px_rgba(20,23,26,0.16)] backdrop-blur-xl",
            contentClassName,
          )}
        >
          {options.map((option, index) => (
            <SelectItem
              key={`${option.value}-${index}`}
              value={option.value === "" ? EMPTY_VALUE : option.value}
              disabled={option.disabled}
              className={cn(
                "min-h-9 cursor-pointer rounded-lg px-3 py-2 pr-9 text-[13px] focus:bg-[#eef0e9] data-[state=checked]:font-semibold",
                itemClassName,
              )}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
