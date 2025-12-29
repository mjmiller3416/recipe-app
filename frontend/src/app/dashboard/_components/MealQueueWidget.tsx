"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UtensilsCrossed, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { plannerApi } from "@/lib/api";
import { MealQueueItem } from "./MealQueueItem";
import type { PlannerEntryResponseDTO } from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

const MAX_ACTIVE_ITEMS = 4;
const MAX_COMPLETED_ITEMS = 2;

export function MealQueueWidget() {
  const [activeEntries, setActiveEntries] = useState<PlannerEntryResponseDTO[]>([]);
  const [completedEntries, setCompletedEntries] = useState<PlannerEntryResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch entries on mount
  useEffect(() => {
    async function fetchEntries() {
      try {
        const data = await plannerApi.getEntries();

        // Sort by position and split into active/completed
        const sorted = [...data].sort((a, b) => a.position - b.position);
        const active = sorted
          .filter((e) => !e.is_completed)
          .slice(0, MAX_ACTIVE_ITEMS);
        const completed = sorted
          .filter((e) => e.is_completed)
          .slice(0, MAX_COMPLETED_ITEMS);

        setActiveEntries(active);
        setCompletedEntries(completed);
      } catch (error) {
        console.error("Failed to fetch meal queue:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntries();
  }, []);

  // Handle drag end for reordering (only active entries)
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = activeEntries.findIndex((e) => e.id === active.id);
      const newIndex = activeEntries.findIndex((e) => e.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Optimistic update
      const reorderedEntries = arrayMove(activeEntries, oldIndex, newIndex);
      setActiveEntries(reorderedEntries);

      // Call API
      try {
        await plannerApi.reorderEntries(reorderedEntries.map((e) => e.id));
      } catch (error) {
        console.error("Failed to reorder entries:", error);
        // Rollback on error
        setActiveEntries(activeEntries);
      }
    },
    [activeEntries]
  );

  // Handle marking a meal as cooked
  const handleComplete = useCallback(
    async (entryId: number) => {
      setCompletingId(entryId);

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 300));

      try {
        const updatedEntry = await plannerApi.toggleCompletion(entryId);

        // Move from active to completed
        setActiveEntries((prev) => prev.filter((e) => e.id !== entryId));
        setCompletedEntries((prev) => {
          // Add to start of completed list, limit to MAX_COMPLETED_ITEMS
          const entry = activeEntries.find((e) => e.id === entryId);
          if (entry) {
            const updated = { ...entry, is_completed: true, completed_at: updatedEntry.completed_at };
            return [updated, ...prev].slice(0, MAX_COMPLETED_ITEMS);
          }
          return prev;
        });
      } catch (error) {
        console.error("Failed to complete meal:", error);
      } finally {
        setCompletingId(null);
      }
    },
    [activeEntries]
  );

  const hasEntries = activeEntries.length > 0 || completedEntries.length > 0;

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border border-border shadow-raised p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="h-5 w-5 text-secondary" />
          <h2 className="text-lg font-semibold text-foreground">Meal Queue</h2>
        </div>
        <Link
          href="/meal-planner"
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Meal List */}
      {isLoading ? (
        <div className="flex-1 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasEntries ? (
        <div className="flex-1 flex items-center justify-center text-center text-muted">
          <div>
            <p>No meals in queue</p>
            <p className="text-sm mt-1">Add some meals to get started!</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto space-y-2">
          {/* Active meals with drag-and-drop */}
          {activeEntries.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeEntries.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {activeEntries.map((entry, index) => (
                    <MealQueueItem
                      key={entry.id}
                      entry={entry}
                      isFirst={index === 0}
                      isCompleting={completingId === entry.id}
                      isDraggable={true}
                      onComplete={handleComplete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Completed section */}
          {completedEntries.length > 0 && (
            <>
              {/* Divider */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-medium text-muted uppercase tracking-wider">
                  Completed
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Completed items (not draggable) */}
              <div className="space-y-2">
                {completedEntries.map((entry) => (
                  <MealQueueItem
                    key={entry.id}
                    entry={entry}
                    isFirst={false}
                    isCompleting={false}
                    isDraggable={false}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Meal Footer */}
      <Link href="/meal-planner" className="block mt-4">
        <Button
          variant="outline"
          className="w-full border-dashed border-border hover:border-primary/50 hover:bg-hover text-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </Link>
    </div>
  );
}
