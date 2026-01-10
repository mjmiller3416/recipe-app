import { Card, CardContent } from "@/components/ui/card";

/**
 * Skeleton loading state for the recipe detail view.
 * Shows animated placeholders for hero, header card, ingredients, and directions.
 */
export function RecipeSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Hero Skeleton */}
      <div className="relative h-[300px] md:h-[400px] bg-elevated" />

      <div className="relative z-10 max-w-5xl px-6 mx-auto -mt-16">
        {/* Header Card Skeleton */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="w-3/4 h-10 mb-4 rounded-lg bg-hover" />
            <div className="flex gap-3 mb-6">
              <div className="w-24 h-8 rounded-full bg-hover" />
              <div className="w-20 h-8 rounded-full bg-hover" />
              <div className="h-8 rounded-full w-28 bg-hover" />
            </div>
            <div className="flex gap-8">
              <div className="w-32 h-6 rounded bg-hover" />
              <div className="w-32 h-6 rounded bg-hover" />
            </div>
          </CardContent>
        </Card>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="w-32 h-8 mb-4 rounded bg-hover" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-6 rounded bg-hover" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="w-32 h-8 mb-4 rounded bg-hover" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 rounded bg-hover" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
