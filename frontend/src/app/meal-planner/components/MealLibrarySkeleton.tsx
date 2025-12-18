"use client";

import { cn } from "@/lib/utils";

interface MealLibrarySkeletonProps {
  count?: number;
}

function MealCardSkeleton() {
  return (
    <div className="p-3 rounded-lg border border-border-subtle bg-elevated animate-pulse">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-32 bg-hover rounded" />
        <div className="flex gap-1">
          <div className="h-7 w-7 bg-hover rounded" />
          <div className="h-7 w-7 bg-hover rounded" />
        </div>
      </div>

      {/* Recipe info */}
      <div className="h-3 w-40 bg-hover rounded mt-2" />
      <div className="h-3 w-16 bg-hover rounded mt-1" />

      {/* Tags */}
      <div className="flex gap-1 mt-3">
        <div className="h-5 w-14 bg-hover rounded-full" />
        <div className="h-5 w-16 bg-hover rounded-full" />
      </div>
    </div>
  );
}

export function MealLibrarySkeleton({ count = 5 }: MealLibrarySkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <MealCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function MealLibraryHeaderSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-28 bg-hover rounded" />
        <div className="h-8 w-20 bg-hover rounded" />
      </div>

      {/* Search */}
      <div className="h-10 w-full bg-hover rounded" />

      {/* Filter tabs */}
      <div className="flex gap-2">
        <div className="h-8 w-16 bg-hover rounded" />
        <div className="h-8 w-24 bg-hover rounded" />
        <div className="h-8 w-20 bg-hover rounded" />
      </div>
    </div>
  );
}