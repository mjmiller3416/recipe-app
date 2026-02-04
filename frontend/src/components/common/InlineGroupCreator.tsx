"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FolderOpen, Check, X, Loader2 } from "lucide-react";

interface InlineGroupCreatorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  size?: "sm" | "default";
  maxLength?: number;
}

export function InlineGroupCreator({
  value,
  onChange,
  onSubmit,
  onCancel,
  isPending = false,
  disabled = false,
  placeholder = "Enter group name",
  size = "default",
  maxLength = 255,
}: InlineGroupCreatorProps) {
  const buttonSize = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const inputHeight = size === "sm" ? "h-8" : "h-9";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim() && !disabled && !isPending) {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <Card className="flex items-center gap-2 px-3 py-2">
      <FolderOpen className="size-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled || isPending}
        autoFocus
        className={`${inputHeight} flex-1`}
      />
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="icon"
          variant="ghost"
          className={buttonSize}
          onClick={onSubmit}
          disabled={!value.trim() || disabled || isPending}
          aria-label="Create group"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
          ) : (
            <Check className="size-4" strokeWidth={1.5} />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className={buttonSize}
          onClick={onCancel}
          disabled={isPending}
          aria-label="Cancel"
        >
          <X className="size-4" strokeWidth={1.5} />
        </Button>
      </div>
    </Card>
  );
}
