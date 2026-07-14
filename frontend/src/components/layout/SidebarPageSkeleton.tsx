import { Skeleton } from "@/components/ui/skeleton";

/**
 * SidebarPageSkeleton — full-page skeleton for the sidebar+content pages
 * (Settings, Admin). Matches the shared final layout: PageLayout header with
 * title/description, sticky nav card on the left, section content on the right.
 */
export function SidebarPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-6 px-4 mx-auto max-w-7xl md:px-6">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar nav card */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-xl" />
              ))}
            </div>
          </div>

          {/* Section content */}
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
