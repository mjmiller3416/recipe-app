"use client";

import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
} from "@/components/layout/PageHeader";

// ============================================================================
// MAIN MEAL PLANNER PAGE
// ============================================================================

export default function MealPlannerPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle
            title="Meal Planner"
            description="Plan and organize your meals for the week"
          />
        </PageHeaderContent>
      </PageHeader>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Content will be rebuilt here */}
      </div>
    </div>
  );
}
