"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ChefHat,
  GripVertical,
  Clock,
  Users,
  Search,
  Sparkles,
  UtensilsCrossed,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderActions,
} from "@/components/layout/PageHeader";
import { StatsCard } from "@/components/common/StatsCard";
import { plannerApi, recipeApi, shoppingApi } from "@/lib/api";
import type { MealSelectionCreateDTO, MealSelectionUpdateDTO, ManualItemCreateDTO } from "@/lib/api";
import { INGREDIENT_UNITS } from "@/lib/constants";
import type { MealSelectionResponseDTO, RecipeCardDTO, RecipeCardData } from "@/types";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface Meal extends MealSelectionResponseDTO {
  // Extended type for local state management
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTime(minutes: number | null): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getMealRecipeCount(meal: Meal): number {
  let count = 0;
  if (meal.main_recipe) count++;
  if (meal.side_recipe_1) count++;
  if (meal.side_recipe_2) count++;
  if (meal.side_recipe_3) count++;
  return count;
}

function getTotalTime(meal: Meal): number {
  let total = 0;
  if (meal.main_recipe?.total_time) total += meal.main_recipe.total_time;
  if (meal.side_recipe_1?.total_time) total += meal.side_recipe_1.total_time;
  if (meal.side_recipe_2?.total_time) total += meal.side_recipe_2.total_time;
  if (meal.side_recipe_3?.total_time) total += meal.side_recipe_3.total_time;
  return total;
}

// Convert RecipeCardDTO to RecipeCardData for RecipeCard component
function recipeCardDTOToData(dto: RecipeCardDTO | null): RecipeCardData | null {
  if (!dto) return null;
  return {
    id: dto.id,
    name: dto.recipe_name,
    servings: dto.servings ?? 0,
    totalTime: dto.total_time ?? 0,
    imageUrl: dto.reference_image_path ?? undefined,
    isFavorite: dto.is_favorite,
  };
}

// ============================================================================
// MEAL LIST ITEM COMPONENT
// ============================================================================

interface MealListItemProps {
  meal: Meal;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

function MealListItem({
  meal,
  isSelected,
  onSelect,
  onDelete,
  onRename,
  isDragging,
  dragHandleProps,
}: MealListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(meal.meal_name);

  // Sync editName when meal.meal_name changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditName(meal.meal_name);
    }
  }, [meal.meal_name, isEditing]);

  const handleSaveRename = () => {
    if (editName.trim()) {
      onRename(editName.trim());
      setIsEditing(false);
    }
  };

  const handleCancelRename = () => {
    setEditName(meal.meal_name);
    setIsEditing(false);
  };

  const recipeCount = getMealRecipeCount(meal);

  return (
    <div
      className={cn(
        "group relative rounded-xl transition-all duration-200 cursor-pointer",
        "border border-transparent",
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5"
          : "bg-elevated hover:bg-hover hover:border-border",
        isDragging && "opacity-50 scale-[1.02] shadow-xl"
      )}
      onClick={!isEditing ? onSelect : undefined}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="p-1 text-muted hover:text-foreground transition-colors cursor-grab active:cursor-grabbing flex-shrink-0 opacity-0 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Meal Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveRename();
                  if (e.key === "Escape") handleCancelRename();
                }}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveRename}>
                <Check className="h-4 w-4 text-success" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelRename}>
                <X className="h-4 w-4 text-muted" />
              </Button>
            </div>
          ) : (
            <>
              <h3 className={cn(
                "font-medium truncate transition-colors",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {meal.meal_name}
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {recipeCount} recipe{recipeCount !== 1 ? "s" : ""} • {formatTime(getTotalTime(meal))}
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rename</TooltipContent>
            </Tooltip>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted hover:text-error"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Meal</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{meal.meal_name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-error hover:bg-error/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Selected Indicator */}
        {isSelected && (
          <div className="w-1 h-8 bg-primary rounded-full flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// RECIPE SLOT COMPONENT
// ============================================================================

interface RecipeSlotProps {
  recipe: RecipeCardDTO | null;
  slotType: "main" | "side";
  slotIndex?: number;
  onRemove?: () => void;
  onAdd?: () => void;
  isAddable?: boolean;
}

function RecipeSlot({ recipe, slotType, slotIndex, onRemove, onAdd, isAddable }: RecipeSlotProps) {
  const recipeData = recipeCardDTOToData(recipe);

  if (!recipe) {
    if (!isAddable) return null;
    
    return (
      <button
        onClick={onAdd}
        className={cn(
          "w-full rounded-xl border-2 border-dashed border-border/50 transition-all duration-200",
          "hover:border-primary/50 hover:bg-primary/5 group",
          slotType === "main" ? "min-h-[180px]" : "min-h-[80px]"
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2 p-4 text-muted group-hover:text-primary transition-colors">
          <Plus className={cn("transition-transform group-hover:scale-110", slotType === "main" ? "h-8 w-8" : "h-5 w-5")} />
          <span className="text-sm font-medium">
            Add {slotType === "main" ? "Main Recipe" : "Side Recipe"}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="relative group">
      {slotType === "main" ? (
        // Large card for main recipe
        <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="relative md:w-2/5 aspect-[4/3] md:aspect-square overflow-hidden bg-elevated">
              {recipeData?.imageUrl ? (
                <img
                  src={recipeData.imageUrl}
                  alt={recipeData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-elevated via-hover to-elevated">
                  <ChefHat className="h-16 w-16 text-muted opacity-40" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                  Main Dish
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-5 flex flex-col">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {recipeData?.name}
              </h3>
              
              <div className="flex items-center gap-4 text-sm text-muted">
                {recipeData?.totalTime ? (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatTime(recipeData.totalTime)}
                  </span>
                ) : null}
                {recipeData?.servings ? (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {recipeData.servings} servings
                  </span>
                ) : null}
              </div>

              <div className="flex-1" />

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                className="self-start mt-4 text-muted hover:text-error gap-2"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        // Compact card for side recipes
        <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
          <div className="flex items-center gap-3 p-3">
            {/* Thumbnail */}
            <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-elevated">
              {recipeData?.imageUrl ? (
                <img
                  src={recipeData.imageUrl}
                  alt={recipeData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-elevated via-hover to-elevated">
                  <ChefHat className="h-6 w-6 text-muted opacity-40" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-primary font-medium">
                Side {slotIndex}
              </span>
              <h4 className="font-medium text-foreground text-sm truncate">
                {recipeData?.name}
              </h4>
              <p className="text-xs text-muted">
                {recipeData?.totalTime ? formatTime(recipeData.totalTime) : "—"}
              </p>
            </div>

            {/* Remove Button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// ADD RECIPE DIALOG COMPONENT
// ============================================================================

interface AddRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (recipeId: number) => Promise<void>;
  getExcludedRecipeIds: () => number[];  // Changed to getter function to avoid stale state
  slotType: "main" | "side";
}

function AddRecipeDialog({ isOpen, onClose, onSelect, getExcludedRecipeIds, slotType }: AddRecipeDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [recipes, setRecipes] = useState<RecipeCardDTO[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use refs to always call the latest callbacks
  // This avoids stale closure issues with Radix Dialog's portal
  const onSelectRef = useRef(onSelect);
  const getExcludedRef = useRef(getExcludedRecipeIds);
  onSelectRef.current = onSelect;
  getExcludedRef.current = getExcludedRecipeIds;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch recipes when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchRecipes = async () => {
      try {
        setIsLoadingRecipes(true);
        const data = await recipeApi.listCards({ search_term: debouncedSearchTerm || undefined });
        setRecipes(data);
      } catch (err) {
        console.error("Failed to fetch recipes:", err);
      } finally {
        setIsLoadingRecipes(false);
      }
    };

    fetchRecipes();
  }, [isOpen, debouncedSearchTerm]);

  const filteredRecipes = useMemo(() => {
    // Call the getter via ref to always get current excluded IDs
    const excludedIds = getExcludedRef.current();
    return recipes.filter((recipe) => {
      // Exclude already added recipes
      if (excludedIds.includes(recipe.id)) return false;
      return true;
    });
  }, [recipes]); // Note: Don't include getExcludedRef - we call it fresh each render via ref

  const handleSelect = async (recipeId: number) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSelectRef.current(recipeId);  // Wait for updateMeal to finish
      onClose();
      setSearchTerm("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Add {slotType === "main" ? "Main Recipe" : "Side Recipe"}
          </DialogTitle>
          <DialogDescription>
            Select a recipe to add to your meal
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Recipe List */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2 space-y-2">
          {isLoadingRecipes ? (
            <div className="text-center py-12 text-muted">
              <p>Loading recipes...</p>
            </div>
          ) : filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
              <button
                key={recipe.id}
                disabled={isSubmitting}
                onClick={() => handleSelect(recipe.id)}
                className={cn(
                  "w-full text-left rounded-lg bg-elevated hover:bg-hover transition-colors p-3 flex items-center gap-3 group",
                  isSubmitting && "opacity-50 pointer-events-none"
                )}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-hover">
                  {recipe.reference_image_path ? (
                    <img
                      src={recipe.reference_image_path}
                      alt={recipe.recipe_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="h-6 w-6 text-muted opacity-40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {recipe.recipe_name}
                  </h4>
                  <p className="text-xs text-muted">
                    {formatTime(recipe.total_time)}
                  </p>
                </div>

                {/* Arrow */}
                <Plus className="h-5 w-5 text-muted group-hover:text-primary transition-colors" />
              </button>
            ))
          ) : (
            <div className="text-center py-12 text-muted">
              <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No recipes found</p>
              {searchTerm && (
                <p className="text-sm mt-1">Try adjusting your search</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// ADD NEW MEAL DIALOG
// ============================================================================

interface AddMealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (mainRecipeId: number, mealName?: string) => Promise<void>;
}

function AddMealDialog({ isOpen, onClose, onAdd }: AddMealDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [recipes, setRecipes] = useState<RecipeCardDTO[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use ref to always call the latest onAdd callback
  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch recipes when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchRecipes = async () => {
      try {
        setIsLoadingRecipes(true);
        const data = await recipeApi.listCards({ search_term: debouncedSearchTerm || undefined });
        setRecipes(data);
      } catch (err) {
        console.error("Failed to fetch recipes:", err);
      } finally {
        setIsLoadingRecipes(false);
      }
    };

    fetchRecipes();
  }, [isOpen, debouncedSearchTerm]);

  const handleSelect = async (recipeId: number, recipeName: string) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddRef.current(recipeId, recipeName);
      onClose();
      setSearchTerm("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create New Meal
          </DialogTitle>
          <DialogDescription>
            Select a main recipe to start your new meal
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Recipe List */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2 space-y-2">
          {isLoadingRecipes ? (
            <div className="text-center py-12 text-muted">
              <p>Loading recipes...</p>
            </div>
          ) : recipes.length > 0 ? (
            recipes.map((recipe) => (
              <button
                key={recipe.id}
                disabled={isSubmitting}
                onClick={() => handleSelect(recipe.id, recipe.recipe_name)}
                className={cn(
                  "w-full text-left rounded-lg bg-elevated hover:bg-hover transition-colors p-3 flex items-center gap-3 group",
                  isSubmitting && "opacity-50 pointer-events-none"
                )}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-hover">
                  {recipe.reference_image_path ? (
                    <img
                      src={recipe.reference_image_path}
                      alt={recipe.recipe_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="h-6 w-6 text-muted opacity-40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {recipe.recipe_name}
                  </h4>
                  <p className="text-xs text-muted">
                    {formatTime(recipe.total_time)}
                  </p>
                </div>

                {/* Arrow */}
                <Plus className="h-5 w-5 text-muted group-hover:text-primary transition-colors" />
              </button>
            ))
          ) : (
            <div className="text-center py-12 text-muted">
              <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No recipes found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// QUICK ADD SHOPPING ITEM
// ============================================================================

function QuickAddShoppingItem() {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!itemName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const itemData: ManualItemCreateDTO = {
        ingredient_name: itemName.trim(),
        quantity: quantity ? parseFloat(quantity) : 1,
        unit: unit || null,
      };
      await shoppingApi.addItem(itemData);
      toast.success("Item added to shopping list");
      // Reset form
      setItemName("");
      setQuantity("");
      setUnit("");
    } catch (err) {
      console.error("Failed to add shopping item:", err);
      toast.error("Failed to add item to shopping list");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="sticky top-24">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              Quick Add
            </h2>
            <p className="text-sm text-muted mt-0.5">
              Add item to shopping list
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Item Name */}
          <div>
            <Label htmlFor="item-name" className="text-sm font-medium">
              Item Name
            </Label>
            <Input
              id="item-name"
              placeholder="e.g. Olive Oil"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="item-qty" className="text-sm font-medium">
                Qty.
              </Label>
              <Input
                id="item-qty"
                type="number"
                placeholder="e.g. 2"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="item-unit" className="text-sm font-medium">
                Unit
              </Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="item-unit" className="mt-1.5">
                  <SelectValue placeholder="e.g. bottle" />
                </SelectTrigger>
                <SelectContent>
                  {INGREDIENT_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add Button */}
          <Button
            type="button"
            variant={"secondary"}
            onClick={handleAdd}
            className="w-full gap-2"
            disabled={!itemName.trim() || isSubmitting}
          >
            <Plus className="h-4 w-4" />
            Add to List
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

function EmptyState({ onAddMeal }: { onAddMeal: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CalendarDays className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          No Meals Planned Yet
        </h2>
        <p className="text-muted mb-8">
          Start building your meal plan by adding your first meal. Each meal can have a main dish and up to 3 sides.
        </p>
        <Button onClick={onAddMeal} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Create Your First Meal
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// NO SELECTION STATE
// ============================================================================

function NoSelectionState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-elevated/50 rounded-xl border border-dashed border-border/50">
      <div className="text-center px-6 py-12">
        <UtensilsCrossed className="h-12 w-12 text-muted mx-auto mb-4 opacity-40" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Select a Meal
        </h3>
        <p className="text-sm text-muted max-w-xs">
          Choose a meal from the list to view and edit its recipes
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN MEAL PLANNER PAGE
// ============================================================================

export default function MealPlannerPage() {
  // State
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<number | null>(null);
  
  // Ref to always access current meals state (avoids stale closure in dialog callbacks)
  const mealsRef = useRef<Meal[]>(meals);
  mealsRef.current = meals;
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [addRecipeDialog, setAddRecipeDialog] = useState<{
    isOpen: boolean;
    slotType: "main" | "side";
    slotIndex?: number;
  }>({ isOpen: false, slotType: "main" });

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag state for reordering
  const [draggedMealId, setDraggedMealId] = useState<number | null>(null);

  // Fetch meals on mount
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await plannerApi.getMeals();
        setMeals(data);
        if (data.length > 0) {
          setSelectedMealId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch meals:", err);
        setError("Failed to load meals. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeals();
  }, []);

  // Computed
  const selectedMeal = meals.find((m) => m.id === selectedMealId) ?? null;
  const canAddMoreMeals = meals.length < 10;

  const totalRecipes = useMemo(() => {
    return meals.reduce((sum, meal) => sum + getMealRecipeCount(meal), 0);
  }, [meals]);

  // Handlers
  const handleAddMeal = useCallback(async (mainRecipeId: number, mealName?: string) => {
    try {
      const createData: MealSelectionCreateDTO = {
        meal_name: mealName || "New Meal",
        main_recipe_id: mainRecipeId,
      };
      const newMeal = await plannerApi.createMeal(createData);
      setMeals((prev) => [...prev, newMeal]);
      setSelectedMealId(newMeal.id);
      toast.success("Meal created");
    } catch (err) {
      console.error("Failed to create meal:", err);
      toast.error("Failed to create meal");
    }
  }, []);

  const handleDeleteMeal = useCallback(async (mealId: number) => {
    try {
      await plannerApi.deleteMeal(mealId);
      setMeals((prev) => {
        const updated = prev.filter((m) => m.id !== mealId);
        if (selectedMealId === mealId) {
          setSelectedMealId(updated.length > 0 ? updated[0].id : null);
        }
        return updated;
      });
      toast.success("Meal deleted");
    } catch (err) {
      console.error("Failed to delete meal:", err);
      toast.error("Failed to delete meal");
    }
  }, [selectedMealId]);

  const handleRenameMeal = useCallback(async (mealId: number, newName: string) => {
    try {
      const updateData: MealSelectionUpdateDTO = { meal_name: newName };
      const updatedMeal = await plannerApi.updateMeal(mealId, updateData);
      setMeals((prev) =>
        prev.map((m) => (m.id === mealId ? updatedMeal : m))
      );
    } catch (err) {
      console.error("Failed to rename meal:", err);
      toast.error("Failed to rename meal");
    }
  }, []);

  // Note: Not using useCallback here to ensure we always have fresh state
  // The Dialog component may cache the callback, causing stale closure issues
  // We use mealsRef.current to ensure we always read the latest meals state
  const handleAddRecipeToSlot = async (recipeId: number) => {
    if (selectedMealId === null) return;

    // Use ref to get CURRENT meals state, not stale closure value
    const currentMeals = mealsRef.current;
    const currentMeal = currentMeals.find((m) => m.id === selectedMealId);
    if (!currentMeal) return;

    try {
      // Build update data based on slot type
      let updateData: MealSelectionUpdateDTO;

      if (addRecipeDialog.slotType === "main") {
        updateData = { main_recipe_id: recipeId };
      } else {
        // Use *_id fields (authoritative), not side_recipe_* objects (may be null while hydrating)
        if (!currentMeal.side_recipe_1_id) {
          updateData = { side_recipe_1_id: recipeId };
        } else if (!currentMeal.side_recipe_2_id) {
          updateData = { side_recipe_2_id: recipeId };
        } else if (!currentMeal.side_recipe_3_id) {
          updateData = { side_recipe_3_id: recipeId };
        } else {
          return; // All slots filled
        }
      }

      const updatedMeal = await plannerApi.updateMeal(currentMeal.id, updateData);
      setMeals((prev) =>
        prev.map((m) => (m.id === currentMeal.id ? updatedMeal : m))
      );
    } catch (err) {
      console.error("Failed to add recipe to slot:", err);
      toast.error("Failed to add recipe");
    }
  };

  // Note: Not using useCallback to ensure fresh state access
  const handleRemoveRecipe = async (slotType: "main" | "side", slotIndex?: number) => {
    if (selectedMealId === null) return;

    const currentMeal = meals.find((m) => m.id === selectedMealId);
    if (!currentMeal) return;

    try {
      let updateData: MealSelectionUpdateDTO;

      if (slotType === "main") {
        // Note: Setting main_recipe_id to a special value or handling via backend
        // For now, we'll skip removing main recipe as it's required
        console.warn("Cannot remove main recipe - it is required");
        return;
      } else {
        switch (slotIndex) {
          case 1:
            updateData = { side_recipe_1_id: null };
            break;
          case 2:
            updateData = { side_recipe_2_id: null };
            break;
          case 3:
            updateData = { side_recipe_3_id: null };
            break;
          default:
            return;
        }
      }

      const updatedMeal = await plannerApi.updateMeal(currentMeal.id, updateData);
      setMeals((prev) =>
        prev.map((m) => (m.id === currentMeal.id ? updatedMeal : m))
      );
    } catch (err) {
      console.error("Failed to remove recipe:", err);
      toast.error("Failed to remove recipe");
    }
  };

  // Drag and drop handlers
  // Note: Reordering is local only - the new order is not persisted to the backend.
  // A future enhancement could add a plannerApi.reorderMeals() endpoint.
  const handleDragStart = (mealId: number) => {
    setDraggedMealId(mealId);
  };

  const handleDragOver = (e: React.DragEvent, targetMealId: number) => {
    e.preventDefault();
    if (draggedMealId === null || draggedMealId === targetMealId) return;

    const draggedIndex = meals.findIndex((m) => m.id === draggedMealId);
    const targetIndex = meals.findIndex((m) => m.id === targetMealId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newMeals = [...meals];
    const [draggedMeal] = newMeals.splice(draggedIndex, 1);
    newMeals.splice(targetIndex, 0, draggedMeal);
    setMeals(newMeals);
  };

  const handleDragEnd = () => {
    setDraggedMealId(null);
  };

  // Get excluded recipe IDs for the add dialog
  // Uses mealsRef to ensure we always get current state, not stale closure
  const getExcludedRecipeIds = (): number[] => {
    const currentMeals = mealsRef.current;
    const currentSelectedMeal = currentMeals.find((m) => m.id === selectedMealId);
    if (!currentSelectedMeal) return [];
    const ids: number[] = [];
    if (currentSelectedMeal.main_recipe_id) ids.push(currentSelectedMeal.main_recipe_id);
    if (currentSelectedMeal.side_recipe_1_id) ids.push(currentSelectedMeal.side_recipe_1_id);
    if (currentSelectedMeal.side_recipe_2_id) ids.push(currentSelectedMeal.side_recipe_2_id);
    if (currentSelectedMeal.side_recipe_3_id) ids.push(currentSelectedMeal.side_recipe_3_id);
    return ids;
  };

  // Render
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle
            title="Meal Planner"
            description="Plan and organize your meals for the week"
          />
          <PageHeaderActions>
            {canAddMoreMeals && (
              <Button onClick={() => setIsAddMealOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Meal
              </Button>
            )}
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <CalendarDays className="h-12 w-12 text-muted mx-auto mb-4 animate-pulse" />
              <p className="text-muted">Loading your meals...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <p className="text-error mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        ) : meals.length === 0 ? (
          <EmptyState onAddMeal={() => setIsAddMealOpen(true)} />
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6">
              <StatsCard
                icon={CalendarDays}
                primaryValue={meals.length}
                primaryLabel="meals planned"
                secondaryValue={totalRecipes.toString()}
                secondaryLabel="total recipes"
                progress={{
                  current: meals.length,
                  total: 10,
                }}
              />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Meal List */}
              <div className="lg:col-span-4 xl:col-span-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-foreground">Your Meals</h2>
                      <span className="text-xs text-muted">
                        {meals.length}/10
                      </span>
                    </div>

                    <div className="space-y-2">
                      {meals.map((meal) => (
                        <div
                          key={meal.id}
                          draggable
                          onDragStart={() => handleDragStart(meal.id)}
                          onDragOver={(e) => handleDragOver(e, meal.id)}
                          onDragEnd={handleDragEnd}
                        >
                          <MealListItem
                            meal={meal}
                            isSelected={selectedMealId === meal.id}
                            onSelect={() => setSelectedMealId(meal.id)}
                            onDelete={() => handleDeleteMeal(meal.id)}
                            onRename={(name) => handleRenameMeal(meal.id, name)}
                            isDragging={draggedMealId === meal.id}
                          />
                        </div>
                      ))}
                    </div>

                    {canAddMoreMeals && (
                      <Button
                        variant="outline"
                        className="w-full mt-4 gap-2 border-dashed"
                        onClick={() => setIsAddMealOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Add Meal
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Middle Column - Meal Detail */}
              <div className="lg:col-span-5 xl:col-span-6">
                {selectedMeal ? (
                  <div className="space-y-4">
                    {/* Main Recipe */}
                    <RecipeSlot
                      recipe={selectedMeal.main_recipe}
                      slotType="main"
                      onRemove={() => handleRemoveRecipe("main")}
                      onAdd={() =>
                        setAddRecipeDialog({ isOpen: true, slotType: "main" })
                      }
                      isAddable
                    />

                    {/* Side Recipes */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
                        Side Dishes
                      </h3>
                      <div className="grid gap-3">
                        {/* Show existing side recipes */}
                        {selectedMeal.side_recipe_1 && (
                          <RecipeSlot
                            recipe={selectedMeal.side_recipe_1}
                            slotType="side"
                            slotIndex={1}
                            onRemove={() => handleRemoveRecipe("side", 1)}
                          />
                        )}
                        {selectedMeal.side_recipe_2 && (
                          <RecipeSlot
                            recipe={selectedMeal.side_recipe_2}
                            slotType="side"
                            slotIndex={2}
                            onRemove={() => handleRemoveRecipe("side", 2)}
                          />
                        )}
                        {selectedMeal.side_recipe_3 && (
                          <RecipeSlot
                            recipe={selectedMeal.side_recipe_3}
                            slotType="side"
                            slotIndex={3}
                            onRemove={() => handleRemoveRecipe("side", 3)}
                          />
                        )}

                        {/* Single add button for next available slot - use _id fields for consistency */}
                        {!selectedMeal.side_recipe_1_id || !selectedMeal.side_recipe_2_id || !selectedMeal.side_recipe_3_id ? (
                          <button
                            onClick={() =>
                              setAddRecipeDialog({ isOpen: true, slotType: "side" })
                            }
                            className="w-full rounded-xl border-2 border-dashed border-border/50 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 group min-h-[80px]"
                          >
                            <div className="flex flex-col items-center justify-center gap-2 p-4 text-muted group-hover:text-primary transition-colors">
                              <Plus className="h-5 w-5 transition-transform group-hover:scale-110" />
                              <span className="text-sm font-medium">Add Side Recipe</span>
                            </div>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <NoSelectionState />
                )}
              </div>

              {/* Right Column - Quick Add Shopping */}
              <div className="lg:col-span-3 xl:col-span-3">
                <QuickAddShoppingItem />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Dialogs */}
      <AddMealDialog
        isOpen={isAddMealOpen}
        onClose={() => setIsAddMealOpen(false)}
        onAdd={handleAddMeal}
      />

      <AddRecipeDialog
        isOpen={addRecipeDialog.isOpen}
        onClose={() => setAddRecipeDialog({ isOpen: false, slotType: "main" })}
        onSelect={handleAddRecipeToSlot}
        getExcludedRecipeIds={getExcludedRecipeIds}
        slotType={addRecipeDialog.slotType}
      />
    </div>
  );
}