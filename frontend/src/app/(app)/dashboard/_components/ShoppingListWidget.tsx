"use client";

import Link from "next/link";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { ShoppingListResponseDTO } from "@/types/shopping";

interface ShoppingListWidgetProps {
  /** Shopping list data fetched by the parent (one fetch for the whole page) */
  shoppingData?: ShoppingListResponseDTO;
  isLoading?: boolean;
}

/**
 * ShoppingListWidget — compact shopping status card for Home.
 * Shows items left to get plus overall progress; the full per-category
 * breakdown lives on the Shopping List page.
 */
export function ShoppingListWidget({
  shoppingData,
  isLoading = false,
}: ShoppingListWidgetProps) {
  const totalItems = shoppingData?.total_items ?? 0;
  const checkedItems = shoppingData?.checked_items ?? 0;
  const remainingItems = totalItems - checkedItems;
  const progressPercent =
    totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const hasItems = totalItems > 0;

  return (
    <Card className="h-full gap-0 p-5 shadow-raised">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="size-5 text-primary" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-foreground">
            Shopping List
          </h2>
        </div>
        <Link
          href="/shopping-list"
          className="flex items-center gap-1 text-sm text-primary transition-colors duration-150 hover:text-primary/80"
        >
          Open
          <ArrowRight className="size-4" strokeWidth={1.5} />
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-1 flex-col justify-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      ) : !hasItems ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing on your list yet.
            <br />
            Meals you plan add their ingredients automatically.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/meal-planner">Plan meals</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-3">
          <p className="text-3xl font-semibold text-foreground">
            {remainingItems === 0 ? (
              "All set! 🎉"
            ) : (
              <>
                {remainingItems}
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  item{remainingItems === 1 ? "" : "s"} left to get
                </span>
              </>
            )}
          </p>
          <Progress value={progressPercent} aria-label="Shopping progress" />
          <p className="text-sm text-muted-foreground">
            {checkedItems} of {totalItems} picked up
          </p>
        </div>
      )}
    </Card>
  );
}
