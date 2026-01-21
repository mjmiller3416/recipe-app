"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterSidebar, type FilterSidebarFilters } from "@/components/common/FilterSidebar";
import { FilterBar } from "@/components/common/FilterBar";
import { MealPreviewPanel } from "../meal-dialog/components/MealPreviewPanel";
import { SavedMealCard } from "../meal-dialog/components/SavedMealCard";
import { RecipeSelectionGrid } from "./RecipeSelectionGrid";
import { recipeApi, plannerApi } from "@/lib/api";
import { mapRecipesForCards } from "@/lib/recipeCardMapper";
import { applyFilters, DEFAULT_FILTERS, type RecipeFilters } from "@/lib/filterUtils";
import { DEFAULT_QUICK_FILTER_IDS, QUICK_FILTERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type {
  RecipeCardData,
  MealSelectionResponseDTO,
} from "@/types";

// ============================================================================
// CONSTANTS
// ============================================================================

// Quick filter options for the filter bar
const QUICK_FILTER_OPTIONS = DEFAULT_QUICK_FILTER_IDS.map((id) => {
  const filter = QUICK_FILTERS.find((f) => f.id === id);
  return { id, label: filter?.label ?? id };
});

// ============================================================================
// TYPES
// ============================================================================

type Mode = "create" | "saved";

// ============================================================================
// LOADING SKELETONS
// ============================================================================

function PageSkeleton() {
  return (
    <div className="flex gap-6">
      {/* Left sidebar skeleton */}
      <div className="w-64 flex-shrink-0">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
      {/* Center content skeleton */}
      <div className="flex-1 space-y-6">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-8 w-1/2 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          ))}
        </div>
      </div>
      {/* Right sidebar skeleton */}
      <div className="w-80 flex-shrink-0">
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    </div>
  );
}

// ============================================================================
// CREATE MEAL PAGE COMPONENT
// ============================================================================

/**
 * CreateMealPage - Full-page meal creation experience
 *
 * Features:
 * - Three-column layout (filters | recipes | preview)
 * - Tabs for "Create New" vs "Use Saved" modes
 * - Direct toggle selection (not slot-based)
 * - Separate Main Dishes and Side Dishes sections
 * - FilterSidebar for advanced filtering
 * - MealPreviewPanel for meal building
 */
export function CreateMealPage() {
  const router = useRouter();

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  // Mode state
  const [mode, setMode] = useState<Mode>("create");

  // Selection state (direct toggle, not slot-based)
  const [selectedMain, setSelectedMain] = useState<RecipeCardData | null>(null);
  const [selectedSides, setSelectedSides] = useState<RecipeCardData[]>([]);

  // UI state
  const [showFilters, setShowFilters] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recipe data state
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);

  // Saved meals state
  const [savedMeals, setSavedMeals] = useState<MealSelectionResponseDTO[]>([]);
  const [isLoadingSavedMeals, setIsLoadingSavedMeals] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set());
  const [sidebarFilters, setSidebarFilters] = useState<FilterSidebarFilters>({
    categories: [],
    mealTypes: [],
    dietaryPreferences: [],
    favoritesOnly: false,
  });

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    if (mode === "saved" && savedMeals.length === 0) {
      fetchSavedMeals();
    }
  }, [mode, savedMeals.length]);

  const fetchRecipes = async () => {
    setIsLoadingRecipes(true);
    try {
      const data = await recipeApi.list();
      setRecipes(mapRecipesForCards(data));
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  const fetchSavedMeals = async () => {
    setIsLoadingSavedMeals(true);
    try {
      const data = await plannerApi.getMeals({ saved: true });
      setSavedMeals(data);
    } catch (error) {
      console.error("Failed to fetch saved meals:", error);
    } finally {
      setIsLoadingSavedMeals(false);
    }
  };

  // --------------------------------------------------------------------------
  // Filtering Logic
  // --------------------------------------------------------------------------

  const filteredRecipes = useMemo(() => {
    // Build filters from sidebar state
    const filters: RecipeFilters = {
      ...DEFAULT_FILTERS,
      searchTerm,
      categories: sidebarFilters.categories,
      mealTypes: sidebarFilters.mealTypes,
      dietaryPreferences: sidebarFilters.dietaryPreferences,
      favoritesOnly: sidebarFilters.favoritesOnly,
    };

    // Apply quick filters
    activeQuickFilters.forEach((id) => {
      const filter = QUICK_FILTERS.find((f) => f.id === id);
      if (!filter) return;

      switch (filter.type) {
        case "mealType":
          if (!filters.mealTypes.includes(filter.value as string)) {
            filters.mealTypes = [...filters.mealTypes, filter.value as string];
          }
          break;
        case "dietary":
          if (!filters.dietaryPreferences.includes(filter.value as string)) {
            filters.dietaryPreferences = [...filters.dietaryPreferences, filter.value as string];
          }
          break;
        case "favorite":
          filters.favoritesOnly = true;
          break;
        case "time":
          filters.maxCookTime = filter.value as number;
          break;
        case "new":
          filters.newDays = filter.value as number;
          break;
      }
    });

    return applyFilters(recipes, filters);
  }, [recipes, searchTerm, sidebarFilters, activeQuickFilters]);

  const filteredSavedMeals = useMemo(() => {
    if (!searchTerm) return savedMeals;
    return savedMeals.filter((meal) =>
      meal.meal_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [savedMeals, searchTerm]);

  // --------------------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------------------

  const handleBack = () => {
    router.push("/meal-planner");
  };

  const handleModeChange = (value: string) => {
    setMode(value as Mode);
  };

  const handleRecipeSelect = useCallback((recipe: RecipeCardData) => {
    const isSide = recipe.mealType === "side";

    if (isSide) {
      // Toggle side selection
      setSelectedSides((prev) => {
        const isSelected = prev.some((s) => s.id === recipe.id);
        if (isSelected) {
          return prev.filter((s) => s.id !== recipe.id);
        }
        if (prev.length >= 3) {
          return prev; // Max 3 sides
        }
        return [...prev, recipe];
      });
    } else {
      // Toggle main selection
      setSelectedMain((prev) => (prev?.id === recipe.id ? null : recipe));
    }
  }, []);

  const handleSavedMealSelect = useCallback((meal: MealSelectionResponseDTO) => {
    // Pre-fill selection from saved meal
    if (meal.main_recipe) {
      setSelectedMain({
        id: meal.main_recipe.id,
        name: meal.main_recipe.recipe_name,
        servings: meal.main_recipe.servings ?? 0,
        totalTime: meal.main_recipe.total_time ?? 0,
        imageUrl: meal.main_recipe.reference_image_path ?? undefined,
        isFavorite: meal.main_recipe.is_favorite,
        mealType: meal.main_recipe.meal_type ?? undefined,
      });
    }

    if (meal.side_recipes && meal.side_recipes.length > 0) {
      setSelectedSides(
        meal.side_recipes.slice(0, 3).map((r) => ({
          id: r.id,
          name: r.recipe_name,
          servings: r.servings ?? 0,
          totalTime: r.total_time ?? 0,
          imageUrl: r.reference_image_path ?? undefined,
          isFavorite: r.is_favorite,
          mealType: r.meal_type ?? undefined,
        }))
      );
    }

    // Switch to create mode to show the selection
    setMode("create");
  }, []);

  const handleRemoveMain = () => {
    setSelectedMain(null);
  };

  const handleRemoveSide = (recipeId: number) => {
    setSelectedSides((prev) => prev.filter((s) => Number(s.id) !== recipeId));
  };

  const handleQuickFilterToggle = (id: string) => {
    setActiveQuickFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Sidebar filter handlers
  const handleCategoryChange = (value: string, checked: boolean) => {
    setSidebarFilters((prev) => ({
      ...prev,
      categories: checked
        ? [...prev.categories, value]
        : prev.categories.filter((c) => c !== value),
    }));
  };

  const handleMealTypeChange = (value: string, checked: boolean) => {
    setSidebarFilters((prev) => ({
      ...prev,
      mealTypes: checked
        ? [...prev.mealTypes, value]
        : prev.mealTypes.filter((t) => t !== value),
    }));
  };

  const handleDietaryChange = (value: string, checked: boolean) => {
    setSidebarFilters((prev) => ({
      ...prev,
      dietaryPreferences: checked
        ? [...prev.dietaryPreferences, value]
        : prev.dietaryPreferences.filter((d) => d !== value),
    }));
  };

  const handleFavoritesChange = (checked: boolean) => {
    setSidebarFilters((prev) => ({ ...prev, favoritesOnly: checked }));
  };

  const handleClearAllFilters = () => {
    setSidebarFilters({
      categories: [],
      mealTypes: [],
      dietaryPreferences: [],
      favoritesOnly: false,
    });
    setActiveQuickFilters(new Set());
    setSearchTerm("");
  };

  // --------------------------------------------------------------------------
  // Submit Handler
  // --------------------------------------------------------------------------

  const handleAddToQueue = async () => {
    if (!selectedMain) return;

    setIsSubmitting(true);
    try {
      const sideRecipeIds = selectedSides.map((r) => Number(r.id));

      // Step 1: Create the meal
      const meal = await plannerApi.createMeal({
        meal_name: selectedMain.name,
        main_recipe_id: Number(selectedMain.id),
        side_recipe_ids: sideRecipeIds,
      });

      // Step 2: Add meal to planner
      await plannerApi.addToPlanner(meal.id);

      // Navigate back to meal planner
      router.push("/meal-planner");
    } catch (error) {
      console.error("Failed to create meal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  // Show loading state
  if (isLoadingRecipes) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header onBack={handleBack} mode={mode} onModeChange={handleModeChange} />
        <main className="max-w-screen-2xl mx-auto px-6 py-6">
          <PageSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <Header onBack={handleBack} mode={mode} onModeChange={handleModeChange} />

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left Panel: Filters */}
          <div
            className={cn(
              "transition-all duration-300 ease-out flex-shrink-0",
              showFilters ? "w-64 opacity-100" : "w-0 opacity-0 overflow-hidden"
            )}
          >
            <Card className="p-5 sticky top-24">
              <FilterSidebar
                filters={sidebarFilters}
                onCategoryChange={handleCategoryChange}
                onMealTypeChange={handleMealTypeChange}
                onDietaryChange={handleDietaryChange}
                onFavoritesChange={handleFavoritesChange}
                onClearAll={handleClearAllFilters}
                headerTitle="Refine Results"
              />
            </Card>
          </div>

          {/* Center: Recipe/Meal Grid */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <Input
                  icon={Search}
                  placeholder={mode === "create" ? "Search recipes..." : "Search saved meals..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && "bg-primary-surface border-primary-muted")}
              >
                <Filter className="w-4 h-4" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
            </div>

            {/* Quick Filter Chips */}
            <div className="mb-6">
              <FilterBar
                options={QUICK_FILTER_OPTIONS}
                activeIds={activeQuickFilters}
                onToggle={handleQuickFilterToggle}
              />
            </div>

            {/* Content Area */}
            {mode === "create" ? (
              <RecipeSelectionGrid
                recipes={filteredRecipes}
                selectedMainId={selectedMain?.id ?? null}
                selectedSideIds={selectedSides.map((s) => s.id)}
                onRecipeSelect={handleRecipeSelect}
                isLoading={isLoadingRecipes}
              />
            ) : (
              <SavedMealsGrid
                meals={filteredSavedMeals}
                isLoading={isLoadingSavedMeals}
                onSelect={handleSavedMealSelect}
              />
            )}
          </div>

          {/* Right Panel: Meal Preview */}
          <div className="w-80 flex-shrink-0">
            <Card className="p-5 sticky top-24 h-[calc(100vh-120px)]">
              <MealPreviewPanel
                mainDish={selectedMain}
                sides={selectedSides}
                onRemoveMain={handleRemoveMain}
                onRemoveSide={handleRemoveSide}
                onAddToQueue={handleAddToQueue}
                isSubmitting={isSubmitting}
              />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================

interface HeaderProps {
  onBack: () => void;
  mode: Mode;
  onModeChange: (mode: string) => void;
}

function Header({ onBack, mode, onModeChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Create Meal</h1>
              <p className="text-sm text-muted-foreground">
                Add a new meal to your weekly queue
              </p>
            </div>
          </div>

          {/* Right: Mode Tabs */}
          <Tabs value={mode} onValueChange={onModeChange}>
            <TabsList>
              <TabsTrigger value="create">
                <Plus className="w-4 h-4" />
                Create New
              </TabsTrigger>
              <TabsTrigger value="saved">
                <Bookmark className="w-4 h-4" />
                Use Saved
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// SAVED MEALS GRID COMPONENT
// ============================================================================

interface SavedMealsGridProps {
  meals: MealSelectionResponseDTO[];
  isLoading: boolean;
  onSelect: (meal: MealSelectionResponseDTO) => void;
}

function SavedMealsGrid({ meals, isLoading, onSelect }: SavedMealsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex bg-elevated rounded-2xl border border-border overflow-hidden">
            <Skeleton className="h-28 w-28 flex-shrink-0" />
            <div className="flex-1 p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Bookmark className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">No saved meals found</h3>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {meals.map((meal) => (
        <SavedMealCard key={meal.id} meal={meal} onSelect={onSelect} />
      ))}
    </div>
  );
}
