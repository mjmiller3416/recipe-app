"use client";

import { ShoppingCart } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";

/**
 * Shopping List Page
 *
 * Route: /shopping-list
 *
 * Displays the user's shopping list with items grouped by category.
 */
export default function ShoppingListPage() {
  return (
    <PageLayout
      title="Shopping List"
      description="Manage your grocery shopping list"
    >
      {/* Content will go here */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-elevated rounded-full mb-4">
          <ShoppingCart className="h-12 w-12 text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Shopping List Coming Soon
        </h3>
        <p className="text-sm text-muted max-w-sm">
          Your shopping list will appear here once you start adding items from your meal plans.
        </p>
      </div>
    </PageLayout>
  );
}
