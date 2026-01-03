"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLayout } from "@/components/layout/PageLayout";
import { RecipeCard, RecipeCardGrid } from "@/components/recipe/RecipeCard";
import { FilterPillGroup } from "@/components/common/FilterPillGroup";
import { recipeApi } from "@/lib/api";
import { mapRecipesForCards } from "@/lib/recipeCardMapper";
import { RECIPE_CATEGORY_OPTIONS, MEAL_TYPE_OPTIONS, DIETARY_PREFERENCES, QUICK_FILTERS, type QuickFilter } from "@/lib/constants";
import { useSettings } from "@/hooks/useSettings";
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
  newDays: number | null;
}

interface ActiveFilter {
  type: "category" | "mealType" | "dietary" | "favorite" | "time" | "new";
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
  quickFilterOptions: QuickFilter[];
}

function HeroSection({
  recipeCount,
  searchTerm,
  onSearchChange,
  onSearch,
  activeQuickFilters,
  onQuickFilterToggle,
  quickFilterOptions,
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
        <p className="text-muted-foreground text-lg mb-8">
          Browse through your collection of {recipeCount} saved recipes
        </p>

        {/* Search Bar */}
        <div className="flex gap-3 max-w-2xl mx-auto mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
            size="xl"
          >
            Search
          </Button>
        </div>

        {/* Quick Filter Pills */}
        <div className="max-w-2xl mx-auto">
          <FilterPillGroup
            options={quickFilterOptions}
            activeIds={activeQuickFilters}
            onToggle={onQuickFilterToggle}
            variant="glass"
            align="start"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Filter Section Component
// ============================================================================

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSectionProps {
  title: string;
  icon: React.ElementType;
  options: FilterOption[];
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
        className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-primary transition-colors pressable"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
          {selected.length > 0 && (
            <span className="ml-1 px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="pt-2 pb-4 space-y-1">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 py-2 px-2 rounded-md cursor-pointer hover:bg-hover transition-colors"
            >
              <Checkbox
                checked={selected.includes(option.value)}
                onCheckedChange={(checked) => onChange(option.value, checked as boolean)}
              />
              <span className="text-sm text-foreground">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Filter Sidebar Content (shared between desktop sidebar and mobile sheet)
// ============================================================================

interface FilterSidebarContentProps {
  filters: FilterState;
  hasActiveFilters: boolean;
  onClearAllFilters: () => void;
  onFavoritesChange: (checked: boolean) => void;
  categoryOptions: FilterOption[];
  mealTypeOptions: FilterOption[];
  dietaryOptions: FilterOption[];
  onCategoryChange: (value: string, checked: boolean) => void;
  onMealTypeChange: (value: string, checked: boolean) => void;
  onDietaryChange: (value: string, checked: boolean) => void;
}

function FilterSidebarContent({
  filters,
  hasActiveFilters,
  onClearAllFilters,
  onFavoritesChange,
  categoryOptions,
  mealTypeOptions,
  dietaryOptions,
  onCategoryChange,
  onMealTypeChange,
  onDietaryChange,
}: FilterSidebarContentProps) {
  return (
    <>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">Refine Results</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="link"
            size="sm"
            onClick={onClearAllFilters}
            className="h-auto p-0 text-xs"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Favorites Toggle */}
      <label className="flex items-center gap-3 py-3 px-2 mb-2 rounded-md cursor-pointer hover:bg-hover transition-colors">
        <Checkbox
          checked={filters.favoritesOnly}
          onCheckedChange={(checked) => onFavoritesChange(checked as boolean)}
        />
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            filters.favoritesOnly ? "text-destructive fill-current" : "text-muted-foreground"
          )}
        />
        <span className="text-sm text-foreground">Favorites Only</span>
      </label>

      {/* Filter Sections */}
      <div className="space-y-2 divide-y divide-border">
        <FilterSection
          title="Category"
          icon={ChefHat}
          options={categoryOptions}
          selected={filters.categories}
          onChange={onCategoryChange}
        />
        <FilterSection
          title="Meal Type"
          icon={Clock}
          options={mealTypeOptions}
          selected={filters.mealTypes}
          onChange={onMealTypeChange}
        />
        {dietaryOptions.length > 0 && (
          <FilterSection
            title="Dietary Preference"
            icon={BookOpen}
            options={dietaryOptions}
            selected={filters.dietaryPreferences}
            onChange={onDietaryChange}
          />
        )}
      </div>
    </>
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
    favorite: "bg-destructive/20 text-destructive border-destructive/30",
    time: "bg-secondary/20 text-secondary border-secondary/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
        typeColors[type] || "bg-elevated text-foreground border-border"
      )}
    >
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-background/50 rounded-full p-1 transition-colors"
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
  onOpenMobileFilters: () => void;
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
  onOpenMobileFilters,
  activeFilters,
  onRemoveFilter,
  onClearAllFilters,
}: StickyHeaderBarProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
      {/* Section Header with Sort */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg md:text-xl font-semibold text-foreground">Your Recipes</h2>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {resultCount === totalCount
              ? `${totalCount} recipes`
              : `${resultCount} of ${totalCount}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden md:inline">Sort by:</span>
          <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger className="w-32 md:w-36 h-9">
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
          {/* Desktop filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
            className="gap-2 ml-2 hidden md:flex"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          {/* Mobile filter sheet trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenMobileFilters}
            className="gap-2 ml-2 md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilters.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {activeFilters.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Active Filters - Always visible when filters are applied */}
      {activeFilters.length > 0 && (
        <div className="p-4 bg-elevated rounded-lg border border-border">
          <div className="flex items-start gap-3">
            <span className="text-sm font-medium text-foreground shrink-0 py-1.5">Active Filters</span>
            <div className="flex flex-wrap gap-2 flex-1 min-w-0">
              {activeFilters.map((filter, index) => (
                <FilterChip
                  key={`${filter.type}-${filter.value}-${index}`}
                  label={filter.label}
                  type={filter.type}
                  onRemove={() => onRemoveFilter(filter)}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2 shrink-0"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RecipeBrowserView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useSettings();

  // Filter QUICK_FILTERS based on user's selected filters from settings
  const visibleQuickFilters = useMemo(() => {
    const selectedIds = settings.recipePreferences.quickFilters;
    return QUICK_FILTERS.filter((f) => selectedIds.includes(f.id));
  }, [settings.recipePreferences.quickFilters]);

  // Check for URL params on mount
  const initialFavoritesOnly = searchParams.get("favoritesOnly") === "true";

  // Data and loading state
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter options from constants (already exclude "all")
  const categoryOptions = RECIPE_CATEGORY_OPTIONS;
  const mealTypeOptions = MEAL_TYPE_OPTIONS;
  const dietaryOptions = [...DIETARY_PREFERENCES];

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    mealTypes: [],
    dietaryPreferences: [],
    favoritesOnly: initialFavoritesOnly,
    maxCookTime: null,
    newDays: null,
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
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(
    () => initialFavoritesOnly ? new Set(["favorites"]) : new Set()
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync filters with URL params (handles navigation to ?favoritesOnly=true)
  useEffect(() => {
    const urlFavoritesOnly = searchParams.get("favoritesOnly") === "true";
    if (urlFavoritesOnly !== filters.favoritesOnly) {
      setFilters((prev) => ({ ...prev, favoritesOnly: urlFavoritesOnly }));
      // Sync quick filters
      setActiveQuickFilters((prev) => {
        const next = new Set(prev);
        if (urlFavoritesOnly) {
          next.add("favorites");
        } else {
          next.delete("favorites");
        }
        return next;
      });
    }
  }, [searchParams, filters.favoritesOnly]);

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

    // Calculate state OUTSIDE updater functions to avoid nested setState issues
    const isActive = activeQuickFilters.has(filterId);
    const newQuickFilters = new Set(activeQuickFilters);

    if (isActive) {
      newQuickFilters.delete(filterId);
    } else {
      newQuickFilters.add(filterId);
    }

    // Update quick filters state (separate from filter state update)
    setActiveQuickFilters(newQuickFilters);

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
      // Update URL to keep in sync with useEffect that watches URL params
      if (isActive) {
        // Toggling OFF - remove the URL param
        router.replace("/recipes", { scroll: false });
      } else {
        // Toggling ON - add the URL param
        router.replace("/recipes?favoritesOnly=true", { scroll: false });
      }
    } else if (filter.type === "time") {
      setFilters((f) => ({
        ...f,
        maxCookTime: isActive ? null : (filter.value as number),
      }));
    } else if (filter.type === "new") {
      setFilters((f) => ({
        ...f,
        newDays: isActive ? null : (filter.value as number),
      }));
    }

    // Scroll to show content right below sticky header (only scroll up, not down)
    const contentEl = document.querySelector("[data-page-content]");
    const stickyHeader = document.querySelector("[data-sticky-header]");
    if (contentEl) {
      const contentTop = contentEl.getBoundingClientRect().top + window.scrollY;
      const headerHeight = stickyHeader?.getBoundingClientRect().height ?? 0;
      const targetScrollPosition = contentTop - headerHeight;

      if (window.scrollY > targetScrollPosition) {
        window.scrollTo({ top: targetScrollPosition, behavior: "smooth" });
      }
    }
  };

  // Build active filters list for display
  const activeFilters: ActiveFilter[] = useMemo(() => {
    const active: ActiveFilter[] = [];

    // Helper to find label from value
    const getCategoryLabel = (value: string) =>
      categoryOptions.find((c) => c.value === value)?.label ?? value;
    const getMealTypeLabel = (value: string) =>
      mealTypeOptions.find((m) => m.value === value)?.label ?? value;
    const getDietaryLabel = (value: string) =>
      dietaryOptions.find((d) => d.value === value)?.label ?? value;

    filters.categories.forEach((cat) => {
      active.push({ type: "category", value: cat, label: getCategoryLabel(cat) });
    });
    filters.mealTypes.forEach((type) => {
      active.push({ type: "mealType", value: type, label: getMealTypeLabel(type) });
    });
    filters.dietaryPreferences.forEach((pref) => {
      active.push({ type: "dietary", value: pref, label: getDietaryLabel(pref) });
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
    if (filters.newDays) {
      active.push({
        type: "new",
        value: String(filters.newDays),
        label: "New",
      });
    }

    return active;
  }, [filters, categoryOptions, mealTypeOptions, dietaryOptions]);

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

    // New recipes filter (created within last N days)
    if (filters.newDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.newDays);
      result = result.filter((recipe) => {
        if (!recipe.createdAt) return false;
        const createdDate = new Date(recipe.createdAt);
        return createdDate >= cutoffDate;
      });
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

  // Scroll to show content right below sticky header when filters change
  // Only scrolls UP to bring grid into view, never scrolls DOWN
  const scrollToResults = () => {
    const contentEl = document.querySelector("[data-page-content]");
    const stickyHeader = document.querySelector("[data-sticky-header]");

    if (contentEl) {
      const contentTop = contentEl.getBoundingClientRect().top + window.scrollY;
      const headerHeight = stickyHeader?.getBoundingClientRect().height ?? 0;
      const targetScrollPosition = contentTop - headerHeight;

      // Only scroll if user is below the target (needs to scroll up)
      if (window.scrollY > targetScrollPosition) {
        window.scrollTo({ top: targetScrollPosition, behavior: "smooth" });
      }
    }
  };

  const handleCategoryChange = (value: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      categories: checked
        ? [...prev.categories, value]
        : prev.categories.filter((c) => c !== value),
    }));
    scrollToResults();
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
    scrollToResults();
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
    scrollToResults();
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
        // Clear URL param
        if (searchParams.get("favoritesOnly")) {
          router.replace("/recipes", { scroll: false });
        }
        scrollToResults();
        break;
      case "time":
        setFilters((prev) => ({ ...prev, maxCookTime: null }));
        setActiveQuickFilters((prev) => {
          const next = new Set(prev);
          next.delete("under30");
          return next;
        });
        scrollToResults();
        break;
      case "new":
        setFilters((prev) => ({ ...prev, newDays: null }));
        setActiveQuickFilters((prev) => {
          const next = new Set(prev);
          next.delete("new");
          return next;
        });
        scrollToResults();
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
      newDays: null,
    });
    setSearchTerm("");
    setActiveQuickFilters(new Set());
    // Clear URL param if present
    if (searchParams.get("favoritesOnly")) {
      router.replace("/recipes", { scroll: false });
    }
  };

  const handleFavoritesFilterChange = (checked: boolean) => {
    // Update URL to stay in sync with the useEffect that watches searchParams
    if (checked) {
      router.replace("/recipes?favoritesOnly=true", { scroll: false });
    } else {
      router.replace("/recipes", { scroll: false });
    }
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
          <p className="text-muted-foreground">Loading recipes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="p-4 bg-destructive/10 rounded-full">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Failed to Load Recipes</h2>
          <p className="text-muted-foreground">{error}</p>
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
          quickFilterOptions={visibleQuickFilters}
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
          onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          activeFilters={activeFilters}
          onRemoveFilter={handleRemoveFilter}
          onClearAllFilters={handleClearAllFilters}
        />
      }
    >
      <div className="flex gap-3 md:gap-6">
        {/* Filter Sidebar - Desktop only */}
        {showFilters && (
          <aside className="hidden md:block w-64 flex-shrink-0">
            <Card>
              <CardContent className="pt-6">
                <FilterSidebarContent
                  filters={filters}
                  hasActiveFilters={hasActiveFilters}
                  onClearAllFilters={handleClearAllFilters}
                  onFavoritesChange={handleFavoritesFilterChange}
                  categoryOptions={categoryOptions}
                  mealTypeOptions={mealTypeOptions}
                  dietaryOptions={dietaryOptions}
                  onCategoryChange={handleCategoryChange}
                  onMealTypeChange={handleMealTypeChange}
                  onDietaryChange={handleDietaryChange}
                />
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
                <ChefHat className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Recipes Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
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

      {/* Mobile Filter Sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-[300px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Refine Results
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <FilterSidebarContent
              filters={filters}
              hasActiveFilters={hasActiveFilters}
              onClearAllFilters={handleClearAllFilters}
              onFavoritesChange={handleFavoritesFilterChange}
              categoryOptions={categoryOptions}
              mealTypeOptions={mealTypeOptions}
              dietaryOptions={dietaryOptions}
              onCategoryChange={handleCategoryChange}
              onMealTypeChange={handleMealTypeChange}
              onDietaryChange={handleDietaryChange}
            />
          </div>
        </SheetContent>
      </Sheet>
    </PageLayout>
  );
}
