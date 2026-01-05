"use client";

import { Info, Clock, Users, CheckCircle, Calendar, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface MealStatsProps {
  /** Total cook time in minutes (sum of all recipes) */
  totalCookTime: number | null;
  /** Average servings across all recipes (rounded) */
  avgServings: number | null;
  /** Number of times this meal has been cooked */
  timesCooked: number | null;
  /** ISO datetime string of when meal was last cooked */
  lastCooked: string | null;
  /** ISO datetime string of when meal was added */
  addedAt: string | null;
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
      <span className="flex items-center gap-2 text-secondary/70">
        {icon}
        {label}
      </span>
      <span className="text-secondary-on-surface font-medium">{value}</span>
    </div>
  );
}

// ============================================================================
// MEAL STATS COMPONENT
// ============================================================================

export function MealStats({
  totalCookTime,
  avgServings,
  timesCooked,
  lastCooked,
  addedAt,
  className,
}: MealStatsProps) {
  // Check if there are any stats to display
  const hasStats =
    totalCookTime !== null ||
    avgServings !== null ||
    timesCooked !== null ||
    lastCooked !== null ||
    addedAt !== null;

  if (!hasStats) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl p-4 border",
        className
      )}
      style={{
        backgroundColor: "var(--secondary-surface-alpha)",
        borderColor: "var(--secondary-border-alpha)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-secondary" />
        <h4 className="text-sm font-medium text-secondary-on-surface">
          Meal Stats
        </h4>
      </div>

      {/* Stats Grid */}
      <div className="space-y-2 text-sm">
        {totalCookTime !== null && (
          <StatRow
            label="Total cook time"
            value={formatCookTime(totalCookTime)}
            icon={<Clock className="w-3.5 h-3.5" />}
          />
        )}

        {avgServings !== null && (
          <StatRow
            label="Servings"
            value={`${avgServings}`}
            icon={<Users className="w-3.5 h-3.5" />}
          />
        )}

        {timesCooked !== null && (
          <StatRow
            label="Times cooked"
            value={`${timesCooked} time${timesCooked !== 1 ? "s" : ""}`}
            icon={<CheckCircle className="w-3.5 h-3.5" />}
          />
        )}

        {lastCooked !== null && (
          <StatRow
            label="Last cooked"
            value={formatRelativeTime(lastCooked)}
            icon={<Calendar className="w-3.5 h-3.5" />}
          />
        )}

        {addedAt !== null && (
          <StatRow
            label="Added"
            value={formatRelativeTime(addedAt)}
            icon={<Plus className="w-3.5 h-3.5" />}
          />
        )}
      </div>
    </div>
  );
}
