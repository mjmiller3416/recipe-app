import { Skeleton } from "@/components/ui/skeleton";

/**
 * Home route loading boundary — mirrors HomeView's final layout:
 * greeting header with streak chip, Tonight hero + shopping card.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-6 px-4 mx-auto max-w-7xl md:px-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-72" />
        </div>
        {/* Streak chip */}
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Tonight hero + shopping status */}
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3 lg:gap-6">
          <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
