"use client";

import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";

/**
 * Hook for configuring dnd-kit with standard settings for vertical sortable lists.
 * Provides pre-configured sensors and modifiers for boundary constraints.
 *
 * @example
 * ```tsx
 * const { sensors, modifiers } = useSortableDnd();
 *
 * return (
 *   <DndContext
 *     sensors={sensors}
 *     modifiers={modifiers}
 *     collisionDetection={closestCenter}
 *     onDragEnd={handleDragEnd}
 *   >
 *     <SortableContext items={items} strategy={verticalListSortingStrategy}>
 *       {children}
 *     </SortableContext>
 *   </DndContext>
 * );
 * ```
 */
export function useSortableDnd() {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const modifiers = [restrictToVerticalAxis, restrictToParentElement];

  return { sensors, modifiers };
}
