"use client";

import { PlannerEntryCard } from "./PlannerEntryCard";
import { PlannerEmptyState } from "./PlannerEmptyState";
import type { PlannerEntryResponseDTO } from "@/types/index";

interface ActivePlannerProps {
  entries: PlannerEntryResponseDTO[];
  onToggleCompletion: (entryId: number) => Promise<void>;
  onRemoveEntry: (entryId: number) => Promise<void>;
  togglingIds: Set<number>;
  removingIds: Set<number>;
}

export function ActivePlanner({
  entries,
  onToggleCompletion,
  onRemoveEntry,
  togglingIds,
  removingIds,
}: ActivePlannerProps) {
  if (entries.length === 0) {
    return <PlannerEmptyState />;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <PlannerEntryCard
          key={entry.id}
          entry={entry}
          onToggleCompletion={onToggleCompletion}
          onRemove={onRemoveEntry}
          isToggling={togglingIds.has(entry.id)}
          isRemoving={removingIds.has(entry.id)}
        />
      ))}
    </div>
  );
}