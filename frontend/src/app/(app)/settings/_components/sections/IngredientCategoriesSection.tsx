"use client";

import { useState, useCallback } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Apple,
  Plus,
  Trash2,
  GripVertical,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { InlineGroupCreator } from "@/components/common/InlineGroupCreator";
import { useSortableDnd } from "@/hooks/ui/useSortableDnd";
import {
  useIngredientCategories,
  useCreateIngredientCategory,
  useUpdateIngredientCategory,
  useDeleteIngredientCategory,
  useReorderIngredientCategories,
  useResetIngredientCategories,
} from "@/hooks/api/useIngredientCategories";
import type { UserIngredientCategoryDTO } from "@/types/ingredient-settings";

// ============================================================================
// SORTABLE ITEM
// ============================================================================

interface SortableItemProps {
  category: UserIngredientCategoryDTO;
  onToggleEnabled: (enabled: boolean) => void;
  onDelete: () => void;
  isUpdating: boolean;
}

function SortableIngredientCategoryItem({
  category,
  onToggleEnabled,
  onDelete,
  isUpdating,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
        category.is_enabled
          ? "bg-card hover:bg-hover border border-border"
          : "bg-muted/30 border border-border/50",
        isDragging && "opacity-50 shadow-lg z-10 transition-none"
      )}
    >
      <button
        type="button"
        className="p-0.5 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none shrink-0"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" strokeWidth={1.5} />
      </button>

      <span
        className={cn(
          "text-sm font-medium flex-1 truncate",
          !category.is_enabled && "text-muted-foreground"
        )}
      >
        {category.label}
      </span>

      <Badge
        variant={category.is_custom ? "secondary" : "outline"}
        className="shrink-0 text-xs"
      >
        {category.is_custom ? "Custom" : "Built-in"}
      </Badge>

      <Switch
        checked={category.is_enabled}
        onCheckedChange={onToggleEnabled}
        disabled={isUpdating}
        aria-label={`${category.is_enabled ? "Disable" : "Enable"} ${category.label} ingredient category`}
      />

      {category.is_custom && (
        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0"
          onClick={onDelete}
          disabled={isUpdating}
          aria-label={`Delete ${category.label} ingredient category`}
        >
          <Trash2 className="size-4" strokeWidth={1.5} />
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function IngredientCategoriesSection() {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: number;
    label: string;
  } | null>(null);

  const { data: categories = [], isLoading } = useIngredientCategories(true);
  const createMutation = useCreateIngredientCategory();
  const updateMutation = useUpdateIngredientCategory();
  const deleteMutation = useDeleteIngredientCategory();
  const reorderMutation = useReorderIngredientCategories();
  const resetMutation = useResetIngredientCategories();

  const { sensors, modifiers } = useSortableDnd();

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(categories, oldIndex, newIndex);
      reorderMutation.mutate({ ordered_ids: reordered.map((c) => c.id) });
    },
    [categories, reorderMutation]
  );

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    createMutation.mutate(
      { label: trimmed },
      {
        onSuccess: () => {
          setNewName("");
          setIsAdding(false);
        },
      }
    );
  };

  const handleToggleEnabled = (id: number, enabled: boolean) => {
    updateMutation.mutate({ id, data: { is_enabled: enabled } });
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteMutation.mutate(deleteConfirm.id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  const sortableItems = categories.map((c) => c.id);
  const enabledCount = categories.filter((c) => c.is_enabled).length;
  const customCount = categories.filter((c) => c.is_custom).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Apple className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
          Ingredient Categories
        </Label>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAdding(true)}
          disabled={isAdding || createMutation.isPending}
        >
          <Plus className="size-4 mr-1.5" strokeWidth={1.5} />
          Add Category
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Customize which ingredient categories appear in recipe forms. Drag to
        reorder, toggle to enable/disable.
      </p>

      <Card className="border-dashed">
        <CardContent className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2
                className="size-6 animate-spin text-muted-foreground"
                strokeWidth={1.5}
              />
              <span className="sr-only">Loading ingredient categories...</span>
            </div>
          ) : (
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
                <div className="space-y-1">
                  {isAdding && (
                    <InlineGroupCreator
                      value={newName}
                      onChange={setNewName}
                      onSubmit={handleAdd}
                      onCancel={() => {
                        setIsAdding(false);
                        setNewName("");
                      }}
                      isPending={createMutation.isPending}
                      placeholder="Category name"
                      maxLength={50}
                      size="sm"
                    />
                  )}

                  {categories.length === 0 && !isAdding ? (
                    <div className="text-center py-8">
                      <div className="rounded-full bg-muted p-4 inline-flex mb-3">
                        <Apple
                          className="size-8 text-muted-foreground"
                          strokeWidth={1.5}
                        />
                      </div>
                      <h3 className="text-sm font-semibold">No categories</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Categories will be created when you first load this page
                      </p>
                    </div>
                  ) : (
                    categories.map((category) => (
                      <SortableIngredientCategoryItem
                        key={category.id}
                        category={category}
                        onToggleEnabled={(enabled) =>
                          handleToggleEnabled(category.id, enabled)
                        }
                        onDelete={() =>
                          setDeleteConfirm({
                            id: category.id,
                            label: category.label,
                          })
                        }
                        isUpdating={
                          updateMutation.isPending || reorderMutation.isPending
                        }
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {categories.length > 0 && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {enabledCount} enabled · {customCount} custom
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                className="h-7 text-xs"
              >
                {resetMutation.isPending ? (
                  <Loader2
                    className="size-3 mr-1.5 animate-spin"
                    strokeWidth={1.5}
                  />
                ) : (
                  <RotateCcw className="size-3 mr-1.5" strokeWidth={1.5} />
                )}
                Reset to Defaults
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ingredient Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm?.label}
              &quot;? Recipes using this category will keep their current
              category value.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2
                    className="size-4 mr-2 animate-spin"
                    strokeWidth={1.5}
                  />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
