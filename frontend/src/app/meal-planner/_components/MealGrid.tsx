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
import { Button } from "@/components/ui/button";
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
    <Button
      variant="dashed"
      onClick={onClick}
      aria-label="Add a new meal"
      className="h-full flex-col gap-2"
    >
      <Plus className="size-6" strokeWidth={1.5} />
      <span>Add Meal</span>
    </Button>
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
