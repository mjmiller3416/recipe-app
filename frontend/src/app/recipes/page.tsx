"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  X,
  ChefHat,
  Clock,
  Calendar,
  SortAsc,
  Heart,
  BookOpen,
  ChevronDown,
  Loader2,
  Sparkles,
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
import { PageLayout } from "@/components/layout/PageLayout";
import { RecipeCard, RecipeCardGrid } from "@/components/recipe/RecipeCard";
import { recipeApi } from "@/lib/api";
import { mapRecipesForCards } from "@/lib/recipeCardMapper";
import { RECIPE_CATEGORY_OPTIONS, MEAL_TYPE_OPTIONS, DIETARY_PREFERENCES, QUICK_FILTERS } from "@/lib/constants";
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
  maxCookTime: number | null;
}

interface ActiveFilter {
  type: "category" | "mealType" | "dietary" | "favorite" | "time";
  value: string;
  label: string;
}

// ============================================================================
// Constants
// ============================================================================

const SCROLL_POSITION_KEY = "recipe-browser-scroll-position";
const FILTER_VISIBILITY_KEY = "recipe-browser-show-filters";

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ElementType }[] = [
  { value: "alphabetical", label: "Alphabetical", icon: SortAsc },
  { value: "cookTime", label: "Cook Time", icon: Clock },
  { value: "createdAt", label: "Date Added", icon: Calendar },
];

// ============================================================================
// Hero Section Component
// ============================================================================

interface HeroSectionProps {
  recipeCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  activeQuickFilters: Set<string>;
  onQuickFilterToggle: (filterId: string) => void;
}

function HeroSection({
  recipeCount,
  searchTerm,
  onSearchChange,
  onSearch,
  activeQuickFilters,
  onQuickFilterToggle,
}: HeroSectionProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="/images/rb_hero_image.png"
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
        {/* Subtle blur effect on image */}
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
          Find your next meal
        </h1>
        <p className="text-muted text-lg mb-8">
          Browse through your collection of {recipeCount} saved recipes
        </p>

        {/* Search Bar */}
        <div className="flex gap-3 max-w-2xl mx-auto mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
            <Input
              placeholder="Search saved recipes, ingredients, tags..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-12 h-12 text-base bg-elevated/90 backdrop-blur-sm border-border/50 focus:border-primary"
            />
          </div>
          <Button
            onClick={onSearch}
            size="lg"
            className="h-12 px-6 bg-primary hover:bg-primary/90"
          >
            Search
          </Button>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {QUICK_FILTERS.map((filter) => {
            const isActive = activeQuickFilters.has(filter.id);
            return (
              <button
                key={filter.id}
                onClick={() => onQuickFilterToggle(filter.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  "border backdrop-blur-sm",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                    : "bg-elevated/80 text-foreground border-border/50 hover:bg-elevated hover:border-border"
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
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
  const typeColors: Record<string, string> = {
    category: "bg-primary/20 text-primary border-primary/30",
    mealType: "bg-secondary/20 text-secondary border-secondary/30",
    dietary: "bg-accent/50 text-foreground border-accent",
    favorite: "bg-[var(--error)]/20 text-[var(--error)] border-[var(--error)]/30",
    time: "bg-secondary/20 text-secondary border-secondary/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
        typeColors[type] || "bg-elevated text-foreground border-border"
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
// Sticky Header Bar Component (Sort + Active Filters)
// ============================================================================

interface StickyHeaderBarProps {
  resultCount: number;
  totalCount: number;
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (value: SortOption) => void;
  onSortDirectionToggle: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFilters: ActiveFilter[];
  onRemoveFilter: (filter: ActiveFilter) => void;
  onClearAllFilters: () => void;
}

function StickyHeaderBar({
  resultCount,
  totalCount,
  sortBy,
  sortDirection,
  onSortChange,
  onSortDirectionToggle,
  showFilters,
  onToggleFilters,
  activeFilters,
  onRemoveFilter,
  onClearAllFilters,
}: StickyHeaderBarProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Section Header with Sort */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Your Recipes</h2>
          <span className="text-sm text-muted">
            {resultCount === totalCount
              ? `${totalCount} recipes`
              : `${resultCount} of ${totalCount} recipes`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Sort by:</span>
          <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-9">
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
            onClick={onSortDirectionToggle}
            className="h-9 w-9"
            aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
          >
            {sortDirection === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
            className="gap-2 ml-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
      </div>

      {/* Active Filters - Always visible when filters are applied */}
      {activeFilters.length > 0 && (
        <div className="p-4 bg-elevated rounded-lg border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Active Filters</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAllFilters}
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
                onRemove={() => onRemoveFilter(filter)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
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

  // Filter options from constants (already exclude "all", plus filter "none" from dietary)
  const categoryOptions = RECIPE_CATEGORY_OPTIONS;
  const mealTypeOptions = MEAL_TYPE_OPTIONS;
  const dietaryOptions = DIETARY_PREFERENCES.filter((d) => d.value !== "none");

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    mealTypes: [],
    dietaryPreferences: [],
    favoritesOnly: false,
    maxCookTime: null,
  });
  const [sortBy, setSortBy] = useState<SortOption>("alphabetical");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showFilters, setShowFilters] = useState(() => {
    // Initialize from sessionStorage, default to true if not set
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(FILTER_VISIBILITY_KEY);
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set());

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

  // Persist filter visibility preference
  useEffect(() => {
    sessionStorage.setItem(FILTER_VISIBILITY_KEY, String(showFilters));
  }, [showFilters]);

  // Handle quick filter toggle
  const handleQuickFilterToggle = (filterId: string) => {
    const filter = QUICK_FILTERS.find((f) => f.id === filterId);
    if (!filter) return;

    setActiveQuickFilters((prev) => {
      const next = new Set(prev);
      const isActive = next.has(filterId);

      if (isActive) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }

      // Update the actual filter state based on quick filter type
      if (filter.type === "mealType") {
        setFilters((f) => ({
          ...f,
          mealTypes: isActive
            ? f.mealTypes.filter((m) => m !== filter.value)
            : [...f.mealTypes, filter.value as string],
        }));
      } else if (filter.type === "dietary") {
        setFilters((f) => ({
          ...f,
          dietaryPreferences: isActive
            ? f.dietaryPreferences.filter((d) => d !== filter.value)
            : [...f.dietaryPreferences, filter.value as string],
        }));
      } else if (filter.type === "favorite") {
        setFilters((f) => ({
          ...f,
          favoritesOnly: !isActive,
        }));
      } else if (filter.type === "time") {
        setFilters((f) => ({
          ...f,
          maxCookTime: isActive ? null : (filter.value as number),
        }));
      }

      return next;
    });
  };

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
    if (filters.maxCookTime) {
      active.push({
        type: "time",
        value: String(filters.maxCookTime),
        label: `Under ${filters.maxCookTime}m`,
      });
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
      result = result.filter(
        (recipe) => recipe.category && filters.categories.includes(recipe.category)
      );
    }

    // Meal type filter
    if (filters.mealTypes.length > 0) {
      result = result.filter(
        (recipe) => recipe.mealType && filters.mealTypes.includes(recipe.mealType)
      );
    }

    // Dietary preference filter
    if (filters.dietaryPreferences.length > 0) {
      result = result.filter(
        (recipe) =>
          recipe.dietaryPreference &&
          filters.dietaryPreferences.includes(recipe.dietaryPreference)
      );
    }

    // Favorites filter
    if (filters.favoritesOnly) {
      result = result.filter((recipe) => recipe.isFavorite);
    }

    // Cook time filter
    if (filters.maxCookTime) {
      result = result.filter(
        (recipe) => recipe.totalTime && recipe.totalTime <= filters.maxCookTime!
      );
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

  // Restore scroll position after recipes load
  useEffect(() => {
    if (!isLoading && recipes.length > 0) {
      const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedPosition) {
        // Use requestAnimationFrame to ensure DOM has rendered
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedPosition, 10));
          sessionStorage.removeItem(SCROLL_POSITION_KEY);
        });
      }
    }
  }, [isLoading, recipes.length]);

  // Handlers
  const handleRecipeClick = (recipe: RecipeCardData) => {
    // Save scroll position before navigating
    sessionStorage.setItem(SCROLL_POSITION_KEY, String(window.scrollY));
    router.push(`/recipes/${recipe.id}`);
  };

  const handleFavoriteToggle = async (recipe: RecipeCardData) => {
    try {
      // Optimistic update
      setRecipes((prev) =>
        prev.map((r) => (r.id === recipe.id ? { ...r, isFavorite: !r.isFavorite } : r))
      );

      // Call API
      await recipeApi.toggleFavorite(Number(recipe.id));
    } catch (err) {
      // Revert on error
      setRecipes((prev) =>
        prev.map((r) => (r.id === recipe.id ? { ...r, isFavorite: recipe.isFavorite } : r))
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
    // Sync with quick filters
    const quickFilter = QUICK_FILTERS.find((f) => f.type === "mealType" && f.value === value);
    if (quickFilter) {
      setActiveQuickFilters((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(quickFilter.id);
        } else {
          next.delete(quickFilter.id);
        }
        return next;
      });
    }
  };

  const handleDietaryChange = (value: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      dietaryPreferences: checked
        ? [...prev.dietaryPreferences, value]
        : prev.dietaryPreferences.filter((d) => d !== value),
    }));
    // Sync with quick filters
    const quickFilter = QUICK_FILTERS.find((f) => f.type === "dietary" && f.value === value);
    if (quickFilter) {
      setActiveQuickFilters((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(quickFilter.id);
        } else {
          next.delete(quickFilter.id);
        }
        return next;
      });
    }
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
        setActiveQuickFilters((prev) => {
          const next = new Set(prev);
          next.delete("favorites");
          return next;
        });
        break;
      case "time":
        setFilters((prev) => ({ ...prev, maxCookTime: null }));
        setActiveQuickFilters((prev) => {
          const next = new Set(prev);
          next.delete("under30");
          return next;
        });
        break;
    }
  };

  const handleClearAllFilters = () => {
    setFilters({
      categories: [],
      mealTypes: [],
      dietaryPreferences: [],
      favoritesOnly: false,
      maxCookTime: null,
    });
    setSearchTerm("");
    setActiveQuickFilters(new Set());
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
    <PageLayout
      title="Recipes"
      hero={
        <HeroSection
          recipeCount={recipes.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={() => {}}
          activeQuickFilters={activeQuickFilters}
          onQuickFilterToggle={handleQuickFilterToggle}
        />
      }
      stickyHeader={
        <StickyHeaderBar
          resultCount={filteredRecipes.length}
          totalCount={recipes.length}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={setSortBy}
          onSortDirectionToggle={toggleSortDirection}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          activeFilters={activeFilters}
          onRemoveFilter={handleRemoveFilter}
          onClearAllFilters={handleClearAllFilters}
        />
      }
    >
      <div className="flex gap-6">
        {/* Filter Sidebar */}
        {showFilters && (
          <aside className="w-64 flex-shrink-0">
            <Card>
              <CardContent className="pt-6">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">Refine Results</span>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearAllFilters}
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Favorites Toggle */}
                <label className="flex items-center gap-3 py-3 px-2 mb-2 rounded-md cursor-pointer hover:bg-hover transition-colors">
                  <Checkbox
                    checked={filters.favoritesOnly}
                    onCheckedChange={(checked) => {
                      setFilters((prev) => ({ ...prev, favoritesOnly: checked as boolean }));
                      setActiveQuickFilters((prev) => {
                        const next = new Set(prev);
                        if (checked) {
                          next.add("favorites");
                        } else {
                          next.delete("favorites");
                        }
                        return next;
                      });
                    }}
                  />
                  <Heart
                    className={cn(
                      "h-4 w-4 transition-colors",
                      filters.favoritesOnly ? "text-[var(--error)] fill-current" : "text-muted"
                    )}
                  />
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
    </PageLayout>
  );
}
