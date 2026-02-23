"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLayout } from "@/components/layout/PageLayout";
import { FilterBar } from "@/components/common/FilterBar";
import { useRecipes, useToggleFavorite, useCategoryOptions } from "@/hooks/api";
import { useRecipeGroups } from "@/hooks/api/useRecipeGroups";
import { useRecipeFilters } from "@/hooks/forms";
import { mapRecipesForCards } from "@/lib/recipeCardMapper";
import {
  MEAL_TYPE_OPTIONS,
  DIETARY_PREFERENCES,
  QUICK_FILTERS,
  type QuickFilter,
} from "@/lib/constants";
import { useSettings, useRecipeFilterPersistence } from "@/hooks/persistence";
import type { RecipeCardData } from "@/types/recipe";
import type { ActiveFilter, FilterOption } from "@/lib/filterUtils";
import { RecipeSortControls, SORT_OPTIONS, type SortOption, type SortDirection } from "./browser/FilterSortControls";
import { useNavActions } from "@/lib/providers/NavActionsProvider";
import { cn } from "@/lib/utils";
import { RecipeGrid } from "./browser/RecipeGrid";
import { RecipeFilterSidebar } from "./browser/RecipeFilterSidebar";

// ============================================================================
// Constants
// ============================================================================

const SCROLL_POSITION_KEY = "recipe-browser-scroll-position";

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
  title?: string;
  description?: string;
}

function HeroSection({
  recipeCount,
  searchTerm,
  onSearchChange,
  onSearch,
  activeQuickFilters,
  onQuickFilterToggle,
  quickFilterOptions,
  title = "Find your next meal",
  description,
}: HeroSectionProps) {
  const defaultDescription = `Browse through your collection of ${recipeCount} saved recipes`;
  const displayDescription = description ?? defaultDescription;
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="relative w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/rb_hero_image.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          {displayDescription}
        </p>

        <div className="relative max-w-2xl mx-auto mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search saved recipes, ingredients, tags..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-12 pr-20 text-base bg-elevated/90 backdrop-blur-sm shadow-sm border-border text-foreground/80 placeholder:text-muted-foreground focus:border-primary"
          />
          {searchTerm.length > 0 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={onSearch}
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto">
          <FilterBar
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
// Props Interface
// ============================================================================

export type RecipeBrowserMode = "browse" | "select";

export interface RecipeBrowserViewProps {
  mode?: RecipeBrowserMode;
  onSelect?: (recipe: RecipeCardData) => void;
  selectedIds?: Set<string | number>;
  filterMealType?: "main" | "side" | null;
  heroTitle?: string;
  heroDescription?: string;
  onBack?: () => void;
  actionButton?: React.ReactNode;
}

// ============================================================================
// Main Component
// ============================================================================

export function RecipeBrowserView({
  mode = "browse",
  onSelect,
  selectedIds = new Set(),
  filterMealType = null,
  heroTitle,
  heroDescription,
  onBack,
  actionButton,
}: RecipeBrowserViewProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  const toggleFavoriteMutation = useToggleFavorite();
  const { saveFilterState, loadFilterState, clearFilterState } = useRecipeFilterPersistence();
  const restoredRef = useRef(false);

  // Load saved filter state (for back navigation restoration)
  const savedState = useMemo(() => {
    if (typeof window === "undefined") return null;
    if (mode === "select") return null;
    return loadFilterState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only check on mount

  const visibleQuickFilters = useMemo(() => {
    const selectedIds = settings.recipePreferences.quickFilters;
    return QUICK_FILTERS.filter((f) => selectedIds.includes(f.id));
  }, [settings.recipePreferences.quickFilters]);

  const initialFavoritesOnly = searchParams.get("favoritesOnly") === "true";

  const { data: recipesData, isLoading, error: queryError } = useRecipes();
  const { data: recipeGroups = [] } = useRecipeGroups();
  const { filterOptions: categoryOptions } = useCategoryOptions();

  const recipes = useMemo(() => {
    return recipesData ? mapRecipesForCards(recipesData) : [];
  }, [recipesData]);

  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to load recipes") : null;

  const mealTypeOptions = MEAL_TYPE_OPTIONS;
  const dietaryOptions = useMemo(() => [...DIETARY_PREFERENCES], []);
  const groupOptions: FilterOption[] = useMemo(() => {
    return recipeGroups.map((g) => ({ value: String(g.id), label: g.name }));
  }, [recipeGroups]);

  // --------------------------------------------------------------------------
  // Recipe Filter Hook
  // --------------------------------------------------------------------------

  const {
    filters,
    activeQuickFilters,
    hasActiveFilters: hookHasActiveFilters,
    activeFiltersList,
    setSearchTerm,
    toggleCategory,
    toggleMealType,
    toggleDietary,
    toggleGroup,
    toggleQuickFilter,
    removeActiveFilter,
    clearAll,
    setFilters,
    setActiveQuickFilters,
    applyTo,
  } = useRecipeFilters({
    initialFilters: (() => {
      if (savedState?.filters) {
        return {
          ...savedState.filters,
          searchTerm: savedState.searchTerm ?? "",
          favoritesOnly: initialFavoritesOnly || savedState.filters.favoritesOnly,
          mealTypes: filterMealType === "side" ? ["side"] : savedState.filters.mealTypes,
        };
      }
      return {
        searchTerm: "",
        categories: [] as string[],
        mealTypes: filterMealType === "side" ? ["side"] : ([] as string[]),
        dietaryPreferences: [] as string[],
        groupIds: [] as number[],
        favoritesOnly: initialFavoritesOnly,
        maxCookTime: null,
        newDays: null,
      };
    })(),
    initialQuickFilters: (() => {
      if (savedState?.activeQuickFilters) {
        const result = [...savedState.activeQuickFilters];
        if (initialFavoritesOnly && !result.includes("favorites")) {
          result.push("favorites");
        }
        return result;
      }
      return initialFavoritesOnly ? ["favorites"] : [];
    })(),
    onClearAll: () => {
      clearFilterState();
      if (mode === "browse" && searchParams.get("favoritesOnly")) {
        router.replace("/recipes", { scroll: false });
      }
    },
    filterOptions: { categoryOptions, mealTypeOptions, dietaryOptions, groupOptions },
  });

  // --------------------------------------------------------------------------
  // Sort & UI State
  // --------------------------------------------------------------------------

  const getInitialSortOption = (): SortOption => {
    const settingValue = settings.recipePreferences.defaultSortOrder;
    if (settingValue === "recent") return "createdAt";
    return settingValue;
  };

  const [sortBy, setSortBy] = useState<SortOption>(
    () => savedState?.sortBy ?? getInitialSortOption()
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    () => savedState?.sortDirection ?? "asc"
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  // --------------------------------------------------------------------------
  // Nav-pinned sort controls (browse mode only)
  // --------------------------------------------------------------------------

  const sortControlsRef = useRef<HTMLDivElement>(null);
  const { setNavActions, setPinned, clearNavActions } = useNavActions();

  // Register compact filter + sort controls with the nav bar.
  // Split into two effects: one updates content on state changes (no cleanup),
  // the other clears nav actions only on unmount / mode change.
  const filterCount = activeFiltersList.length;
  useEffect(() => {
    if (mode !== "browse") return;

    setNavActions(
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen((prev) => !prev)}
          data-filter-toggle
          className={cn(
            "gap-2",
            filterCount > 0 && "border-primary/50 bg-primary/5"
          )}
        >
          <SlidersHorizontal className="size-4" strokeWidth={1.5} />
          Filters
          {filterCount > 0 && (
            <span className="min-w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center justify-center px-1.5">
              {filterCount}
            </span>
          )}
        </Button>

        <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortOption); scrollToList(); }}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <option.icon className="size-4" strokeWidth={1.5} />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => { setSortDirection((prev) => (prev === "asc" ? "desc" : "asc")); scrollToList(); }}
          className="h-9 w-9"
          aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
        >
          {sortDirection === "asc" ? (
            <ArrowUp className="size-4" strokeWidth={1.5} />
          ) : (
            <ArrowDown className="size-4" strokeWidth={1.5} />
          )}
        </Button>
      </div>
    );
  }, [mode, sortBy, sortDirection, filterCount, setNavActions]);

  // Clear nav actions on unmount or when leaving browse mode
  useEffect(() => {
    if (mode !== "browse") return;
    return () => clearNavActions();
  }, [mode, clearNavActions]);

  // Observe when in-page sort controls scroll behind the nav bar
  // isLoading is a dependency so the observer re-initialises once the
  // sort controls div actually mounts (it doesn't exist during loading)
  useEffect(() => {
    if (mode !== "browse" || !sortControlsRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPinned(!entry.isIntersecting),
      { rootMargin: "-64px 0px 0px 0px", threshold: 0 }
    );

    observer.observe(sortControlsRef.current);
    return () => observer.disconnect();
  }, [mode, setPinned, isLoading]);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  // Sync favorites filter with URL param changes
  useEffect(() => {
    if (mode === "select") return;
    const urlFavoritesOnly = searchParams.get("favoritesOnly") === "true";
    if (urlFavoritesOnly !== filters.favoritesOnly) {
      setFilters((prev) => ({ ...prev, favoritesOnly: urlFavoritesOnly }));
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
  }, [mode, searchParams, filters.favoritesOnly, setFilters, setActiveQuickFilters]);

  // Clear saved filter state after restoration
  useEffect(() => {
    if (mode === "select") return;
    if (savedState && !restoredRef.current) {
      restoredRef.current = true;
      clearFilterState();
    }
  }, [savedState, clearFilterState, mode]);

  // Scroll position restore on back navigation
  useEffect(() => {
    if (mode === "select") return;
    if (!isLoading && recipes.length > 0) {
      const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedPosition) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedPosition, 10));
          sessionStorage.removeItem(SCROLL_POSITION_KEY);
        });
      }
    }
  }, [mode, isLoading, recipes.length]);

  // --------------------------------------------------------------------------
  // Handlers (thin wrappers for component-level concerns)
  // --------------------------------------------------------------------------

  // Quick filter toggle with URL sync for favorites
  const handleQuickFilterToggle = (filterId: string) => {
    const filter = QUICK_FILTERS.find((f) => f.id === filterId);
    if (!filter) return;

    const wasActive = activeQuickFilters.has(filterId);
    toggleQuickFilter(filterId);

    if (filter.type === "favorite" && mode === "browse") {
      router.replace(
        wasActive ? "/recipes" : "/recipes?favoritesOnly=true",
        { scroll: false }
      );
    }
  };

  // Remove filter with URL sync for favorites
  const handleRemoveFilter = (filter: ActiveFilter) => {
    removeActiveFilter(filter);
    if (filter.type === "favorite" && mode === "browse" && searchParams.get("favoritesOnly")) {
      router.replace("/recipes", { scroll: false });
    }
  };

  // Favorites sidebar toggle — browse mode uses URL, select mode sets directly
  const handleFavoritesFilterChange = (checked: boolean) => {
    if (mode === "browse") {
      router.replace(
        checked ? "/recipes?favoritesOnly=true" : "/recipes",
        { scroll: false }
      );
    } else {
      setFilters((prev) => ({ ...prev, favoritesOnly: checked }));
    }
  };

  const handleRecipeClick = (recipe: RecipeCardData) => {
    if (mode === "select") {
      onSelect?.(recipe);
    } else {
      sessionStorage.setItem(SCROLL_POSITION_KEY, String(window.scrollY));
      saveFilterState({
        filters,
        searchTerm: filters.searchTerm,
        activeQuickFilters: Array.from(activeQuickFilters),
        sortBy,
        sortDirection,
      });
      router.push(`/recipes/${recipe.id}`);
    }
  };

  const handleFavoriteToggle = (recipe: RecipeCardData) => {
    toggleFavoriteMutation.mutate(Number(recipe.id));
  };

  const scrollToList = () => {
    sortControlsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    scrollToList();
  };

  // --------------------------------------------------------------------------
  // Derived State
  // --------------------------------------------------------------------------

  const filteredRecipes = useMemo(() => {
    const result = applyTo(recipes);
    return [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "alphabetical":
          comparison = a.name.localeCompare(b.name);
          break;
        case "cookTime":
          comparison = (a.totalTime || 0) - (b.totalTime || 0);
          break;
        case "createdAt":
          comparison = Number(a.id) - Number(b.id);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [applyTo, recipes, sortBy, sortDirection]);

  const hasActiveFilters = hookHasActiveFilters || filters.searchTerm.length > 0;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  if (isLoading) {
    return (
      <PageLayout
        hero={<Skeleton className="h-48 w-full" shape="none" />}
      >
        <div className="mb-6"><Skeleton className="h-12 w-full" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} size="card" className="h-64" />
          ))}
        </div>
        <span className="sr-only">Loading recipes...</span>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 bg-background">
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
      hero={
        <HeroSection
          recipeCount={recipes.length}
          searchTerm={filters.searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={() => {}}
          activeQuickFilters={activeQuickFilters}
          onQuickFilterToggle={handleQuickFilterToggle}
          quickFilterOptions={visibleQuickFilters}
          title={heroTitle}
          description={heroDescription}
        />
      }
    >
      {/* Static filter/sort row (scrolls with page, observed for nav pinning) */}
      <div ref={mode === "browse" ? sortControlsRef : undefined} className="mb-6 scroll-mt-20">
        <RecipeSortControls
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={(v) => { setSortBy(v); scrollToList(); }}
          onSortDirectionToggle={toggleSortDirection}
          onOpenFilters={() => setFiltersOpen((prev) => !prev)}
          activeFilters={activeFiltersList}
          onRemoveFilter={handleRemoveFilter}
          onClearAllFilters={clearAll}
          onBack={onBack}
          actionButton={actionButton}
        />
      </div>

      <RecipeFilterSidebar
        filters={filters}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        onCategoryChange={(value) => toggleCategory(value)}
        onMealTypeChange={(value) => toggleMealType(value)}
        onDietaryChange={(value) => toggleDietary(value)}
        onGroupChange={(value) => toggleGroup(value)}
        onFavoritesChange={handleFavoritesFilterChange}
        onClearAll={clearAll}
        categoryOptions={categoryOptions}
        mealTypeOptions={mealTypeOptions}
        dietaryOptions={dietaryOptions}
        groupOptions={groupOptions}
      />
      <RecipeGrid
        recipes={filteredRecipes}
        hasActiveFilters={hasActiveFilters}
        onRecipeClick={handleRecipeClick}
        onFavoriteToggle={handleFavoriteToggle}
        onClearFilters={clearAll}
        selectionMode={mode === "select"}
        selectedIds={selectedIds}
      />
    </PageLayout>
  );
}
