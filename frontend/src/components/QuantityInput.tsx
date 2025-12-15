"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseQuantity, formatQuantity } from "@/lib/quantityUtils";

interface QuantityInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  className?: string;
}

export function QuantityInput({
  value,
  onChange,
  placeholder = "Qty",
  className,
}: QuantityInputProps) {
  // Track the raw input text separately from the numeric value
  const [inputText, setInputText] = React.useState(() =>
    formatQuantity(value)
  );
  const [isFocused, setIsFocused] = React.useState(false);

  // Sync input text when value changes externally
  React.useEffect(() => {
    if (!isFocused) {
      setInputText(formatQuantity(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setInputText(newText);

    const parsed = parseQuantity(newText);
    onChange(parsed);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format the display on blur if we have a valid value
    if (value !== null) {
      setInputText(formatQuantity(value));
    }
  };

  // Determine what to show in the preview
  const parsed = parseQuantity(inputText);
  const formatted = formatQuantity(parsed);
  const showPreview = isFocused && inputText.trim() !== "";
  const previewText = parsed !== null ? formatted : "?";
  const isInvalid = inputText.trim() !== "" && parsed === null;

  return (
    <div className={cn("relative", className)}>
      <Input
        type="text"
        value={inputText}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          "pr-16",
          isInvalid && "border-destructive focus-visible:border-destructive"
        )}
      />
      {showPreview && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span
            className={cn(
              "text-sm",
              isInvalid ? "text-destructive" : "text-muted-foreground"
            )}
          >
            → {previewText}
          </span>
        </div>
      )}
    </div>
  );
}
