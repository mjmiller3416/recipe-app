"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UtensilsCrossed, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { plannerApi } from "@/lib/api";
import { MealQueueItem } from "./MealQueueItem";
import type { PlannerEntryResponseDTO } from "@/types";
import { cn } from "@/lib/utils";
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

interface MealQueueWidgetProps {
  entries?: PlannerEntryResponseDTO[];
}

export function MealQueueWidget({ entries: initialEntries }: MealQueueWidgetProps) {
  // Filter to active (uncompleted) entries and sort by position
  const getActiveEntries = (entries: PlannerEntryResponseDTO[]) =>
    [...entries].sort((a, b) => a.position - b.position).filter((e) => !e.is_completed);

  const [activeEntries, setActiveEntries] = useState<PlannerEntryResponseDTO[]>(
    initialEntries ? getActiveEntries(initialEntries) : []
  );
  const [isLoading, setIsLoading] = useState(!initialEntries);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync activeEntries when initialEntries prop changes (e.g., after parent fetch completes)
  useEffect(() => {
    if (initialEntries && initialEntries.length > 0) {
      setActiveEntries(getActiveEntries(initialEntries));
    }
  }, [initialEntries]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch active entries from planner
  const fetchActiveEntries = useCallback(async () => {
    try {
      const data = await plannerApi.getEntries();

      // Sort by position and get all active (uncompleted) entries
      const sorted = [...data].sort((a, b) => a.position - b.position);
      const active = sorted.filter((e) => !e.is_completed);

      setActiveEntries(active);
    } catch (error) {
      console.error("Failed to fetch meal queue:", error);
    }
  }, []);

  // Fetch on mount (only if no initial entries) and listen for planner updates
  useEffect(() => {
    if (!initialEntries) {
      fetchActiveEntries().finally(() => setIsLoading(false));
    }

    // Always listen for updates to refetch when planner changes
    window.addEventListener("planner-updated", fetchActiveEntries);
    return () => window.removeEventListener("planner-updated", fetchActiveEntries);
  }, [fetchActiveEntries, initialEntries]);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle drag end for reordering (only active entries)
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setIsDragging(false);
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

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle marking a meal as cooked
  const handleComplete = useCallback(
    async (entryId: number) => {
      setCompletingId(entryId);

      try {
        await plannerApi.toggleCompletion(entryId);

        // Notify other components (Sidebar, CookingStreakWidget, etc.)
        window.dispatchEvent(new Event("planner-updated"));

        // Wait for fade animation, then remove from list
        await new Promise((resolve) => setTimeout(resolve, 300));
        setActiveEntries((prev) => prev.filter((e) => e.id !== entryId));
      } catch (error) {
        console.error("Failed to complete meal:", error);
      } finally {
        setCompletingId(null);
      }
    },
    []
  );

  const hasEntries = activeEntries.length > 0;

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border border-border shadow-raised pt-5 px-5 pb-3 overflow-hidden">
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
        <div className={cn(
          "flex-1 min-h-0 overflow-auto space-y-2",
          isDragging && "scrollbar-hidden"
        )}>
          {/* Meals with drag-and-drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={activeEntries.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {activeEntries.map((entry) => (
                  <MealQueueItem
                    key={entry.id}
                    entry={entry}
                    isCompleting={completingId === entry.id}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Add Meal Footer */}
      <Link href="/meal-planner?create=true" className="block mt-4">
        <Button className="w-full interactive-subtle">
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </Link>
    </div>
  );
}
