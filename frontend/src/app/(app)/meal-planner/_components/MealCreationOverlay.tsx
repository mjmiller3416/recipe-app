"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useCreateMeal, useAddToPlanner } from "@/hooks/api";
import { RecipeBrowserView } from "@/components/recipe/RecipeBrowserView";
import { MealPreviewPanel } from "./MealPreviewPanel";
import { SavedView } from "./SavedView";
import { mapCardDtoToCardData } from "@/lib/recipeCardMapper";
import type { RecipeCardData } from "@/types/recipe";
import type { MealSelectionResponseDTO } from "@/types/meal";

interface MealCreationOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MealCreationOverlay({
  open,
  onOpenChange,
}: MealCreationOverlayProps) {
  const router = useRouter();

  const createMealMutation = useCreateMeal();
  const addToPlannerMutation = useAddToPlanner();

  const [pickerMode, setPickerMode] = useState<"main" | "side">("main");
  const [pendingMain, setPendingMain] = useState<RecipeCardData | null>(null);
  const [pendingSides, setPendingSides] = useState<RecipeCardData[]>([]);
  const [isCreatingMeal, setIsCreatingMeal] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<string>("browse");

  const hasPendingMeal = !!pendingMain;

  const resetState = useCallback(() => {
    setPendingMain(null);
    setPendingSides([]);
    setShowDiscardDialog(false);
    setPickerMode("main");
    setRightPanelTab("browse");
  }, []);

  useEffect(() => {
    if (open) resetState();
  }, [open, resetState]);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange]);

  const navigateToPlanner = useCallback(() => {
    router.push("/meal-planner");
    handleClose();
  }, [router, handleClose]);

  // --- Dialog close with discard guard ---

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && hasPendingMeal) {
      setShowDiscardDialog(true);
    } else if (!nextOpen) {
      handleClose();
    }
  };

  // --- Left panel (MealPreviewPanel) handlers ---

  const handleSelectMain = () => {
    setPickerMode("main");
    setRightPanelTab("browse");
  };

  const handleAddSides = () => {
    setPickerMode("side");
    setRightPanelTab("browse");
  };

  const handleRemoveMain = () => {
    setPendingMain(null);
    setPendingSides([]);
    setPickerMode("main");
  };

  const handleRemoveSide = (recipeId: number) => {
    setPendingSides((prev) => prev.filter((s) => Number(s.id) !== recipeId));
  };

  // --- Right panel: Recipe browser handlers ---

  const handleRecipeSelect = (recipe: RecipeCardData) => {
    if (pickerMode === "main") {
      setPendingMain(recipe);
      setPickerMode("side");
    } else {
      setPendingSides((prev) => {
        const isSelected = prev.some((s) => s.id === recipe.id);
        if (isSelected) return prev.filter((s) => s.id !== recipe.id);
        if (prev.length >= 3) return prev;
        return [...prev, recipe];
      });
    }
  };

  // --- Right panel: Saved meals handler ---

  const handleSavedMealSelected = (meal: MealSelectionResponseDTO) => {
    if (meal.main_recipe) {
      setPendingMain(mapCardDtoToCardData(meal.main_recipe));
    }
    setPendingSides(meal.side_recipes.map(mapCardDtoToCardData));
    setRightPanelTab("browse");
    setPickerMode("side");
  };

  // --- Confirm / Save ---

  const handleConfirmMeal = async () => {
    if (!pendingMain) return;

    setIsCreatingMeal(true);
    try {
      const sideRecipeIds = pendingSides.map((r) => Number(r.id));
      const meal = await createMealMutation.mutateAsync({
        meal_name: pendingMain.name,
        main_recipe_id: Number(pendingMain.id),
        side_recipe_ids: sideRecipeIds,
      });
      await addToPlannerMutation.mutateAsync(meal.id);
      navigateToPlanner();
    } catch (err) {
      console.error("Failed to save meal:", err);
      const message = err instanceof Error ? err.message : "Failed to save meal";
      if (message.includes("maximum capacity")) {
        toast.error("Meal queue is full", {
          description: "Remove or clear completed meals to add more.",
        });
      } else {
        toast.error(message);
      }
    } finally {
      setIsCreatingMeal(false);
    }
  };

  // --- Discard ---

  const handleConfirmDiscard = () => {
    setShowDiscardDialog(false);
    handleClose();
  };

  const filterPortalRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const selectedSideIds = new Set<string | number>(pendingSides.map((s) => s.id));

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          size="xl"
          showCloseButton={false}
          className="sm:max-w-[90vw] lg:max-w-6xl h-[85vh] p-0 gap-0 overflow-hidden"
        >
          <DialogTitle className="sr-only">Create a Meal</DialogTitle>
          <DialogDescription className="sr-only">
            Build a meal by selecting a main dish and up to 3 sides
          </DialogDescription>

          <div ref={filterPortalRef} className="flex h-full relative overflow-hidden">
            {/* Left panel — meal preview */}
            <div className="w-80 shrink-0 border-r border-border flex flex-col">
              <div className="px-5 pt-5 pb-3">
                <h2 className="text-lg font-semibold">Add Meal</h2>
                <p className="text-sm text-muted-foreground">
                  Build your perfect meal
                </p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">
                <MealPreviewPanel
                  mainDish={pendingMain}
                  sides={pendingSides}
                  onSelectMain={handleSelectMain}
                  onRemoveMain={handleRemoveMain}
                  onRemoveSide={handleRemoveSide}
                  onAddSides={handleAddSides}
                  onAddToQueue={handleConfirmMeal}
                  isSubmitting={isCreatingMeal}
                  showHeader={false}
                  buttonText="Add to Meal Queue"
                  submittingText="Adding..."
                />
              </div>
            </div>

            {/* Right panel — recipe browser / saved meals */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Tabs
                value={rightPanelTab}
                onValueChange={setRightPanelTab}
                className="flex flex-col h-full"
              >
                <div className="shrink-0 px-4 py-2 flex items-center gap-3">
                  <TabsList>
                    <TabsTrigger value="browse">Browse Recipes</TabsTrigger>
                    <TabsTrigger value="saved">Saved Meals</TabsTrigger>
                  </TabsList>
                  <span className="text-xs text-muted-foreground">
                    {pickerMode === "main"
                      ? "Select a main dish"
                      : `Selecting sides (${pendingSides.length}/3)`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close meal builder"
                    className="ml-auto"
                    onClick={() => handleDialogOpenChange(false)}
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </div>

                <TabsContent
                  value="browse"
                  className="relative flex-1 min-h-0 mt-0"
                  forceMount={rightPanelTab === "browse" ? undefined : true}
                  hidden={rightPanelTab !== "browse"}
                >
                  <div className="absolute inset-0 overflow-y-auto [&_[data-sticky-header]]:top-0 [&_[data-sticky-header]]:md:top-0">
                    <RecipeBrowserView
                      mode="select"
                      onSelect={handleRecipeSelect}
                      selectedIds={
                        pickerMode === "main"
                          ? pendingMain
                            ? new Set([pendingMain.id])
                            : new Set()
                          : selectedSideIds
                      }
                      filterMealType={pickerMode}
                      heroTitle={
                        pickerMode === "main"
                          ? "Select a Main Dish"
                          : "Select Side Dishes"
                      }
                      heroDescription={
                        pickerMode === "main"
                          ? "Choose the main dish for your meal"
                          : "Choose up to 3 side dishes"
                      }
                      filterPortalTarget={filterPortalRef}
                    />
                  </div>
                </TabsContent>

                <TabsContent
                  value="saved"
                  className="relative flex-1 min-h-0 mt-0"
                >
                  <div className="absolute inset-0 overflow-y-auto p-4">
                    <SavedView onMealSelected={handleSavedMealSelected} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discard confirmation */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard meal?</AlertDialogTitle>
            <AlertDialogDescription>
              You have an unsaved meal in progress. Are you sure you want to
              discard it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
