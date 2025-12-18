"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Eye, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompletionCheckbox } from "./CompletionCheckbox";
import { formatRelativeTime } from "@/lib/timeUtils";
import type { PlannerEntryResponseDTO } from "@/types/index";

interface PlannerEntryCardProps {
  entry: PlannerEntryResponseDTO;
  onToggleCompletion: (entryId: number) => Promise<void>;
  onRemove: (entryId: number) => Promise<void>;
  isToggling?: boolean;
  isRemoving?: boolean;
}

export function PlannerEntryCard({
  entry,
  onToggleCompletion,
  onRemove,
  isToggling = false,
  isRemoving = false,
}: PlannerEntryCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggle = async () => {
    if (!isToggling) {
      await onToggleCompletion(entry.id);
    }
  };

  const handleRemove = async () => {
    if (!isRemoving) {
      await onRemove(entry.id);
    }
    setIsMenuOpen(false);
  };

  // Build recipe info string
  const mainRecipeName = entry.main_recipe?.recipe_name || "No main recipe";
  const sideNames = entry.side_recipes?.map((r) => r.recipe_name) || [];
  const sidesText = sideNames.length > 0 ? sideNames.join(", ") : null;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 rounded-lg border border-border-subtle bg-elevated p-4 transition-all duration-200",
        "hover:border-border",
        entry.is_completed && "opacity-60",
        isRemoving && "pointer-events-none opacity-50"
      )}
    >
      {/* Completion checkbox */}
      <CompletionCheckbox
        checked={entry.is_completed}
        onChange={handleToggle}
        disabled={isToggling}
        className="mt-0.5"
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header row: position + meal name */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted">
            {entry.position}.
          </span>
          <h3
            className={cn(
              "text-base font-semibold text-foreground",
              entry.is_completed && "line-through"
            )}
          >
            {entry.meal_name || "Unnamed Meal"}
          </h3>
        </div>

        {/* Recipe details */}
        <div className="mt-1 text-sm text-muted">
          <span className={cn(entry.is_completed && "line-through")}>
            Main: {mainRecipeName}
            {sidesText && (
              <>
                <span className="mx-2 text-border">│</span>
                Sides: {sidesText}
              </>
            )}
          </span>
        </div>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right side: completed status or actions */}
      <div className="flex items-center gap-2">
        {entry.is_completed && entry.completed_at && (
          <span className="flex items-center gap-1 text-xs text-success">
            <Check className="h-3 w-3" />
            Completed {formatRelativeTime(entry.completed_at)}
          </span>
        )}

        {/* Actions menu */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 text-muted opacity-0 transition-opacity hover:text-foreground",
                "group-hover:opacity-100",
                isMenuOpen && "opacity-100"
              )}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {entry.main_recipe_id && (
              <DropdownMenuItem asChild>
                <Link
                  href={`/recipes/${entry.main_recipe_id}`}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Recipe
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleRemove}
              disabled={isRemoving}
              className="flex items-center gap-2 text-error focus:text-error"
            >
              <Trash2 className="h-4 w-4" />
              Remove from Planner
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}