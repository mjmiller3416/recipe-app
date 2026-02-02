"use client";

import { useState } from "react";
import { Scale, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUnitConversionRules } from "@/hooks/persistence/useUnitConversionRules";
import { useUnits } from "@/hooks/api";
import { SectionHeader } from "../SectionHeader";

export function UnitConversionsSection() {
  const { rules, isLoading, createRule, deleteRule } = useUnitConversionRules();
  const { data: units = [] } = useUnits();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for new rule
  const [ingredientName, setIngredientName] = useState("");
  const [fromUnit, setFromUnit] = useState("");
  const [toUnit, setToUnit] = useState("");
  const [factor, setFactor] = useState("");
  const [roundUp, setRoundUp] = useState(true);

  const resetForm = () => {
    setIngredientName("");
    setFromUnit("");
    setToUnit("");
    setFactor("");
    setRoundUp(true);
  };

  const handleSubmit = async () => {
    if (!ingredientName || !fromUnit || !toUnit || !factor) return;

    setIsSubmitting(true);
    try {
      await createRule({
        ingredient_name: ingredientName.toLowerCase().trim(),
        from_unit: fromUnit.toLowerCase().trim(),
        to_unit: toUnit.toLowerCase().trim(),
        factor: parseFloat(factor),
        round_up: roundUp,
      });
      resetForm();
      setIsDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteRule(id);
  };

  const canSubmit =
    ingredientName.trim() &&
    fromUnit.trim() &&
    toUnit.trim() &&
    factor &&
    parseFloat(factor) > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <SectionHeader
          icon={Scale}
          title="Shopping List"
          description="Configure unit conversions for shopping list aggregation"
          accentColor="primary"
        />

        <div className="space-y-6">
          {/* Explanation */}
          <div className="bg-elevated rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">
              Unit conversion rules let you display shopping list quantities in
              more practical units. For example, convert tablespoons of butter
              to sticks for easier shopping.
            </p>
          </div>

          {/* Add Rule Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Conversion Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Unit Conversion Rule</DialogTitle>
                <DialogDescription>
                  Create a rule to convert units for a specific ingredient.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ingredient">Ingredient Name</Label>
                  <Input
                    id="ingredient"
                    placeholder="e.g., butter"
                    value={ingredientName}
                    onChange={(e) => setIngredientName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromUnit">From Unit</Label>
                    <Select value={fromUnit} onValueChange={setFromUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toUnit">To Unit</Label>
                    <Select value={toUnit} onValueChange={setToUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="factor">
                    Factor (how many {units.find(u => u.value === fromUnit)?.label || "from"} = 1 {units.find(u => u.value === toUnit)?.label || "to"})
                  </Label>
                  <Input
                    id="factor"
                    type="number"
                    placeholder="e.g., 8"
                    value={factor}
                    onChange={(e) => setFactor(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: 8 Tbs = 1 stick of butter
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="roundUp">Round up for shopping</Label>
                    <p className="text-xs text-muted-foreground">
                      Always round up to ensure you have enough
                    </p>
                  </div>
                  <Switch
                    id="roundUp"
                    checked={roundUp}
                    onCheckedChange={setRoundUp}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Rule"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Rules List */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Scale className="h-3.5 w-3.5 text-muted-foreground" />
              Active Rules
            </Label>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversion rules yet</p>
                <p className="text-xs mt-1">
                  Add a rule to convert units for specific ingredients
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 bg-elevated rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm capitalize">
                        {rule.ingredient_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rule.factor} {rule.from_unit} = 1 {rule.to_unit}
                        {rule.round_up && " (rounds up)"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
