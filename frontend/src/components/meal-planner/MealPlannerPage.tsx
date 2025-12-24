"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MealSelection } from "./meal-display/MealSelection";
import { WeeklyMenu, MenuListItem } from "./meal-display/WeeklyMenu";
import { plannerApi } from "@/lib/api";
import { PlannerEntryResponseDTO } from "@/types";
import { CreateMealDialog } from "./create-meal-dialog/CreateMealDialog";

export function MealPlannerPage() {
  // State for planner entries (not meals directly)
  const [entries, setEntries] = useState<PlannerEntryResponseDTO[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch planner entries on mount
  useEffect(() => {
    async function fetchEntries() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await plannerApi.getEntries();
        setEntries(data);

        // Auto-select first entry if available
        if (data.length > 0 && selectedEntryId === null) {
          setSelectedEntryId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load planner");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntries();
  }, []);

  // Get the selected entry to derive meal_id for MealSelection
  const selectedEntry = entries.find((e) => e.id === selectedEntryId);
  const selectedMealId = selectedEntry?.meal_id ?? null;

  // Transform entries to MenuListItem format for WeeklyMenu
  const menuItems: MenuListItem[] = entries.map((entry) => ({
    id: entry.id,
    name: entry.meal_name ?? "Untitled Meal",
    imageUrl: entry.main_recipe?.reference_image_path ?? null,
  }));

  // Handle entry selection from WeeklyMenu
  const handleEntrySelect = (item: MenuListItem) => {
    setSelectedEntryId(item.id);
  };

  // Handle Add Meal button click - opens the create meal dialog
  const handleAddMealClick = () => {
    setShowCreateDialog(true);
  };

  // Handle entry created - add to entries list and select it
  const handleEntryCreated = (entry: PlannerEntryResponseDTO) => {
    setEntries((prev) => [...prev, entry]);
    setSelectedEntryId(entry.id);
  };

  // Placeholder handlers for footer buttons
  const handleMarkComplete = () => {
    console.log("Mark Complete clicked - to be implemented");
  };

  const handleEditMeal = () => {
    console.log("Edit Meal clicked - to be implemented");
  };

  const handleRemoveFromMenu = async () => {
    if (selectedEntryId === null) return;

    const previousEntries = entries;
    const entryToRemove = selectedEntryId;

    // Optimistic UI update
    const updatedEntries = entries.filter((e) => e.id !== entryToRemove);
    setEntries(updatedEntries);

    // Select next entry or null
    if (updatedEntries.length > 0) {
      setSelectedEntryId(updatedEntries[0].id);
    } else {
      setSelectedEntryId(null);
    }

    try {
      await plannerApi.removeEntry(entryToRemove);
    } catch (err) {
      // Rollback on error
      setEntries(previousEntries);
      setSelectedEntryId(entryToRemove);
      setError(err instanceof Error ? err.message : "Failed to remove from menu");
    }
  };

  return (
    <PageLayout
      title="Meal Planner"
      description="Plan your weekly meals"
      fillViewport
    >
      {/* GRID CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 h-full min-h-0">

        {/* LEFT COLUMN: SELECTED MEAL */}
        <div className="flex flex-col min-h-0 overflow-hidden">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex-shrink-0">
            Selected Meal
          </h2>

          {selectedMealId !== null ? (
            <>
              {/* Scrollable Area for the meal display */}
              <ScrollArea className="flex-1 -mr-4 pr-4">
                <MealSelection mealId={selectedMealId} />
                <div className="h-4" />
              </ScrollArea>

              {/* Footer - Action Buttons */}
              <div className="flex-shrink-0 pt-6 flex gap-4">
                <Button
                  onClick={handleMarkComplete}
                  size="xl"
                  className="flex-1"
                >
                  Mark Complete
                </Button>
                <Button
                  onClick={handleEditMeal}
                  variant="outline"
                  size="xl"
                  className="flex-1"
                >
                  Edit Meal
                </Button>
                <Button
                  onClick={handleRemoveFromMenu}
                  variant="outline"
                  size="xl"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                >
                  Remove from Menu
                </Button>
              </div>
            </>
          ) : (
            /* Empty state when no meals in planner */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="text-muted-foreground mb-6">
                <p className="text-lg font-medium mb-2">No meals planned yet</p>
                <p className="text-sm">
                  Add a meal to your weekly menu to get started
                </p>
              </div>
              <Button onClick={handleAddMealClick} size="xl">
                + Create Meal
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: WEEKLY MENU */}
        <div className="hidden lg:flex flex-col min-h-0">
          <WeeklyMenu
            items={menuItems}
            selectedId={selectedEntryId}
            onItemClick={handleEntrySelect}
            onAddMealClick={handleAddMealClick}
            className="h-full"
          />
        </div>
      </div>

      {/* Create Meal Dialog */}
      <CreateMealDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onEntryCreated={handleEntryCreated}
      />
    </PageLayout>
  );
}