"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { MealGridCard, MealGridItem } from "./MealGridCard";

// ============================================================================
// TYPES
// ============================================================================

interface MealGridProps {
  items: MealGridItem[];
  selectedId?: number | null;
  onItemClick?: (item: MealGridItem) => void;
  onAddMealClick?: () => void;
  onCycleShoppingMode?: (item: MealGridItem) => void;
  onReorder?: (reorderedItems: MealGridItem[]) => void;
  isReorderMode?: boolean;
  className?: string;
}

// ============================================================================
// ADD MEAL CARD COMPONENT
// ============================================================================

interface AddMealCardProps {
  onClick?: () => void;
}

function AddMealCard({ onClick }: AddMealCardProps) {
  return (
    <Card
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label="Add a new meal"
      className={cn(
        "cursor-pointer overflow-hidden relative",
        "pb-0 pt-0 gap-0",
        "border-dashed border-primary/40 bg-primary/5",
        "hover:border-primary hover:bg-primary/10 transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      {/* Invisible spacer matching MealGridCard proportions */}
      <div className="aspect-[16/9]" aria-hidden="true" />
      <div className="p-3" aria-hidden="true">
        <p className="text-sm mb-1 invisible">&nbsp;</p>
        <p className="text-xs invisible">&nbsp;</p>
      </div>
      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Plus className="size-8 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-sm font-semibold text-muted-foreground">Add Meal</span>
      </div>
    </Card>
  );
}

// ============================================================================
// MEAL GRID COMPONENT
// ============================================================================

/**
 * Grid display of meals with an "Add Meal" placeholder.
 * Responsive: 2 columns on mobile, 3 on tablet, 4 on desktop.
 */
export function MealGrid({
  items,
  selectedId,
  onItemClick,
  onAddMealClick,
  onCycleShoppingMode,
  onReorder,
  isReorderMode = false,
  className,
}: MealGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedItems = arrayMove(items, oldIndex, newIndex);
    onReorder?.(reorderedItems);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Section Header */}
      <h2 className="text-lg font-semibold text-foreground">This Week&apos;s Menu</h2>

      {/* Grid */}
      <DndContext
        sensors={sensors}
        modifiers={[restrictToParentElement]}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
            {items.map((item) => (
              <MealGridCard
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onClick={() => onItemClick?.(item)}
                onCycleShoppingMode={() => onCycleShoppingMode?.(item)}
                isReorderMode={isReorderMode}
              />
            ))}

            {/* Add Meal Card - outside SortableContext items, not draggable */}
            <AddMealCard onClick={onAddMealClick} />
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
