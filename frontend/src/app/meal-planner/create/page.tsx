import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateMealPage } from "../_components/create-meal";

// Loading skeleton for the page
function CreateMealSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-10 w-64 rounded-xl" />
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          <Skeleton className="h-96 w-64 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-6">
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          </div>
          <Skeleton className="h-[600px] w-80 rounded-2xl flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

export default function CreateMealRoute() {
  return (
    <Suspense fallback={<CreateMealSkeleton />}>
      <CreateMealPage />
    </Suspense>
  );
}
