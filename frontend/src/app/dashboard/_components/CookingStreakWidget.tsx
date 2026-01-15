"use client";

import { useEffect, useState, useCallback } from "react";
import { Flame, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { plannerApi } from "@/lib/api";
import type { CookingStreakDTO } from "@/types";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function CookingStreakWidget() {
  const [streakData, setStreakData] = useState<CookingStreakDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch streak data
  const fetchStreak = useCallback(async () => {
    try {
      const data = await plannerApi.getStreak();
      setStreakData(data);
    } catch (error) {
      console.error("Failed to fetch cooking streak:", error);
    }
  }, []);

  // Fetch on mount and listen for planner updates (completions affect streak)
  useEffect(() => {
    fetchStreak().finally(() => setIsLoading(false));

    window.addEventListener("planner-updated", fetchStreak);
    return () => window.removeEventListener("planner-updated", fetchStreak);
  }, [fetchStreak]);

  // Use server's today_index to ensure timezone consistency
  const todayIndex = streakData?.today_index ?? (new Date().getDay() + 6) % 7;

  const currentStreak = streakData?.current_streak ?? 0;
  const weekActivity = streakData?.week_activity ?? [false, false, false, false, false, false, false];

  // Generate streak message
  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return "Start cooking to build your streak!";
    } else if (currentStreak === 1) {
      return "Great start! Keep it going!";
    } else if (currentStreak < 7) {
      return "Keep cooking to extend it!";
    } else if (currentStreak < 14) {
      return "Amazing! You're on fire!";
    } else {
      return "Incredible dedication!";
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary/30 to-chart-4/20 rounded-xl p-4 border border-border shadow-raised">
      {isLoading ? (
        <>
          {/* Skeleton Header */}
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-40 mb-3" />
          {/* Skeleton Week */}
          <div className="flex justify-between">
            {DAY_LABELS.map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-3 w-3" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-5 w-5 text-chart-3" />
            <span className="text-lg font-bold text-foreground">
              {currentStreak > 0
                ? `${currentStreak} Day Streak!`
                : "No Streak Yet"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{getStreakMessage()}</p>

          {/* Week Activity Grid */}
          <div className="flex justify-between">
            {DAY_LABELS.map((day, i) => {
              const isActive = weekActivity[i];
              const isToday = i === todayIndex;

              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors duration-150 ${
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted/20 text-muted-foreground"
                    } ${isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-transparent" : "ring-1 ring-muted-foreground/30"}`}
                  >
                    {isActive && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  </div>
                  <span
                    className={`text-xs ${
                      isToday ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
