"use client";

import { useState } from "react";
import { ShoppingBag, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuantityInput } from "@/components/forms/QuantityInput";
import { SmartIngredientInput } from "@/components/forms/SmartIngredientInput";
import { INGREDIENT_CATEGORIES } from "@/lib/constants";
import { useAddManualItem, useUnits } from "@/hooks/api";

export function QuickAddWidget() {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState<number | null>(null);
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");

  const addManualItem = useAddManualItem();
  const { data: units = [] } = useUnits();

  const handleAdd = () => {
    const trimmedName = itemName.trim();
    if (!trimmedName) return;

    addManualItem.mutate(
      {
        ingredient_name: trimmedName,
        quantity: quantity || 1,
        unit: unit || null,
        category: category || null,
      },
      {
        onSuccess: () => {
          setItemName("");
          setQuantity(null);
          setUnit("");
          setCategory("");
        },
      }
    );
  };

  return (
    <Card className="p-4 shrink-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <ShoppingBag className="h-5 w-5 text-chart-4" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-foreground">Quick Add</h2>
      </div>

      {/* Stacked form */}
      <div className="flex flex-col gap-2">
        {/* Row 1: Qty | Unit | Name */}
        <div className="flex flex-row items-center gap-2">
          <QuantityInput
            value={quantity}
            onChange={setQuantity}
            placeholder="Qty"
            className="w-16"
          />
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              {units.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SmartIngredientInput
            value={itemName}
            onChange={setItemName}
            onCategoryChange={setCategory}
            onSubmit={() => itemName.trim() && handleAdd()}
            placeholder="Add item..."
            disabled={addManualItem.isPending}
          />
        </div>
        {/* Row 2: Category | Add */}
        <div className="flex flex-row items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {INGREDIENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAdd}
            disabled={!itemName.trim() || addManualItem.isPending}
            size="icon"
            aria-label="Add item to shopping list"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
