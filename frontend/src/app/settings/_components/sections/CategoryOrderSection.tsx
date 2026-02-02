"use client";

import { useCallback } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowUp, ArrowDown, RotateCcw, GripVertical, ListOrdered } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { RecipeIcon, type RecipeIconData } from "@/components/common/RecipeIcon";
import { DEFAULT_SETTINGS } from "@/hooks/persistence/useSettings";
import { useSortableDnd } from "@/hooks/ui/useSortableDnd";

// Category icon mapping (same as ShoppingCategory.tsx)
const CATEGORY_ICONS: Record<string, RecipeIconData> = {
  produce: { type: "icon", value: "group-of-vegetables" },
  dairy: { type: "icon", value: "cheese" },
  deli: { type: "icon", value: "salami" },
  meat: { type: "icon", value: "cuts-of-beef" },
  condiments: { type: "icon", value: "sauce-bottle" },
  "oils and vinegars": { type: "icon", value: "olive-oil" },
  seafood: { type: "icon", value: "prawn" },
  pantry: { type: "icon", value: "tin-can" },
  spices: { type: "icon", value: "spice" },
  frozen: { type: "icon", value: "ice" },
  bakery: { type: "icon", value: "baguette" },
  baking: { type: "icon", value: "flour" },
  beverages: { type: "icon", value: "cola" },
  other: { type: "icon", value: "grocery-bag" },
};

function getCategoryIcon(category: string): RecipeIconData {
  const normalizedCategory = category.toLowerCase();
  return CATEGORY_ICONS[normalizedCategory] || { type: "icon", value: "grocery-bag" };
}

// ============================================================================
// SORTABLE CATEGORY ITEM
// ============================================================================

interface SortableCategoryItemProps {
  category: string;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isOther: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SortableCategoryItem({
  category,
  isFirst,
  isOther,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category, disabled: isOther });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const canMoveUp = !isFirst && !isOther;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors",
        isOther
          ? "bg-muted/30 opacity-50"
          : "bg-card hover:bg-hover border border-border",
        isDragging && "opacity-50 shadow-lg z-10 transition-none"
      )}
    >
      <button
        type="button"
        className={cn(
          "p-0.5 transition-colors touch-none shrink-0",
          isOther
            ? "text-muted-foreground/30 cursor-not-allowed"
            : "text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
        )}
        aria-label="Drag to reorder"
        disabled={isOther}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <RecipeIcon
        icon={getCategoryIcon(category)}
        className="w-5 h-5 shrink-0"
      />
      <span className="text-sm font-medium flex-1 truncate">
        {category}
      </span>
      {!isOther && (
        <div className="flex items-center shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={`Move ${category} up`}
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={`Move ${category} down`}
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CategoryOrderSectionProps {
  categorySortOrder: "alphabetical" | "custom";
  customCategoryOrder: string[];
  onSortOrderChange: (value: "alphabetical" | "custom") => void;
  onCategoryOrderChange: (order: string[]) => void;
}

export function CategoryOrderSection({
  categorySortOrder,
  customCategoryOrder,
  onSortOrderChange,
  onCategoryOrderChange,
}: CategoryOrderSectionProps) {
  const isCustom = categorySortOrder === "custom";
  const { sensors, modifiers } = useSortableDnd();

  // Handle drag end - reorder categories
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = customCategoryOrder.findIndex((c) => c === active.id);
      const newIndex = customCategoryOrder.findIndex((c) => c === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Don't allow moving past "Other"
      const otherIndex = customCategoryOrder.indexOf("Other");
      if (newIndex >= otherIndex) return;

      const reordered = arrayMove(customCategoryOrder, oldIndex, newIndex);
      onCategoryOrderChange(reordered);
    },
    [customCategoryOrder, onCategoryOrderChange]
  );

  // Handle arrow button moves
  const moveCategory = useCallback(
    (index: number, direction: "up" | "down") => {
      const newOrder = [...customCategoryOrder];
      const newIndex = direction === "up" ? index - 1 : index + 1;

      if (newIndex < 0 || newIndex >= newOrder.length) return;
      if (newOrder[newIndex] === "Other" && direction === "down") return;
      if (newOrder[index] === "Other") return;

      const reordered = arrayMove(newOrder, index, newIndex);
      onCategoryOrderChange(reordered);
    },
    [customCategoryOrder, onCategoryOrderChange]
  );

  const resetToDefault = () => {
    onCategoryOrderChange([...DEFAULT_SETTINGS.shoppingList.customCategoryOrder]);
  };

  // Get sortable item IDs (exclude "Other" from drag operations)
  const sortableItems = customCategoryOrder.filter((c) => c !== "Other");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <ListOrdered className="h-3.5 w-3.5 text-muted-foreground" />
          Custom Category Order
        </Label>
        <Switch
          checked={isCustom}
          onCheckedChange={(checked) =>
            onSortOrderChange(checked ? "custom" : "alphabetical")
          }
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {isCustom
          ? "Drag categories or use arrows to match your store layout"
          : "Categories display in alphabetical order (A-Z)"}
      </p>

      {isCustom && (
        <Card className="border-dashed">
          <CardContent className="p-2">
            <DndContext
              sensors={sensors}
              modifiers={modifiers}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortableItems}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0.5">
                  {customCategoryOrder.map((category, index) => {
                    const isOther = category === "Other";
                    const isFirst = index === 0;
                    const isLast = index === customCategoryOrder.length - 1;
                    const canMoveDown =
                      !isLast &&
                      !isOther &&
                      customCategoryOrder[index + 1] !== "Other";

                    return (
                      <SortableCategoryItem
                        key={category}
                        category={category}
                        index={index}
                        isFirst={isFirst}
                        isLast={isLast}
                        isOther={isOther}
                        canMoveDown={canMoveDown}
                        onMoveUp={() => moveCategory(index, "up")}
                        onMoveDown={() => moveCategory(index, "down")}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefault}
              className="mt-2 w-full h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Reset to Default Order
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
