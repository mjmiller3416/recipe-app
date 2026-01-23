"use client";

import { Check, ChevronDown, Trash2, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================================================
// TYPES
// ============================================================================

export interface CompletedMealItem {
  id: number;
  name: string;
  imageUrl: string | null;
  servings?: number | null;
  totalTime?: number | null;
}

interface CompletedDropdownProps {
  items: CompletedMealItem[];
  onItemClick?: (item: CompletedMealItem) => void;
  onClearCompleted?: () => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ============================================================================
// COMPLETED DROPDOWN COMPONENT
// ============================================================================

/**
 * Dropdown button showing count of completed meals.
 * Clicking reveals a list of completed meals with option to clear all.
 */
export function CompletedDropdown({
  items,
  onItemClick,
  onClearCompleted,
  className,
}: CompletedDropdownProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("gap-2 text-muted-foreground", className)}
        >
          <Check className="h-4 w-4 text-success" strokeWidth={1.5} />
          Completed ({items.length})
          <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        {/* Completed Meals List */}
        <div className="max-h-64 overflow-y-auto">
          {items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className="flex items-center gap-3 p-2 cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-elevated flex-shrink-0 grayscale opacity-60">
                <RecipeImage
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  iconSize="sm"
                  showLoadingState={false}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-foreground truncate block">
                  {item.name}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-2">
                  {item.totalTime != null && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" strokeWidth={1.5} />
                      {formatTime(item.totalTime)}
                    </span>
                  )}
                  {item.servings != null && (
                    <span className="flex items-center gap-0.5">
                      <Users className="h-3 w-3" strokeWidth={1.5} />
                      {item.servings}
                    </span>
                  )}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>

        {/* Clear Completed Action */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onClearCompleted}
          className="flex items-center justify-center gap-2 text-destructive hover:text-destructive cursor-pointer"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          Clear Completed
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
