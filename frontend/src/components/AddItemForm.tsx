"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INGREDIENT_CATEGORIES, INGREDIENT_UNITS } from "@/lib/constants";

export interface AddItemFormData {
  name: string;
  quantity: number;
  unit: string | null;
  category: string;
}

interface AddItemFormProps {
  onAddItem: (item: AddItemFormData) => void;
}

export function AddItemForm({ onAddItem }: AddItemFormProps) {
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");

  const handleAddItem = () => {
    if (!newItemName.trim()) return;

    onAddItem({
      name: newItemName.trim(),
      quantity: parseFloat(newItemQuantity) || 1,
      unit: newItemUnit || null,
      category: newItemCategory || "Other",
    });

    // Reset form
    setNewItemName("");
    setNewItemQuantity("");
    setNewItemUnit("");
    setNewItemCategory("");
  };

  return (
    <Card className="sticky top-24">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">Add Item</h2>
            <p className="text-sm text-muted mt-0.5">Add item to your list</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Item Name */}
          <div>
            <Label htmlFor="item-name" className="text-sm font-medium">
              Item Name
            </Label>
            <Input
              id="item-name"
              placeholder="e.g. Olive Oil"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="item-qty" className="text-sm font-medium">
                Qty.
              </Label>
              <Input
                id="item-qty"
                type="number"
                placeholder="e.g. 2"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="item-unit" className="text-sm font-medium">
                Unit
              </Label>
              <Select value={newItemUnit} onValueChange={setNewItemUnit}>
                <SelectTrigger id="item-unit" className="mt-1.5">
                  <SelectValue placeholder="e.g. bottle" />
                </SelectTrigger>
                <SelectContent>
                  {INGREDIENT_UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="item-category" className="text-sm font-medium">
              Category
            </Label>
            <Select value={newItemCategory} onValueChange={setNewItemCategory}>
              <SelectTrigger id="item-category" className="mt-1.5">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {INGREDIENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            className="w-full gap-2"
            disabled={!newItemName.trim()}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
