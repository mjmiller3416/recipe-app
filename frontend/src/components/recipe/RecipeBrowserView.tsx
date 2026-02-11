"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout/PageLayout";
import { FilterBar } from "@/components/common/FilterBar";
import { useRecipes, useToggleFavorite, useCategoryOptions } from "@/hooks/api";
import { useRecipeGroups } from "@/hooks/api/useRecipeGroups";
import { applyFilters } from "@/lib/filterUtils";
import { mapRecipesForCards } from "@/lib/recipeCardMapper";
import {
  MEAL_TYPE_OPTIONS,
  DIETARY_PREFERENCES,
  QUICK_FILTERS,
  type QuickFilter,
} from "@/lib/constants";
import { useSettings, useRecipeFilterPersistence } from "@/hooks/persistence";
import type { RecipeCardData } from "@/types/recipe";
import { RecipeSortControls, type SortOption, type SortDirection, type ActiveFilter } from "./browser/RecipeSortControls";
import { RecipeGrid } from "./browser/RecipeGrid";
import { RecipeFilters, type FilterState, type FilterOption } from "./browser/RecipeFilters";

// ============================================================================
// Constants
// ============================================================================

const SCROLL_POSITION_KEY = "recipe-browser-scroll-position";
const FILTER_VISIBILITY_KEY = "recipe-browser-show-filters";

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

        <div className="flex gap-3 max-w-2xl mx-auto mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search saved recipes, ingredients, tags..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-12 text-base bg-elevated/90 backdrop-blur-sm border-border/50 focus:border-primary"
            />
          </div>
          <Button onClick={onSearch} size="lg">
            Search
          </Button>
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

  const [searchTerm, setSearchTerm] = useState(() => savedState?.searchTerm ?? "");
  const [filters, setFilters] = useState<FilterState>(() => {
    if (savedState?.filters) {
      return {
        ...savedState.filters,
        // URL param takes precedence
        favoritesOnly: initialFavoritesOnly || savedState.filters.favoritesOnly,
        // Prop-enforced mealType takes precedence
        mealTypes: filterMealType === "side" ? ["side"] : savedState.filters.mealTypes,
      };
    }
    return {
      categories: [],
      mealTypes: filterMealType === "side" ? ["side"] : [],
      dietaryPreferences: [],
      groupIds: [],
      favoritesOnly: initialFavoritesOnly,
      maxCookTime: null,
      newDays: null,
    };
  });

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
  const [showFilters, setShowFilters] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(FILTER_VISIBILITY_KEY);
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(() => {
    if (savedState?.activeQuickFilters) {
      const set = new Set(savedState.activeQuickFilters);
      // Ensure consistency with URL param
      if (initialFavoritesOnly) set.add("favorites");
      return set;
    }
    return initialFavoritesOnly ? new Set(["favorites"]) : new Set();
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
  }, [mode, searchParams, filters.favoritesOnly]);

  // Clear saved filter state after restoration to prevent stale data on refresh
  useEffect(() => {
    if (mode === "select") return;
    if (savedState && !restoredRef.current) {
      restoredRef.current = true;
      clearFilterState();
    }
  }, [savedState, clearFilterState, mode]);

  useEffect(() => {
    sessionStorage.setItem(FILTER_VISIBILITY_KEY, String(showFilters));
  }, [showFilters]);

  const handleQuickFilterToggle = (filterId: string) => {
    const filter = QUICK_FILTERS.find((f) => f.id === filterId);
    if (!filter) return;

    const isActive = activeQuickFilters.has(filterId);
    const newQuickFilters = new Set(activeQuickFilters);

    if (isActive) {
      newQuickFilters.delete(filterId);
    } else {
      newQuickFilters.add(filterId);
    }

    setActiveQuickFilters(newQuickFilters);

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
      if (mode === "browse") {
        if (isActive) {
          router.replace("/recipes", { scroll: false });
        } else {
          router.replace("/recipes?favoritesOnly=true", { scroll: false });
        }
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

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const active: ActiveFilter[] = [];

    const getCategoryLabel = (value: string) =>
      categoryOptions.find((c) => c.value === value)?.label ?? value;
    const getMealTypeLabel = (value: string) =>
      mealTypeOptions.find((m) => m.value === value)?.label ?? value;
    const getDietaryLabel = (value: string) =>
      dietaryOptions.find((d) => d.value === value)?.label ?? value;
    const getGroupLabel = (value: number) =>
      groupOptions.find((g) => g.value === String(value))?.label ?? `Group ${value}`;

    filters.categories.forEach((cat) => {
      active.push({ type: "category", value: cat, label: getCategoryLabel(cat) });
    });
    filters.mealTypes.forEach((type) => {
      active.push({ type: "mealType", value: type, label: getMealTypeLabel(type) });
    });
    filters.dietaryPreferences.forEach((pref) => {
      active.push({ type: "dietary", value: pref, label: getDietaryLabel(pref) });
    });
    filters.groupIds.forEach((groupId) => {
      active.push({ type: "group", value: String(groupId), label: getGroupLabel(groupId) });
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
  }, [filters, categoryOptions, mealTypeOptions, dietaryOptions, groupOptions]);

  const filteredRecipes = useMemo(() => {
    let result = applyFilters(recipes, {
      searchTerm,
      categories: filters.categories,
      mealTypes: filters.mealTypes,
      dietaryPreferences: filters.dietaryPreferences,
      groups: filters.groupIds,
      favoritesOnly: filters.favoritesOnly,
      maxCookTime: filters.maxCookTime,
      newDays: filters.newDays,
    });

    result = [...result].sort((a, b) => {
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

    return result;
  }, [recipes, searchTerm, filters, sortBy, sortDirection]);

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

  const handleRecipeClick = (recipe: RecipeCardData) => {
    if (mode === "select") {
      onSelect?.(recipe);
    } else {
      // Save scroll position
      sessionStorage.setItem(SCROLL_POSITION_KEY, String(window.scrollY));
      // Save filter state for back navigation restoration
      saveFilterState({
        filters,
        searchTerm,
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

  const scrollToResults = () => {
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

  const handleGroupChange = (value: number, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      groupIds: checked
        ? [...prev.groupIds, value]
        : prev.groupIds.filter((g) => g !== value),
    }));
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
      case "group":
        handleGroupChange(Number(filter.value), false);
        break;
      case "favorite":
        setFilters((prev) => ({ ...prev, favoritesOnly: false }));
        setActiveQuickFilters((prev) => {
          const next = new Set(prev);
          next.delete("favorites");
          return next;
        });
        if (mode === "browse" && searchParams.get("favoritesOnly")) {
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
      groupIds: [],
      favoritesOnly: false,
      maxCookTime: null,
      newDays: null,
    });
    setSearchTerm("");
    setActiveQuickFilters(new Set());
    // Clear saved filter state so cleared state persists on back navigation
    clearFilterState();
    if (mode === "browse" && searchParams.get("favoritesOnly")) {
      router.replace("/recipes", { scroll: false });
    }
  };

  const handleFavoritesFilterChange = (checked: boolean) => {
    if (mode === "browse") {
      if (checked) {
        router.replace("/recipes?favoritesOnly=true", { scroll: false });
      } else {
        router.replace("/recipes", { scroll: false });
      }
    } else {
      setFilters((prev) => ({ ...prev, favoritesOnly: checked }));
    }
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const hasActiveFilters = activeFilters.length > 0 || searchTerm.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading recipes...</p>
        </div>
      </div>
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

  const mainContent = (
    <>
      <div className="flex gap-3 md:gap-6">
        <RecipeFilters
          filters={filters}
          showFilters={showFilters}
          mobileFiltersOpen={mobileFiltersOpen}
          onMobileFiltersChange={setMobileFiltersOpen}
          onCategoryChange={handleCategoryChange}
          onMealTypeChange={handleMealTypeChange}
          onDietaryChange={handleDietaryChange}
          onGroupChange={handleGroupChange}
          onFavoritesChange={handleFavoritesFilterChange}
          onClearAll={handleClearAllFilters}
          categoryOptions={categoryOptions}
          mealTypeOptions={mealTypeOptions}
          dietaryOptions={dietaryOptions}
          groupOptions={groupOptions}
        />

        <div className="flex-1 min-w-0">
          <RecipeGrid
            recipes={filteredRecipes}
            hasActiveFilters={hasActiveFilters}
            onRecipeClick={handleRecipeClick}
            onFavoriteToggle={handleFavoriteToggle}
            onClearFilters={handleClearAllFilters}
            selectionMode={mode === "select"}
            selectedIds={selectedIds}
          />
        </div>
      </div>
    </>
  );

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
          title={heroTitle}
          description={heroDescription}
        />
      }
      stickyHeader={
        <RecipeSortControls
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
          onBack={onBack}
          actionButton={actionButton}
        />
      }
    >
      {mainContent}
    </PageLayout>
  );
}
