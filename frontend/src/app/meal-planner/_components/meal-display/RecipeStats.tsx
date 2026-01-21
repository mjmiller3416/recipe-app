"use client";

import { Info, Clock, Users, CheckCircle, Calendar, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
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
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formats minutes into a human-readable time string.
 * Examples: 90 -> "1h 30m", 45 -> "45m", 120 -> "2h"
 */
function formatCookTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Formats an ISO datetime string into a relative time string.
 * Examples: "2 days ago", "3 weeks ago", "1 month ago"
 */
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Handle edge cases (future dates or same day)
  if (diffDays < 0) {
    return "Today";
  }
  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays < 14) {
    return "1 week ago";
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} weeks ago`;
  }
  if (diffDays < 60) {
    return "1 month ago";
  }
  const months = Math.floor(diffDays / 30);
  return `${months} months ago`;
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
            value={formatCookTime(cookTime)}
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
