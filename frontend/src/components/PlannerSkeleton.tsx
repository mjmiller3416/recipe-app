"use client";

import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-border/50",
        className
      )}
    />
  );
}

function PlannerEntryCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border-subtle bg-elevated p-4">
      {/* Checkbox skeleton */}
      <Skeleton className="h-6 w-6 shrink-0 rounded-md" />

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-5 w-40" />
        </div>

        {/* Recipe details */}
        <div className="mt-2">
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Tags */}
        <div className="mt-3 flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      {/* Menu button skeleton */}
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  );
}

function PlannerHeaderSkeleton() {
  return (
    <div className="space-y-4">
      {/* Title skeleton */}
      <Skeleton className="h-8 w-48" />

      {/* Stats row skeleton */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-20 w-36 rounded-lg" />
        <Skeleton className="h-20 w-32 rounded-lg" />
        <Skeleton className="h-20 w-32 rounded-lg" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-44 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}

export function PlannerSkeleton() {
  return (
    <div className="space-y-6">
      <PlannerHeaderSkeleton />

      {/* Entry cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <PlannerEntryCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export { PlannerEntryCardSkeleton, PlannerHeaderSkeleton };