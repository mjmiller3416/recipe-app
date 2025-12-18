"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { PlannerEntryResponseDTO } from "@/types/index";
import { SortablePlannerEntry } from "./SortablePlannerEntry";
import { PlannerDropZone } from "./PlannerDropZone";
import { PlannerEmptyState } from "../PlannerEmptyState";

interface SortablePlannerListProps {
  entries: PlannerEntryResponseDTO[];
  onToggleCompletion: (entryId: number) => Promise<void>;
  onRemoveEntry: (entryId: number) => Promise<void>;
  togglingIds: Set<number>;
  removingIds: Set<number>;
  isAtCapacity: boolean;
}

export function SortablePlannerList({
  entries,
  onToggleCompletion,
  onRemoveEntry,
  togglingIds,
  removingIds,
  isAtCapacity,
}: SortablePlannerListProps) {
  const entryIds = entries.map((e) => e.id.toString());

  if (entries.length === 0) {
    return (
      <div className="space-y-3">
        <PlannerEmptyState />
        <PlannerDropZone isAtCapacity={isAtCapacity} />
      </div>
    );
  }

  return (
    <SortableContext items={entryIds} strategy={verticalListSortingStrategy}>
      <div className="space-y-3">
        {entries.map((entry) => (
          <SortablePlannerEntry
            key={entry.id}
            entry={entry}
            onToggleCompletion={onToggleCompletion}
            onRemove={onRemoveEntry}
            isToggling={togglingIds.has(entry.id)}
            isRemoving={removingIds.has(entry.id)}
          />
        ))}
        <PlannerDropZone isAtCapacity={isAtCapacity} />
      </div>
    </SortableContext>
  );
}