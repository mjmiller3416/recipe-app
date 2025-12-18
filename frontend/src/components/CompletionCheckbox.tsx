"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompletionCheckboxProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
}

export function CompletionCheckbox({
  checked,
  onChange,
  disabled = false,
  className,
}: CompletionCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        "relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200",
        checked
          ? "border-success bg-success"
          : "border-border bg-transparent hover:border-muted",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && !checked && "hover:bg-hover",
        className
      )}
    >
      <Check
        className={cn(
          "h-4 w-4 text-background transition-all duration-200",
          checked
            ? "scale-100 opacity-100"
            : "scale-0 opacity-0"
        )}
        strokeWidth={3}
      />
      {/* Animated ring on check */}
      <span
        className={cn(
          "absolute inset-0 rounded-md ring-2 ring-success/50 transition-all duration-300",
          checked ? "scale-125 opacity-0" : "scale-100 opacity-0"
        )}
      />
    </button>
  );
}