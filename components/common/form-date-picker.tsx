"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    return undefined;
  }
  return date;
}

function serialiseDate(date: Date | undefined) {
  if (!date) return "";
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function FormDatePicker({
  name,
  value,
  defaultValue = "",
  onValueChange,
  required,
  disabled,
  id,
  ariaLabel,
  ariaInvalid,
  triggerClassName,
  contentClassName,
  placeholder = "mm/dd/yyyy",
}: {
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  ariaInvalid?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
  placeholder?: string;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const hiddenInputRef = React.useRef<HTMLInputElement>(null);
  const controlled = value !== undefined;
  const selectedValue = controlled ? value : internalValue;
  const selectedDate = parseDate(selectedValue);

  React.useEffect(() => {
    if (controlled) return;
    const form = triggerRef.current?.closest("form");
    if (!form) return;
    const reset = () => setInternalValue(defaultValue);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [controlled, defaultValue]);

  function change(date: Date | undefined) {
    const nextValue = serialiseDate(date);
    if (hiddenInputRef.current) hiddenInputRef.current.value = nextValue;
    if (!controlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
  }

  return (
    <>
      <input
        ref={hiddenInputRef}
        type="hidden"
        name={name}
        value={selectedValue}
        disabled={disabled}
        readOnly
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            aria-required={required}
            data-empty={!selectedDate}
            className={cn(
              "justify-start text-left font-normal data-[empty=true]:text-black/35",
              triggerClassName,
            )}
          >
            <span>
              {selectedDate ? format(selectedDate, "MM/dd/yyyy") : placeholder}
            </span>
            <CalendarDays className="ml-auto size-4 shrink-0 opacity-45" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn("z-[70] w-auto p-0", contentClassName)}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={change}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
