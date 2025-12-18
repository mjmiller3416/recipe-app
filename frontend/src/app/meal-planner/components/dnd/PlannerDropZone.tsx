"use client";

import { useDroppable } from "@dnd-kit/core";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlannerDropZoneProps {
  isAtCapacity: boolean;
}

export function PlannerDropZone({ isAtCapacity }: PlannerDropZoneProps) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: "planner-drop-zone",
    disabled: isAtCapacity,
  });

  // Only show as active if dragging a library meal
  const isValidDrag = active?.data?.current?.type === "library-meal";
  const showHighlight = isOver && isValidDrag && !isAtCapacity;

  // Hide when at capacity or when not dragging a library meal
  if (isAtCapacity) {
    return null;
  }

  // Only show when actively dragging a library meal
  if (!active || !isValidDrag) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
        "border-border-subtle text-muted",
        showHighlight && "border-primary bg-primary/10 text-primary scale-[1.02]",
        !isValidDrag && isOver && "border-muted"
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <Download
          className={cn("h-6 w-6", showHighlight && "animate-bounce")}
        />
        <p className="text-sm font-medium">
          {showHighlight ? "Release to add" : "Drop a meal here to add"}
        </p>
      </div>
    </div>
  );
}