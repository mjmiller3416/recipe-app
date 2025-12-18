"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, Loader2, Heart, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecipeSelector } from "./RecipeSelector";
import { SideRecipeSlots } from "./SideRecipeSlots";
import { TagInput } from "./TagInput";
import { DeleteMealDialog } from "./DeleteMealDialog";
import { recipeApi, plannerApi } from "@/lib/api";
import type {
  MealSelectionResponseDTO,
  MealSelectionCreateDTO,
  MealSelectionUpdateDTO,
  RecipeCardDTO,
} from "@/types/index";

// ============================================================================
// Types
// ============================================================================

type ModalMode = "create" | "edit";

interface MealFormModalProps {
  mode: ModalMode;
  meal?: MealSelectionResponseDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (meal: MealSelectionResponseDTO, addedToPlanner?: boolean) => void;
  onDelete?: (mealId: number) => void;
  existingTags?: string[];
}

interface FormState {
  meal_name: string;
  main_recipe_id: number | null;
  side_recipe_ids: number[];
  is_favorite: boolean;
  tags: string[];
}

interface FormErrors {
  meal_name?: string;
  main_recipe_id?: string;
  side_recipe_ids?: string;
  general?: string;
}

// ============================================================================
// Component
// ============================================================================

export function MealFormModal({
  mode,
  meal,
  open,
  onOpenChange,
  onSuccess,
  onDelete,
  existingTags = [],
}: MealFormModalProps) {
  // Recipes state
  const [recipes, setRecipes] = useState<RecipeCardDTO[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  
  // Form state
  const [formState, setFormState] = useState<FormState>({
    meal_name: "",
    main_recipe_id: null,
    side_recipe_ids: [],
    is_favorite: false,
    tags: [],
  });
  
  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch recipes when modal opens
  useEffect(() => {
    if (open) {
      let cancelled = false;

      const fetchRecipes = async () => {
        setIsLoadingRecipes(true);
        try {
          const data = await recipeApi.listCards();
          if (!cancelled) {
            setRecipes(data);
          }
        } catch (err) {
          if (!cancelled) {
            console.error("Failed to fetch recipes:", err);
            setErrors((prev) => ({
              ...prev,
              general: "Failed to load recipes. Please try again.",
            }));
          }
        } finally {
          if (!cancelled) {
            setIsLoadingRecipes(false);
          }
        }
      };
      fetchRecipes();

      return () => {
        cancelled = true;
      };
    }
  }, [open]);

  // Initialize/reset form when modal opens or meal changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && meal) {
        setFormState({
          meal_name: meal.meal_name,
          main_recipe_id: meal.main_recipe_id,
          side_recipe_ids: meal.side_recipe_ids || [],
          is_favorite: meal.is_favorite,
          tags: meal.tags || [],
        });
      } else {
        setFormState({
          meal_name: "",
          main_recipe_id: null,
          side_recipe_ids: [],
          is_favorite: false,
          tags: [],
        });
      }
      setErrors({});
    }
  }, [open, mode, meal]);

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Meal name validation
    const trimmedName = formState.meal_name.trim();
    if (!trimmedName) {
      newErrors.meal_name = "Meal name is required";
    } else if (trimmedName.length > 255) {
      newErrors.meal_name = "Meal name must be 255 characters or less";
    }

    // Main recipe validation
    if (!formState.main_recipe_id) {
      newErrors.main_recipe_id = "Main recipe is required";
    }

    // Side recipes validation
    if (formState.side_recipe_ids.length > 3) {
      newErrors.side_recipe_ids = "Maximum 3 side recipes allowed";
    }
    
    // Check for duplicates in sides
    const uniqueSides = new Set(formState.side_recipe_ids);
    if (uniqueSides.size !== formState.side_recipe_ids.length) {
      newErrors.side_recipe_ids = "Duplicate side recipes are not allowed";
    }
    
    // Check if main recipe is in sides
    if (
      formState.main_recipe_id &&
      formState.side_recipe_ids.includes(formState.main_recipe_id)
    ) {
      newErrors.side_recipe_ids =
        "Main recipe cannot be added as a side recipe";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (addToPlanner: boolean = false) => {
      if (!validate()) return;

      setIsSubmitting(true);
      setErrors({});

      try {
        let result: MealSelectionResponseDTO;

        if (mode === "create") {
          const createData: MealSelectionCreateDTO = {
            meal_name: formState.meal_name.trim(),
            main_recipe_id: formState.main_recipe_id!,
            side_recipe_ids: formState.side_recipe_ids,
            is_favorite: formState.is_favorite,
            tags: formState.tags,
          };
          result = await plannerApi.createMeal(createData);

          // Add to planner if requested
          if (addToPlanner) {
            try {
              await plannerApi.addMeal(result.id);
            } catch (err) {
              console.error("Failed to add meal to planner:", err);
              // Don't fail the whole operation, meal was created successfully
            }
          }
        } else {
          const updateData: MealSelectionUpdateDTO = {
            meal_name: formState.meal_name.trim(),
            main_recipe_id: formState.main_recipe_id!,
            side_recipe_ids: formState.side_recipe_ids,
            is_favorite: formState.is_favorite,
            tags: formState.tags,
          };
          result = await plannerApi.updateMeal(meal!.id, updateData);
        }

        onSuccess(result, addToPlanner);
        onOpenChange(false);
      } catch (err) {
        console.error("Failed to save meal:", err);
        setErrors({
          general:
            err instanceof Error
              ? err.message
              : "Failed to save meal. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, meal, formState, validate, onSuccess, onOpenChange]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!meal || !onDelete) return;

    setIsDeleting(true);
    try {
      await plannerApi.deleteMeal(meal.id);
      onDelete(meal.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to delete meal:", err);
      setErrors({
        general:
          err instanceof Error
            ? err.message
            : "Failed to delete meal. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [meal, onDelete, onOpenChange]);

  // Update form field
  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Modal title based on mode
  const title = mode === "create" ? "Create New Meal" : "Edit Meal";
  const description =
    mode === "create"
      ? "Add a new meal to your library"
      : "Update meal details";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* General error */}
            {errors.general && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
                <AlertCircle className="h-4 w-4 text-error shrink-0" />
                <p className="text-sm text-error">{errors.general}</p>
              </div>
            )}

            {/* Meal Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="meal-name"
                className="text-sm font-medium text-foreground"
              >
                Meal Name <span className="text-error">*</span>
              </label>
              <Input
                id="meal-name"
                value={formState.meal_name}
                onChange={(e) => updateField("meal_name", e.target.value)}
                placeholder="e.g., Taco Tuesday"
                disabled={isSubmitting}
                className={cn(
                  "bg-input border-border",
                  errors.meal_name && "border-error focus-visible:ring-error/20"
                )}
              />
              {errors.meal_name && (
                <p className="text-xs text-error flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.meal_name}
                </p>
              )}
            </div>

            {/* Main Recipe */}
            <RecipeSelector
              recipes={recipes}
              selectedRecipeId={formState.main_recipe_id}
              onSelect={(id) => updateField("main_recipe_id", id)}
              label={
                <>
                  Main Recipe <span className="text-error">*</span>
                </>
              }
              placeholder="Select main recipe..."
              isLoading={isLoadingRecipes}
              disabled={isSubmitting}
              error={errors.main_recipe_id}
            />

            {/* Side Recipes */}
            <SideRecipeSlots
              recipes={recipes}
              sideRecipeIds={formState.side_recipe_ids}
              mainRecipeId={formState.main_recipe_id}
              onSideRecipesChange={(ids) => updateField("side_recipe_ids", ids)}
              isLoading={isLoadingRecipes}
              disabled={isSubmitting}
              error={errors.side_recipe_ids}
            />

            {/* Tags */}
            <TagInput
              tags={formState.tags}
              onTagsChange={(tags) => updateField("tags", tags)}
              existingTags={existingTags}
              disabled={isSubmitting}
            />

            {/* Favorite checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-favorite"
                checked={formState.is_favorite}
                onCheckedChange={(checked) =>
                  updateField("is_favorite", checked === true)
                }
                disabled={isSubmitting}
              />
              <label
                htmlFor="is-favorite"
                className="text-sm text-foreground cursor-pointer flex items-center gap-1.5"
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    formState.is_favorite && "fill-error text-error"
                  )}
                />
                Mark as favorite
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {/* Delete button (edit mode only) */}
            {mode === "edit" && onDelete && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isSubmitting}
                className="text-error hover:text-error hover:bg-error/10 mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}

            {/* Cancel button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            {/* Submit button(s) */}
            {mode === "create" ? (
              // Create mode: Split button with dropdown
              <div className="flex">
                <Button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="rounded-r-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      className="rounded-l-none border-l border-primary-foreground/20 px-2"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSubmit(true)}>
                      Create & Add to Planner
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // Edit mode: Single save button
              <Button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      {mode === "edit" && meal && (
        <DeleteMealDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          mealName={meal.meal_name}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}