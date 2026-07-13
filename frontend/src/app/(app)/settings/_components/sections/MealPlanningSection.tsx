"use client";

import { CalendarDays, Users, CalendarRange, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SectionHeader } from "../SectionHeader";

type WeekStartDay = "sunday" | "monday";

interface MealPlanningSectionProps {
  defaultServings: number;
  onServingsChange: (value: number) => void;
  weekStartDay: WeekStartDay;
  onWeekStartDayChange: (value: WeekStartDay) => void;
}

const weekStartOptions = [
  {
    value: "sunday" as WeekStartDay,
    label: "Sunday",
  },
  {
    value: "monday" as WeekStartDay,
    label: "Monday",
  },
] as const;

export function MealPlanningSection({
  defaultServings,
  onServingsChange,
  weekStartDay,
  onWeekStartDayChange,
}: MealPlanningSectionProps) {
  const handleServingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 12) {
      onServingsChange(value);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <SectionHeader
          icon={CalendarDays}
          title="Meal Planning"
          description="Configure default settings for meal planning"
          accentColor="primary"
        />

        <div className="space-y-6">
          {/* Default Servings */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              Default Servings
            </Label>
            <div className="flex items-center gap-3 max-w-xs">
              <Input
                type="number"
                min={1}
                max={12}
                value={defaultServings}
                onChange={handleServingsChange}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">servings per meal</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Set the default number of servings when adding meals to your plan
            </p>
          </div>

          <Separator />

          {/* Week Start Day */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
              Week Starts On
            </Label>
            <div className="flex gap-3 max-w-xs">
              {weekStartOptions.map((option) => {
                const isSelected = weekStartDay === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => onWeekStartDayChange(option.value)}
                    className={cn(
                      "relative flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md"
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
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Choose which day your meal planning week begins
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
