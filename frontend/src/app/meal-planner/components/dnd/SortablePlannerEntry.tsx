"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { PlannerEntryResponseDTO } from "@/types/index";
import { PlannerEntryCard } from "../PlannerEntryCard";

interface SortablePlannerEntryProps {
  entry: PlannerEntryResponseDTO;
  onToggleCompletion: (entryId: number) => Promise<void>;
  onRemove: (entryId: number) => Promise<void>;
  isToggling?: boolean;
  isRemoving?: boolean;
}

export function SortablePlannerEntry({
  entry,
  onToggleCompletion,
  onRemove,
  isToggling = false,
  isRemoving = false,
}: SortablePlannerEntryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: entry.id.toString(),
    data: {
      type: "planner-entry",
      entry,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "opacity-50 z-50",
        isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg"
      )}
    >
      <PlannerEntryCard
        entry={entry}
        onToggleCompletion={onToggleCompletion}
        onRemove={onRemove}
        isToggling={isToggling}
        isRemoving={isRemoving}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}