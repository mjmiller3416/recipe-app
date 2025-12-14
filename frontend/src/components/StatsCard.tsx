import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Primary stat - the main number to highlight */
  primaryValue: number | string;
  /** Label for the primary stat */
  primaryLabel: string;
  /** Secondary stat value (optional) */
  secondaryValue?: string;
  /** Label for the secondary stat (optional) */
  secondaryLabel?: string;
  /** Show progress bar (optional) */
  progress?: {
    current: number;
    total: number;
  };
  /** Additional className for the card */
  className?: string;
}

export function StatsCard({
  icon: Icon,
  primaryValue,
  primaryLabel,
  secondaryValue,
  secondaryLabel,
  progress,
  className,
}: StatsCardProps) {
  const progressPercent = progress && progress.total > 0 
    ? (progress.current / progress.total) * 100 
    : 0;

  return (
    <Card className={cn("py-0", className)}>
      <CardContent className="py-4">
        <div className="flex items-center gap-6">
          {/* Icon + Primary Stat */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-foreground">
              <span className="text-xl font-semibold">{primaryValue}</span>
              {" "}{primaryLabel}
            </p>
          </div>

          {/* Secondary Stat (optional) */}
          {secondaryValue && (
            <>
              <div className="h-8 w-px bg-border" />
              <p className="text-sm text-foreground">
                <span className="text-xl font-semibold">{secondaryValue}</span>
                {secondaryLabel && ` ${secondaryLabel}`}
              </p>
            </>
          )}

          {/* Progress Bar (optional) */}
          {progress && (
            <div className="flex-1">
              <div className="h-2 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Variant for displaying multiple stats in a row (dashboard use case)
 */
interface StatItemProps {
  /** Value to display */
  value: number | string;
  /** Label for the stat */
  label: string;
  /** Optional trend indicator */
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

interface MultiStatsCardProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Title for the card */
  title: string;
  /** Array of stats to display */
  stats: StatItemProps[];
  /** Additional className for the card */
  className?: string;
}

export function MultiStatsCard({
  icon: Icon,
  title,
  stats,
  className,
}: MultiStatsCardProps) {
  return (
    <Card className={cn("py-0", className)}>
      <CardContent className="py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-medium text-foreground">{title}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-2xl font-semibold text-foreground">
                {stat.value}
                {stat.trend && (
                  <span
                    className={cn(
                      "ml-2 text-xs font-normal",
                      stat.trend.direction === "up" ? "text-success" : "text-error"
                    )}
                  >
                    {stat.trend.direction === "up" ? "↑" : "↓"} {stat.trend.value}%
                  </span>
                )}
              </p>
              <p className="text-xs text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}