"use client";

import { Info, Clock, Users, CheckCircle, Calendar, Plus } from "lucide-react";
import { formatTime } from "@/lib/quantityUtils";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";

// ============================================================================
// TYPES
// ============================================================================

interface RecipeStatsProps {
  /** Cook time in minutes */
  cookTime: number | null;
  /** Number of servings */
  servings: number | null;
  /** Number of times this recipe has been cooked */
  timesCooked: number | null;
  /** ISO datetime string of when recipe was last cooked */
  lastCooked: string | null;
  /** ISO datetime string of when recipe was added to the system */
  dateAdded: string | null;
  /** Optional className for custom styling */
  className?: string;
}

// ============================================================================
// STAT ROW COMPONENT
// ============================================================================

interface StatRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function StatRow({ label, value, icon }: StatRowProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-secondary-on-surface font-medium">{value}</span>
    </div>
  );
}

// ============================================================================
// RECIPE STATS COMPONENT
// ============================================================================

export function RecipeStats({
  cookTime,
  servings,
  timesCooked,
  lastCooked,
  dateAdded,
  className,
}: RecipeStatsProps) {
  // Check if there are any stats to display
  const hasStats =
    cookTime !== null ||
    servings !== null ||
    dateAdded !== null;

  if (!hasStats) {
    return null;
  }

  // Format times cooked - show N/A if never cooked
  const timesValue = timesCooked && timesCooked > 0
    ? `${timesCooked} time${timesCooked !== 1 ? "s" : ""}`
    : "N/A";

  // Format last cooked - show N/A if never cooked
  const lastCookedValue = lastCooked
    ? formatRelativeTime(lastCooked)
    : "N/A";

  return (
    <Card
      className={cn(
        "p-4 bg-secondary-surface-alpha border-secondary-border-alpha",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-secondary" />
        <h4 className="text-sm font-medium text-secondary-on-surface">
          Recipe Stats
        </h4>
      </div>

      {/* Stats Grid */}
      <div className="space-y-2 text-sm">
        {cookTime !== null && (
          <StatRow
            label="Cook time"
            value={formatTime(cookTime)}
            icon={<Clock className="w-3.5 h-3.5" />}
          />
        )}

        {servings !== null && (
          <StatRow
            label="Servings"
            value={`${servings}`}
            icon={<Users className="w-3.5 h-3.5" />}
          />
        )}

        <StatRow
          label="Times cooked"
          value={timesValue}
          icon={<CheckCircle className="w-3.5 h-3.5" />}
        />

        <StatRow
          label="Last cooked"
          value={lastCookedValue}
          icon={<Calendar className="w-3.5 h-3.5" />}
        />

        {dateAdded !== null && (
          <StatRow
            label="Added"
            value={formatRelativeTime(dateAdded)}
            icon={<Plus className="w-3.5 h-3.5" />}
          />
        )}
      </div>
    </Card>
  );
}
