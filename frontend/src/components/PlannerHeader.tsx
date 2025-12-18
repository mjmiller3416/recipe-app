"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  CheckCircle2,
  UtensilsCrossed,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { PlannerSummaryDTO } from "@/types/index";

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconColor?: string;
  progress?: { current: number; max: number };
}

function StatCard({ icon, value, label, iconColor = "text-primary", progress }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-elevated px-4 py-3">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-primary/10", iconColor === "text-success" && "bg-success/10", iconColor === "text-secondary" && "bg-secondary/10")}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-foreground">{value}</span>
          {progress && (
            <span className="text-sm text-muted">/ {progress.max}</span>
          )}
        </div>
        <p className="text-sm text-muted">{label}</p>
      </div>
      {progress && (
        <div className="ml-auto h-2 w-16 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.min((progress.current / progress.max) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface PlannerHeaderProps {
  summary: PlannerSummaryDTO | null;
  onClearCompleted: () => Promise<void>;
  onClearAll: () => Promise<void>;
  isClearingCompleted?: boolean;
  isClearingAll?: boolean;
}

export function PlannerHeader({
  summary,
  onClearCompleted,
  onClearAll,
  isClearingCompleted = false,
  isClearingAll = false,
}: PlannerHeaderProps) {
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);

  const handleClearAll = async () => {
    await onClearAll();
    setIsClearAllDialogOpen(false);
  };

  const hasEntries = summary && summary.total_entries > 0;
  const hasCompleted = summary && summary.completed_entries > 0;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      {summary && (
        <div className="flex flex-wrap gap-3">
          <StatCard
            icon={<UtensilsCrossed className="h-5 w-5" />}
            value={summary.total_entries}
            label="Meals"
            iconColor="text-primary"
            progress={{ current: summary.total_entries, max: summary.max_capacity }}
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            value={summary.completed_entries}
            label="Complete"
            iconColor="text-success"
          />
          <StatCard
            icon={<ShoppingCart className="h-5 w-5" />}
            value={summary.total_recipes}
            label="Recipes"
            iconColor="text-secondary"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href="/shopping-list" className="inline-flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Generate Shopping List
          </Link>
        </Button>

        {hasCompleted && (
          <Button
            variant="outline"
            onClick={onClearCompleted}
            disabled={isClearingCompleted}
            className="inline-flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isClearingCompleted ? "Clearing..." : "Clear Completed"}
          </Button>
        )}

        {hasEntries && (
          <AlertDialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="inline-flex items-center gap-2 text-muted hover:text-error"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-error" />
                  Clear All Meals?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all {summary?.total_entries} meals from your planner.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  disabled={isClearingAll}
                  className="bg-error text-white hover:bg-error/90"
                >
                  {isClearingAll ? "Clearing..." : "Clear All"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {summary?.is_at_capacity && (
          <span className="ml-2 text-sm text-warning">
            Planner is at capacity
          </span>
        )}
      </div>
    </div>
  );
}