"use client";

import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragHandleProps {
  listeners?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
  isDragging?: boolean;
  className?: string;
}

export function DragHandle({
  listeners,
  attributes,
  isDragging,
  className,
}: DragHandleProps) {
  return (
    <button
      type="button"
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center justify-center",
        "w-8 h-full min-h-[40px]",
        "text-muted hover:text-foreground",
        "cursor-grab active:cursor-grabbing",
        "rounded-l-lg",
        "hover:bg-hover/50",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
        "touch-none select-none",
        "transition-colors",
        isDragging && "cursor-grabbing text-primary",
        className
      )}
      aria-label="Drag to reorder"
    >
      <GripVertical className="h-5 w-5" />
    </button>
  );
}