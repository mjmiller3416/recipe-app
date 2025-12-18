"use client";

import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Search, X, Clock, Users, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { RecipeCardDTO } from "@/types/index";

interface RecipeSelectorProps {
  recipes: RecipeCardDTO[];
  selectedRecipeId: number | null;
  onSelect: (recipeId: number | null) => void;
  excludeIds?: number[];
  placeholder?: string;
  label?: ReactNode;
  error?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export function RecipeSelector({
  recipes,
  selectedRecipeId,
  onSelect,
  excludeIds = [],
  placeholder = "Search recipes...",
  label,
  error,
  isLoading = false,
  disabled = false,
}: RecipeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter recipes based on search and exclusions
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Exclude specified IDs
      if (excludeIds.includes(recipe.id)) {
        return false;
      }
      // Search filter
      if (debouncedSearch) {
        return recipe.recipe_name
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase());
      }
      return true;
    });
  }, [recipes, debouncedSearch, excludeIds]);

  // Get selected recipe details
  const selectedRecipe = useMemo(() => {
    if (!selectedRecipeId) return null;
    return recipes.find((r) => r.id === selectedRecipeId) || null;
  }, [recipes, selectedRecipeId]);

  // Handle recipe selection
  const handleSelect = (recipeId: number) => {
    onSelect(recipeId);
    setOpen(false);
    setSearchQuery("");
  };

  // Clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
  };

  // Focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Format time display
  const formatTime = (minutes: number | null): string => {
    if (!minutes) return "—";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isLoading}
            className={cn(
              "w-full justify-between h-10 px-3 font-normal",
              "bg-input border-border hover:bg-hover",
              !selectedRecipe && "text-muted",
              error && "border-error focus:ring-error/20"
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading recipes...
              </span>
            ) : selectedRecipe ? (
              <span className="flex items-center gap-2 truncate">
                <span className="truncate">{selectedRecipe.recipe_name}</span>
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
            
            <div className="flex items-center gap-1">
              {selectedRecipe && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleClear(e as unknown as React.MouseEvent);
                    }
                  }}
                  className="p-0.5 rounded hover:bg-hover text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-muted shrink-0" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0" 
          align="start"
          sideOffset={4}
        >
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes..."
                className="pl-8 h-9 bg-elevated border-border-subtle"
              />
            </div>
          </div>
          
          {/* Recipe list */}
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredRecipes.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted">
                {debouncedSearch ? "No recipes found" : "No recipes available"}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => handleSelect(recipe.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-md transition-colors",
                      "hover:bg-hover focus:bg-hover focus:outline-none",
                      selectedRecipeId === recipe.id && "bg-primary/10"
                    )}
                  >
                    <div className="font-medium text-sm text-foreground line-clamp-1">
                      {recipe.recipe_name}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                      {recipe.total_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(recipe.total_time)}
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {recipe.servings} servings
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}