"use client";

import type { PlannerEntryResponseDTO } from "@/types/index";
import { SortablePlannerList } from "./dnd/SortablePlannerList";

interface ActivePlannerProps {
  entries: PlannerEntryResponseDTO[];
  onToggleCompletion: (entryId: number) => Promise<void>;
  onRemoveEntry: (entryId: number) => Promise<void>;
  togglingIds: Set<number>;
  removingIds: Set<number>;
  isAtCapacity: boolean;
}

export function ActivePlanner({
  entries,
  onToggleCompletion,
  onRemoveEntry,
  togglingIds,
  removingIds,
  isAtCapacity,
}: ActivePlannerProps) {
  return (
    <SortablePlannerList
      entries={entries}
      onToggleCompletion={onToggleCompletion}
      onRemoveEntry={onRemoveEntry}
      togglingIds={togglingIds}
      removingIds={removingIds}
      isAtCapacity={isAtCapacity}
    />
  );
}