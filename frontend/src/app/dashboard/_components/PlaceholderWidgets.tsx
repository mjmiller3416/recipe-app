"use client";

import { Sparkles, Send, Flame, Clock } from "lucide-react";

/**
 * Placeholder widget for Ask Meal Genie AI chatbot
 */
export function AskMealGeniePlaceholder() {
  return (
    <div className="bg-elevated rounded-xl p-4 border border-border shadow-raised">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-secondary" />
        <span className="text-sm font-medium text-foreground">Ask Meal Genie</span>
      </div>
      <div className="relative">
        <textarea
          placeholder="Ask me anything about recipes, meal planning, cooking tips..."
          className="w-full h-20 px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary"
          disabled
        />
        <button
          className="absolute bottom-3 right-3 p-1.5 rounded-md bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors disabled:opacity-50"
          disabled
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-muted mt-2">Coming soon!</p>
    </div>
  );
}

/**
 * Placeholder widget for Cooking Streak
 */
export function CookingStreakPlaceholder() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const completed = [true, true, true, true, true, false, false];

  return (
    <div className="bg-gradient-to-br from-primary/30 to-chart-4/20 rounded-xl p-4 border border-border shadow-raised">
      <div className="flex items-center gap-2 mb-1">
        <Flame className="h-5 w-5 text-chart-3" />
        <span className="text-lg font-bold text-foreground">5 Day Streak!</span>
      </div>
      <p className="text-xs text-muted mb-3">Keep cooking to extend it</p>
      <div className="flex justify-between">
        {days.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                completed[i]
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted/20 text-muted"
              }`}
            >
              {completed[i] ? "✓" : ""}
            </div>
            <span className="text-xs text-muted">{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Placeholder widget for Recently Added recipes
 */
export function RecentlyAddedPlaceholder() {
  const recentRecipes = [
    { name: "Apple Cobbler", category: "dessert", time: "45m" },
    { name: "Air Fryer Potatoes", category: "side", time: "20m" },
  ];

  return (
    <div className="bg-elevated rounded-xl p-4 border border-border shadow-raised">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted" />
          <span className="text-sm font-medium text-foreground">Recently Added</span>
        </div>
        <button className="text-xs text-secondary hover:text-secondary/80 transition-colors">
          Browse All →
        </button>
      </div>
      <div className="space-y-2">
        {recentRecipes.map((recipe, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center">
              <span className="text-[10px] text-muted font-medium px-1.5 py-0.5 rounded bg-chart-4/30">
                {recipe.category}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{recipe.name}</p>
              <p className="text-xs text-muted flex items-center gap-1">
                <Clock className="h-3 w-3" /> {recipe.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
