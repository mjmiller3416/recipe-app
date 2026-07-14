"use client";

import { Check, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCookingStreak } from "@/hooks/api";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function getStreakMessage(currentStreak: number): string {
  if (currentStreak === 0) return "Cook a planned meal to start your streak!";
  if (currentStreak === 1) return "Great start! Keep it going!";
  if (currentStreak < 7) return "Keep cooking to extend it!";
  if (currentStreak < 14) return "Amazing! You're on fire!";
  return "Incredible dedication!";
}

/**
 * StreakChip — compact cooking-streak pill for the Home header.
 * Opens a popover with this week's activity grid. Updates live when a meal
 * is marked cooked (planner mutation hooks invalidate the streak query).
 */
export function StreakChip() {
  const { data: streakData, isLoading } = useCookingStreak();

  // Use server's today_index to ensure timezone consistency
  const todayIndex = streakData?.today_index ?? (new Date().getDay() + 6) % 7;
  const currentStreak = streakData?.current_streak ?? 0;
  const weekActivity =
    streakData?.week_activity ??
    [false, false, false, false, false, false, false];

  if (isLoading) {
    return <Skeleton className="h-8 w-28 rounded-full" />;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          shape="pill"
          aria-label={
            currentStreak > 0
              ? `${currentStreak}-day cooking streak — show this week's activity`
              : "Cooking streak — show this week's activity"
          }
        >
          <Flame
            className={cn(
              "size-4",
              currentStreak > 0 ? "text-chart-3" : "text-muted-foreground"
            )}
            strokeWidth={1.5}
          />
          {currentStreak > 0 ? `${currentStreak}-day streak` : "Start a streak"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="mb-1 flex items-center gap-2">
          <Flame className="size-5 text-chart-3" strokeWidth={1.5} />
          <span className="text-lg font-bold text-foreground">
            {currentStreak > 0
              ? `${currentStreak} Day Streak!`
              : "No Streak Yet"}
          </span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          {getStreakMessage(currentStreak)}
        </p>

        {/* Week activity grid */}
        <div className="flex justify-between">
          {DAY_LABELS.map((day, i) => {
            const isActive = weekActivity[i];
            const isToday = i === todayIndex;

            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs transition-colors duration-150",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted/20 text-muted-foreground",
                    isToday
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-transparent"
                      : "ring-1 ring-muted-foreground/30"
                  )}
                >
                  {isActive && (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs",
                    isToday
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
