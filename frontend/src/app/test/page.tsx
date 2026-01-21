"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  X,
  ChefHat,
  Clock,
  Users,
  Heart,
  Bookmark,
  ArrowLeft,
  Check,
  UtensilsCrossed,
  Salad,
  Filter,
  LucideIcon,
} from "lucide-react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Recipe {
  id: number;
  name: string;
  category: string;
  type: string;
  servings: number;
  time: number;
  image: string;
  isFavorite: boolean;
  isSide: boolean;
}

interface SavedMeal {
  id: number;
  name: string;
  main: Recipe;
  sides: Recipe[];
  timesCooked: number;
  lastCooked: string;
  isFavorite: boolean;
}

interface Filters {
  category: string;
  type: string;
  favoritesOnly: boolean;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockRecipes: Recipe[] = [
  { id: 1, name: "Tacos", category: "dinner", type: "Mexican", servings: 4, time: 30, image: "🌮", isFavorite: true, isSide: false },
  { id: 2, name: "BBQ Burgers", category: "dinner", type: "American", servings: 4, time: 35, image: "🍔", isFavorite: false, isSide: false },
  { id: 3, name: "Bacon Garlicy Chicken Thighs", category: "dinner", type: "American", servings: 4, time: 90, image: "🍗", isFavorite: true, isSide: false },
  { id: 4, name: "Pasta Carbonara", category: "dinner", type: "Italian", servings: 4, time: 25, image: "🍝", isFavorite: false, isSide: false },
  { id: 5, name: "Grilled Salmon", category: "dinner", type: "Seafood", servings: 2, time: 20, image: "🐟", isFavorite: true, isSide: false },
  { id: 6, name: "Stir Fry Chicken", category: "dinner", type: "Asian", servings: 4, time: 25, image: "🥡", isFavorite: false, isSide: false },
  { id: 7, name: "Simple Street Corn", category: "side", type: "Mexican", servings: 4, time: 15, image: "🌽", isFavorite: false, isSide: true },
  { id: 8, name: "Caesar Salad", category: "side", type: "American", servings: 4, time: 10, image: "🥗", isFavorite: true, isSide: true },
  { id: 9, name: "Garlic Bread", category: "side", type: "Italian", servings: 6, time: 12, image: "🍞", isFavorite: false, isSide: true },
  { id: 10, name: "Roasted Vegetables", category: "side", type: "American", servings: 4, time: 30, image: "🥕", isFavorite: false, isSide: true },
  { id: 11, name: "Mac & Cheese", category: "side", type: "American", servings: 6, time: 25, image: "🧀", isFavorite: true, isSide: true },
  { id: 12, name: "French Fries", category: "side", type: "American", servings: 4, time: 20, image: "🍟", isFavorite: false, isSide: true },
  { id: 13, name: "Coleslaw", category: "side", type: "American", servings: 8, time: 15, image: "🥬", isFavorite: false, isSide: true },
  { id: 14, name: "Rice Pilaf", category: "side", type: "Mediterranean", servings: 6, time: 25, image: "🍚", isFavorite: false, isSide: true },
];

const mockSavedMeals: SavedMeal[] = [
  { id: 1, name: "Taco Night", main: mockRecipes[0], sides: [mockRecipes[6]], timesCooked: 12, lastCooked: "2 weeks ago", isFavorite: true },
  { id: 2, name: "Burger Bash", main: mockRecipes[1], sides: [mockRecipes[11], mockRecipes[12]], timesCooked: 8, lastCooked: "1 month ago", isFavorite: false },
  { id: 3, name: "Italian Dinner", main: mockRecipes[3], sides: [mockRecipes[8], mockRecipes[7]], timesCooked: 5, lastCooked: "3 weeks ago", isFavorite: true },
  { id: 4, name: "Quick Salmon", main: mockRecipes[4], sides: [mockRecipes[9]], timesCooked: 3, lastCooked: "1 week ago", isFavorite: false },
];

const categories = ["All", "Beef", "Chicken", "Pork", "Seafood", "Vegetarian"];
const mealTypes = ["All", "Mexican", "Italian", "American", "Asian", "Mediterranean"];

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function Badge({ children, variant = "default", className = "" }: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "muted" | "success";
  className?: string;
}) {
  const variants = {
    default: "bg-primary-surface text-primary-on-surface border-primary-muted",
    secondary: "bg-secondary-surface text-secondary-on-surface border-secondary-muted",
    muted: "bg-muted text-muted-foreground border-border",
    success: "bg-success-surface text-success border-success-surface-border",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

function Button({ children, variant = "default", size = "md", className = "", disabled, ...props }: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    default: "bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-glow-primary",
    secondary: "bg-secondary hover:bg-secondary-hover text-secondary-foreground shadow-lg shadow-glow-secondary",
    outline: "border-2 border-border hover:border-primary hover:bg-primary-surface text-foreground-subtle",
    ghost: "hover:bg-hover text-muted-foreground hover:text-foreground",
    destructive: "bg-destructive/20 hover:bg-destructive/30 text-error border border-destructive/30",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "p-2",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200
        ${variants[variant]} ${sizes[size]}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, interactive, selected, className = "", ...props }: {
  children: React.ReactNode;
  interactive?: boolean;
  selected?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`
        bg-elevated/60 backdrop-blur-sm rounded-2xl border border-border
        ${interactive ? "cursor-pointer liftable" : ""}
        ${selected ? "ring-2 ring-primary shadow-glow-primary" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

function Input({ icon: Icon, className = "", ...props }: {
  icon?: LucideIcon;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      )}
      <input
        className={`
          w-full bg-input border border-border rounded-xl
          px-4 py-3 ${Icon ? "pl-12" : ""} text-foreground placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring/50
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
    </div>
  );
}

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

function Tabs({ tabs, activeTab, onTabChange }: {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  return (
    <div className="flex bg-elevated/60 rounded-xl p-1 border border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
            text-sm font-medium transition-all duration-200
            ${activeTab === tab.id
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-muted-foreground hover:text-foreground hover:bg-hover/50"
            }
          `}
        >
          {tab.icon && <tab.icon className="w-4 h-4" />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function FilterChip({ label, active, onClick }: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
        ${active
          ? "bg-primary text-primary-foreground"
          : "bg-elevated/60 text-muted-foreground hover:text-foreground hover:bg-hover border border-border"
        }
      `}
    >
      {label}
    </button>
  );
}

// ============================================================================
// RECIPE CARD COMPONENT
// ============================================================================

function RecipeSelectCard({ recipe, isSelected, onSelect, selectionType }: {
  recipe: Recipe;
  isSelected: boolean;
  onSelect: (recipe: Recipe) => void;
  selectionType: "main" | "side";
}) {
  const isMain = selectionType === "main";

  return (
    <Card
      interactive
      selected={isSelected}
      onClick={() => onSelect(recipe)}
      className={`overflow-hidden group animate-scale-in ${isSelected ? "animate-bounce-subtle" : ""}`}
      style={{ animationDelay: `${recipe.id * 30}ms` }}
    >
      {/* Image Section */}
      <div className="relative h-32 bg-gradient-to-br from-hover to-elevated overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300">
          {recipe.image}
        </div>

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg animate-scale-in">
            <Check className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
        )}

        {/* Favorite indicator */}
        {recipe.isFavorite && (
          <div className="absolute top-3 left-3 w-7 h-7 bg-overlay backdrop-blur-sm rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-error fill-current" />
          </div>
        )}

        {/* Type badge */}
        <div className="absolute bottom-3 left-3">
          <Badge variant={recipe.isSide ? "secondary" : "default"}>
            {recipe.isSide ? "Side" : "Main"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-base mb-2 truncate group-hover:text-primary-light transition-colors">
          {recipe.name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {recipe.servings}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {recipe.time}m
          </span>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// SAVED MEAL CARD COMPONENT
// ============================================================================

function SavedMealCard({ meal, onSelect }: {
  meal: SavedMeal;
  onSelect: (meal: SavedMeal) => void;
}) {
  return (
    <Card
      interactive
      onClick={() => onSelect(meal)}
      className="overflow-hidden group animate-slide-up"
      style={{ animationDelay: `${meal.id * 50}ms` }}
    >
      <div className="flex">
        {/* Main dish image */}
        <div className="relative w-28 h-28 bg-gradient-to-br from-hover to-elevated flex-shrink-0 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
            {meal.main.image}
          </div>
          {meal.isFavorite && (
            <div className="absolute top-2 left-2 w-6 h-6 bg-overlay backdrop-blur-sm rounded-full flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-error fill-current" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          <h3 className="font-semibold text-foreground text-base mb-1 truncate group-hover:text-primary-light transition-colors">
            {meal.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">{meal.main.name}</p>

          {/* Sides preview */}
          <div className="flex items-center gap-2 mb-2">
            {meal.sides.map((side, i) => (
              <span key={i} className="text-lg" title={side.name}>
                {side.image}
              </span>
            ))}
            {meal.sides.length === 0 && (
              <span className="text-xs text-foreground-disabled">No sides</span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-foreground-disabled">
            <span className="flex items-center gap-1">
              <ChefHat className="w-3.5 h-3.5" />
              {meal.timesCooked}× cooked
            </span>
            <span>•</span>
            <span>{meal.lastCooked}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// MEAL PREVIEW PANEL COMPONENT
// ============================================================================

function MealPreviewPanel({ mainDish, sides, onRemoveMain, onRemoveSide, onAddToQueue }: {
  mainDish: Recipe | null;
  sides: Recipe[];
  onRemoveMain: () => void;
  onRemoveSide: (id: number) => void;
  onAddToQueue: () => void;
}) {
  const totalTime = (mainDish?.time || 0) + sides.reduce((acc, s) => acc + s.time, 0);
  const avgServings = mainDish ? Math.round((mainDish.servings + sides.reduce((acc, s) => acc + s.servings, 0)) / (1 + sides.length)) : 0;

  const isComplete = !!mainDish;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center">
          <UtensilsCrossed className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Meal Preview</h2>
          <p className="text-sm text-muted-foreground">Build your perfect meal</p>
        </div>
      </div>

      {/* Main Dish Section */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block flex items-center gap-2">
          <ChefHat className="w-4 h-4" />
          Main Dish
          {!mainDish && <span className="text-primary">*required</span>}
        </label>

        {mainDish ? (
          <div className="animate-scale-in">
            <Card className="p-4 border-primary-muted bg-primary-surface">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-hover to-elevated flex items-center justify-center text-3xl">
                  {mainDish.image}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{mainDish.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {mainDish.servings}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {mainDish.time}m
                    </span>
                  </div>
                </div>
                <button
                  onClick={onRemoveMain}
                  className="w-8 h-8 rounded-lg bg-error/10 hover:bg-error/20 flex items-center justify-center text-error transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center animate-pulse-soft">
            <ChefHat className="w-10 h-10 text-foreground-disabled mx-auto mb-2" />
            <p className="text-sm text-foreground-disabled">Select a main dish to get started</p>
          </div>
        )}
      </div>

      {/* Sides Section */}
      <div className="flex-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block flex items-center gap-2">
          <Salad className="w-4 h-4" />
          Sides
          <span className="text-foreground-disabled font-normal">({sides.length}/3)</span>
        </label>

        <div className="space-y-2">
          {sides.map((side, index) => (
            <div key={side.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <Card className="p-3 border-secondary-muted bg-secondary-surface">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-hover to-elevated flex items-center justify-center text-2xl">
                    {side.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm truncate">{side.name}</h4>
                    <p className="text-xs text-muted-foreground">{side.time}m</p>
                  </div>
                  <button
                    onClick={() => onRemoveSide(side.id)}
                    className="w-7 h-7 rounded-lg bg-error/10 hover:bg-error/20 flex items-center justify-center text-error transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            </div>
          ))}

          {/* Empty side slots */}
          {Array.from({ length: 3 - sides.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="border border-dashed border-border-subtle rounded-xl p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Plus className="w-4 h-4 text-foreground-disabled" />
              </div>
              <p className="text-sm text-foreground-disabled">Add a side dish</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      {mainDish && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-elevated/60 rounded-xl p-3 text-center">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-semibold text-foreground">{totalTime}m</p>
              <p className="text-xs text-foreground-disabled">Total Time</p>
            </div>
            <div className="bg-elevated/60 rounded-xl p-3 text-center">
              <Users className="w-5 h-5 text-secondary mx-auto mb-1" />
              <p className="text-lg font-semibold text-foreground">{avgServings}</p>
              <p className="text-xs text-foreground-disabled">Avg Servings</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-auto pt-4">
        <Button
          variant="default"
          size="lg"
          className={`w-full ${isComplete ? "animate-glow" : ""}`}
          disabled={!isComplete}
        >
          <Plus className="w-5 h-5" />
          Add to Meal Queue
        </Button>

        {!isComplete && (
          <p className="text-xs text-center text-foreground-disabled mt-2">
            Select a main dish to continue
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FILTER SIDEBAR COMPONENT
// ============================================================================

function FilterSidebar({ filters, onFilterChange, showSidesOnly, onToggleSidesOnly }: {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  showSidesOnly: boolean;
  onToggleSidesOnly: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Favorites Toggle */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className={`
            w-12 h-7 rounded-full p-1 transition-colors duration-200
            ${filters.favoritesOnly ? "bg-primary" : "bg-neutral"}
          `}>
            <div className={`
              w-5 h-5 rounded-full bg-foreground shadow transition-transform duration-200
              ${filters.favoritesOnly ? "translate-x-5" : "translate-x-0"}
            `} />
          </div>
          <div className="flex items-center gap-2">
            <Heart className={`w-4 h-4 ${filters.favoritesOnly ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm text-foreground-subtle group-hover:text-foreground transition-colors">Favorites Only</span>
          </div>
        </label>
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Category
        </h4>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={filters.category === cat}
              onClick={() => onFilterChange({ ...filters, category: cat })}
            />
          ))}
        </div>
      </div>

      {/* Cuisine Type Filter */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Cuisine Type
        </h4>
        <div className="flex flex-wrap gap-2">
          {mealTypes.map((type) => (
            <FilterChip
              key={type}
              label={type}
              active={filters.type === type}
              onClick={() => onFilterChange({ ...filters, type: type })}
            />
          ))}
        </div>
      </div>

      {/* Show Sides Only Toggle */}
      <div className="pt-4 border-t border-border">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className={`
            w-12 h-7 rounded-full p-1 transition-colors duration-200
            ${showSidesOnly ? "bg-secondary" : "bg-neutral"}
          `}>
            <div className={`
              w-5 h-5 rounded-full bg-foreground shadow transition-transform duration-200
              ${showSidesOnly ? "translate-x-5" : "translate-x-0"}
            `} />
          </div>
          <div className="flex items-center gap-2">
            <Salad className={`w-4 h-4 ${showSidesOnly ? "text-secondary" : "text-muted-foreground"}`} />
            <span className="text-sm text-foreground-subtle group-hover:text-foreground transition-colors">Show Sides Only</span>
          </div>
        </label>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN CREATE MEAL PAGE COMPONENT
// ============================================================================

export default function CreateMealPage() {
  // State
  const [mode, setMode] = useState<"create" | "saved">("create");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMain, setSelectedMain] = useState<Recipe | null>(null);
  const [selectedSides, setSelectedSides] = useState<Recipe[]>([]);
  const [filters, setFilters] = useState<Filters>({ category: "All", type: "All", favoritesOnly: false });
  const [showSidesOnly, setShowSidesOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  
  // Computed values
  const filteredRecipes = mockRecipes.filter((recipe) => {
    // Search filter
    if (searchQuery && !recipe.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Category filter
    if (filters.category !== "All" && recipe.type !== filters.category) {
      return false;
    }
    // Type filter
    if (filters.type !== "All" && recipe.type !== filters.type) {
      return false;
    }
    // Favorites filter
    if (filters.favoritesOnly && !recipe.isFavorite) {
      return false;
    }
    // Sides only filter
    if (showSidesOnly && !recipe.isSide) {
      return false;
    }
    return true;
  });
  
  const filteredSavedMeals = mockSavedMeals.filter((meal) => {
    if (searchQuery && !meal.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filters.favoritesOnly && !meal.isFavorite) {
      return false;
    }
    return true;
  });
  
  // Handlers
  const handleModeChange = (id: string) => {
    setMode(id as "create" | "saved");
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    if (recipe.isSide) {
      // Toggle side selection
      if (selectedSides.find(s => s.id === recipe.id)) {
        setSelectedSides(selectedSides.filter(s => s.id !== recipe.id));
      } else if (selectedSides.length < 3) {
        setSelectedSides([...selectedSides, recipe]);
      }
    } else {
      // Toggle main selection
      if (selectedMain?.id === recipe.id) {
        setSelectedMain(null);
      } else {
        setSelectedMain(recipe);
      }
    }
  };
  
  const handleSelectSavedMeal = (meal: SavedMeal) => {
    setSelectedMain(meal.main);
    setSelectedSides(meal.sides);
    setMode("create"); // Switch to create mode to show the selected meal
  };
  
  const handleRemoveMain = () => setSelectedMain(null);
  const handleRemoveSide = (sideId: number) => setSelectedSides(selectedSides.filter(s => s.id !== sideId));
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Create Meal</h1>
                <p className="text-sm text-muted-foreground">Add a new meal to your weekly queue</p>
              </div>
            </div>

            {/* Right: Mode Tabs */}
            <Tabs
              tabs={[
                { id: "create", label: "Create New", icon: Plus },
                { id: "saved", label: "Use Saved", icon: Bookmark },
              ]}
              activeTab={mode}
              onTabChange={handleModeChange}
            />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left Panel: Filters (Create Mode) or Search Results */}
          <div className={`
            transition-all duration-300 ease-out
            ${showFilters ? "w-64 opacity-100" : "w-0 opacity-0 overflow-hidden"}
          `}>
            <Card className="p-5 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  Refine Results
                </h3>
                <button
                  onClick={() => setFilters({ category: "All", type: "All", favoritesOnly: false })}
                  className="text-xs text-primary hover:text-primary-light transition-colors"
                >
                  Reset
                </button>
              </div>
              
              <FilterSidebar
                filters={filters}
                onFilterChange={setFilters}
                showSidesOnly={showSidesOnly}
                onToggleSidesOnly={() => setShowSidesOnly(!showSidesOnly)}
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-primary-surface border-primary-muted" : ""}
              >
                <Filter className="w-4 h-4" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
            </div>
            
            {/* Quick Filter Chips */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <FilterChip label="Breakfast" active={false} onClick={() => {}} />
              <FilterChip label="Lunch" active={false} onClick={() => {}} />
              <FilterChip label="Dinner" active={true} onClick={() => {}} />
              <FilterChip label="Quick (<30m)" active={false} onClick={() => {}} />
              <FilterChip label="New" active={false} onClick={() => {}} />
            </div>
            
            {/* Content Area */}
            {mode === "create" ? (
              <>
                {/* Section: Main Dishes */}
                {!showSidesOnly && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <ChefHat className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">Main Dishes</h2>
                      <Badge variant="muted">
                        {filteredRecipes.filter(r => !r.isSide).length} recipes
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredRecipes.filter(r => !r.isSide).map((recipe) => (
                        <RecipeSelectCard
                          key={recipe.id}
                          recipe={recipe}
                          isSelected={selectedMain?.id === recipe.id}
                          onSelect={handleSelectRecipe}
                          selectionType="main"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Section: Side Dishes */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Salad className="w-5 h-5 text-secondary" />
                    <h2 className="text-lg font-semibold text-foreground">Side Dishes</h2>
                    <Badge variant="secondary">
                      {filteredRecipes.filter(r => r.isSide).length} recipes
                    </Badge>
                    {selectedSides.length >= 3 && (
                      <Badge variant="success">Max selected!</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredRecipes.filter(r => r.isSide).map((recipe) => (
                      <RecipeSelectCard
                        key={recipe.id}
                        recipe={recipe}
                        isSelected={selectedSides.some(s => s.id === recipe.id)}
                        onSelect={handleSelectRecipe}
                        selectionType="side"
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Saved Meals Grid */
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Bookmark className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Your Saved Meals</h2>
                  <Badge variant="muted">
                    {filteredSavedMeals.length} meals
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSavedMeals.map((meal) => (
                    <SavedMealCard
                      key={meal.id}
                      meal={meal}
                      onSelect={handleSelectSavedMeal}
                    />
                  ))}
                </div>

                {filteredSavedMeals.length === 0 && (
                  <div className="text-center py-16">
                    <Bookmark className="w-12 h-12 text-foreground-disabled mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No saved meals found</h3>
                    <p className="text-sm text-foreground-disabled">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
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
                onAddToQueue={() => alert("Meal added to queue!")}
              />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}