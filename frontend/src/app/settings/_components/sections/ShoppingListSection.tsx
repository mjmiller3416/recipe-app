"use client";

import { ShoppingCart, Trash2, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SectionHeader } from "../SectionHeader";
import { UnitConversionsSection } from "./UnitConversionsSection";
import { CategoryOrderSection } from "./CategoryOrderSection";

type AutoClearOption = "manual" | "onRefresh" | "daily";
type CategorySortOrder = "alphabetical" | "custom";

interface ShoppingListSectionProps {
  autoClearChecked: AutoClearOption;
  onAutoClearChange: (value: AutoClearOption) => void;
  categorySortOrder: CategorySortOrder;
  customCategoryOrder: string[];
  onCategorySortOrderChange: (value: CategorySortOrder) => void;
  onCustomCategoryOrderChange: (order: string[]) => void;
}

const autoClearOptions = [
  {
    value: "manual" as AutoClearOption,
    label: "Manual",
    description: "I'll clear items myself",
  },
  {
    value: "onRefresh" as AutoClearOption,
    label: "On Refresh",
    description: "Clear when I refresh the list",
  },
  {
    value: "daily" as AutoClearOption,
    label: "Daily",
    description: "Auto-clear each day",
  },
] as const;

export function ShoppingListSection({
  autoClearChecked,
  onAutoClearChange,
  categorySortOrder,
  customCategoryOrder,
  onCategorySortOrderChange,
  onCustomCategoryOrderChange,
}: ShoppingListSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <SectionHeader
            icon={ShoppingCart}
            title="Shopping List"
            description="Configure how your shopping list behaves"
            accentColor="secondary"
          />

          <div className="space-y-6">
            {/* Category Display Order */}
            <CategoryOrderSection
              categorySortOrder={categorySortOrder}
              customCategoryOrder={customCategoryOrder}
              onSortOrderChange={onCategorySortOrderChange}
              onCategoryOrderChange={onCustomCategoryOrderChange}
            />

            <Separator />

            {/* Auto Clear Checked Items */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                Clear Checked Items
              </Label>
              <div className="grid grid-cols-3 gap-3 max-w-lg">
                {autoClearOptions.map((option) => {
                  const isSelected = autoClearChecked === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => onAutoClearChange(option.value)}
                      className={cn(
                        "relative flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all duration-200",
                        isSelected
                          ? "border-secondary bg-secondary/10 shadow-md"
                          : "border-border hover:border-muted hover:bg-hover"
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-foreground text-center">
                        {option.description}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-secondary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Choose when checked items are removed from your shopping list
              </p>
            </div>
            <Separator />

            {/* Unit Conversions */}
            <UnitConversionsSection />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
