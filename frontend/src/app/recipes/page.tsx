"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  ChefHat,
  Clock,
  Calendar,
  SortAsc,
  Heart,
  Filter,
  BookOpen,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderActions,
} from "@/components/PageHeader";
import { RecipeCard, RecipeCardGrid } from "@/components/RecipeCard";
import { recipeApi } from "@/lib/api";
import { mapRecipesForCards } from "@/lib/recipeCardMapper";
import { RECIPE_CATEGORIES, MEAL_TYPES, DIETARY_PREFERENCES } from "@/lib/constants";
import type { RecipeCardData } from "@/types";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type SortOption = "alphabetical" | "cookTime" | "createdAt";
type SortDirection = "asc" | "desc";

interface FilterState {
  categories: string[];
  mealTypes: string[];
  dietaryPreferences: string[];
  favoritesOnly: boolean;
}

interface ActiveFilter {
  type: "category" | "mealType" | "dietary" | "favorite";
  value: string;
  label: string;
}

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ElementType }[] = [
  { value: "alphabetical", label: "Alphabetical", icon: SortAsc },
  { value: "cookTime", label: "Cook Time", icon: Clock },
  { value: "createdAt", label: "Date Added", icon: Calendar },
];

// ============================================================================
// Filter Section Component
// ============================================================================

interface FilterSectionProps {
  title: string;
  icon: React.ElementType;
  options: string[];
  selected: string[];
  onChange: (value: string, checked: boolean) => void;
  defaultOpen?: boolean;
}

function FilterSection({
  title,
  icon: Icon,
  options,
  selected,
  onChange,
  defaultOpen = true,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted" />
          {title}
          {selected.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      {isOpen && (
        <div className="pt-2 pb-4 space-y-1">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 py-1.5 px-2 rounded-md cursor-pointer hover:bg-hover transition-colors"
            >
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={(checked) => onChange(option, checked as boolean)}
              />
              <span className="text-sm text-foreground">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Active Filter Chip Component
// ============================================================================

interface FilterChipProps {
  label: string;
  type: string;
  onRemove: () => void;
}

function FilterChip({ label, type, onRemove }: FilterChipProps) {
  const typeColors = {
    category: "bg-primary/20 text-primary border-primary/30",
    mealType: "bg-secondary/20 text-secondary border-secondary/30",
    dietary: "bg-accent/50 text-foreground border-accent",
    favorite: "bg-[var(--error)]/20 text-[var(--error)] border-[var(--error)]/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
        typeColors[type as keyof typeof typeColors] || "bg-elevated text-foreground border-border"
      )}
    >
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-background/50 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function RecipeBrowserPage() {
  const router = useRouter();

  // Data and loading state
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter options from constants (filtered to exclude "all" and "none" values)
  const categoryOptions = RECIPE_CATEGORIES.filter((c) => c.value !== "all");
  const mealTypeOptions = MEAL_TYPES.filter((m) => m.value !== "all");
  const dietaryOptions = DIETARY_PREFERENCES.filter((d) => d.value !== "none");

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    mealTypes: [],
    dietaryPreferences: [],
    favoritesOnly: false,
  });
  const [sortBy, setSortBy] = useState<SortOption>("alphabetical");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showFilters, setShowFilters] = useState(true);

  // Fetch recipes on mount
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await recipeApi.list();
        setRecipes(mapRecipesForCards(data));
      } catch (err) {
        console.error("Failed to fetch recipes:", err);
        setError(err instanceof Error ? err.message : "Failed to load recipes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  // Build active filters list for display
  const activeFilters: ActiveFilter[] = useMemo(() => {
    const active: ActiveFilter[] = [];

    filters.categories.forEach((cat) => {
      active.push({ type: "category", value: cat, label: cat });
    });
    filters.mealTypes.forEach((type) => {
      active.push({ type: "mealType", value: type, label: type });
    });
    filters.dietaryPreferences.forEach((pref) => {
      active.push({ type: "dietary", value: pref, label: pref });
    });
    if (filters.favoritesOnly) {
      active.push({ type: "favorite", value: "favorites", label: "Favorites Only" });
    }

    return active;
  }, [filters]);

  // Filter and sort recipes
  const filteredRecipes = useMemo(() => {
    let result = [...recipes];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (recipe) =>
          recipe.name.toLowerCase().includes(term) ||
          recipe.category?.toLowerCase().includes(term) ||
          recipe.mealType?.toLowerCase().includes(term) ||
          recipe.dietaryPreference?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter((recipe) =>
        recipe.category && filters.categories.includes(recipe.category)
      );
    }

    // Meal type filter
    if (filters.mealTypes.length > 0) {
      result = result.filter((recipe) =>
        recipe.mealType && filters.mealTypes.includes(recipe.mealType)
      );
    }

    // Dietary preference filter
    if (filters.dietaryPreferences.length > 0) {
      result = result.filter((recipe) =>
        recipe.dietaryPreference && filters.dietaryPreferences.includes(recipe.dietaryPreference)
      );
    }

    // Favorites filter
    if (filters.favoritesOnly) {
      result = result.filter((recipe) => recipe.isFavorite);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "alphabetical":
          comparison = a.name.localeCompare(b.name);
          break;
        case "cookTime":
          comparison = (a.totalTime || 0) - (b.totalTime || 0);
          break;
        case "createdAt":
          // Using recipe id as proxy for creation order since we don't have dates in RecipeCardData
          comparison = Number(a.id) - Number(b.id);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [recipes, searchTerm, filters, sortBy, sortDirection]);

  // Handlers
  const handleRecipeClick = (recipe: RecipeCardData) => {
    router.push(`/recipes/${recipe.id}`);
  };

  const handleFavoriteToggle = async (recipe: RecipeCardData) => {
    try {
      // Optimistic update
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipe.id ? { ...r, isFavorite: !r.isFavorite } : r
        )
      );

      // Call API
      await recipeApi.toggleFavorite(Number(recipe.id));
    } catch (err) {
      // Revert on error
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipe.id ? { ...r, isFavorite: recipe.isFavorite } : r
        )
      );
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleCategoryChange = (value: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      categories: checked
        ? [...prev.categories, value]
        : prev.categories.filter((c) => c !== value),
    }));
  };

  const handleMealTypeChange = (value: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      mealTypes: checked
        ? [...prev.mealTypes, value]
        : prev.mealTypes.filter((t) => t !== value),
    }));
  };

  const handleDietaryChange = (value: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      dietaryPreferences: checked
        ? [...prev.dietaryPreferences, value]
        : prev.dietaryPreferences.filter((d) => d !== value),
    }));
  };

  const handleRemoveFilter = (filter: ActiveFilter) => {
    switch (filter.type) {
      case "category":
        handleCategoryChange(filter.value, false);
        break;
      case "mealType":
        handleMealTypeChange(filter.value, false);
        break;
      case "dietary":
        handleDietaryChange(filter.value, false);
        break;
      case "favorite":
        setFilters((prev) => ({ ...prev, favoritesOnly: false }));
        break;
    }
  };

  const handleClearAllFilters = () => {
    setFilters({
      categories: [],
      mealTypes: [],
      dietaryPreferences: [],
      favoritesOnly: false,
    });
    setSearchTerm("");
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const hasActiveFilters = activeFilters.length > 0 || searchTerm.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted">Loading recipes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="p-4 bg-[var(--error)]/10 rounded-full">
            <X className="h-8 w-8 text-[var(--error)]" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Failed to Load Recipes</h2>
          <p className="text-muted">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle
            title="Recipe Browser"
            description={`${filteredRecipes.length} of ${recipes.length} recipes`}
          />
          <PageHeaderActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          {showFilters && (
            <aside className="w-72 flex-shrink-0">
              <Card className="sticky top-24">
                <CardContent className="pt-6">
                  {/* Search */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                      <Input
                        placeholder="Search recipes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Sort Section */}
                  <div className="mb-6 pb-6 border-b border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowUpDown className="h-4 w-4 text-muted" />
                      <span className="text-sm font-medium text-foreground">Sort By</span>
                    </div>
                    <div className="flex gap-2">
                      <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SORT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="flex items-center gap-2">
                                <option.icon className="h-4 w-4" />
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleSortDirection}
                        className="flex-shrink-0"
                        aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
                      >
                        {sortDirection === "asc" ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted mt-2">
                      {sortDirection === "asc" ? "A → Z / Low → High" : "Z → A / High → Low"}
                    </p>
                  </div>

                  {/* Filters Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted" />
                      <span className="text-sm font-medium text-foreground">Filters</span>
                    </div>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAllFilters}
                        className="text-xs text-muted hover:text-foreground h-auto py-1 px-2"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  {/* Favorites Toggle */}
                  <label className="flex items-center gap-3 py-2 px-2 mb-4 rounded-md cursor-pointer hover:bg-hover transition-colors border border-border">
                    <Checkbox
                      checked={filters.favoritesOnly}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, favoritesOnly: checked as boolean }))
                      }
                    />
                    <Heart className={cn(
                      "h-4 w-4",
                      filters.favoritesOnly ? "text-[var(--error)] fill-current" : "text-muted"
                    )} />
                    <span className="text-sm text-foreground">Favorites Only</span>
                  </label>

                  {/* Filter Sections */}
                  <div className="space-y-2 divide-y divide-border">
                    <FilterSection
                      title="Category"
                      icon={ChefHat}
                      options={categoryOptions.map((c) => c.label)}
                      selected={filters.categories}
                      onChange={handleCategoryChange}
                    />
                    <FilterSection
                      title="Meal Type"
                      icon={Clock}
                      options={mealTypeOptions.map((m) => m.label)}
                      selected={filters.mealTypes}
                      onChange={handleMealTypeChange}
                    />
                    {dietaryOptions.length > 0 && (
                      <FilterSection
                        title="Dietary Preference"
                        icon={BookOpen}
                        options={dietaryOptions.map((d) => d.label)}
                        selected={filters.dietaryPreferences}
                        onChange={handleDietaryChange}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </aside>
          )}

          {/* Recipe Grid */}
          <main className="flex-1 min-w-0">
            {/* Active Filters Display */}
            {activeFilters.length > 0 && (
              <div className="mb-6 p-4 bg-elevated rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Active Filters</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllFilters}
                    className="text-xs text-muted hover:text-foreground h-auto py-1 px-2"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter, index) => (
                    <FilterChip
                      key={`${filter.type}-${filter.value}-${index}`}
                      label={filter.label}
                      type={filter.type}
                      onRemove={() => handleRemoveFilter(filter)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {filteredRecipes.length > 0 ? (
              <RecipeCardGrid size="medium">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    size="medium"
                    onClick={handleRecipeClick}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </RecipeCardGrid>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-elevated rounded-full mb-4">
                  <ChefHat className="h-12 w-12 text-muted" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Recipes Found</h3>
                <p className="text-sm text-muted max-w-sm mb-4">
                  {hasActiveFilters
                    ? "Try adjusting your filters or search term to find more recipes."
                    : "Your recipe collection is empty. Start by adding some recipes!"}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={handleClearAllFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
