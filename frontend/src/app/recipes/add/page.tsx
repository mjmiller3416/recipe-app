import { Suspense } from "react";
import { AddEditRecipeView } from "../_components";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function AddRecipeLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4 mx-auto max-w-7xl">
          <Skeleton className="w-48 h-8" />
        </div>
      </div>
      <div className="px-6 py-8 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Skeleton className="w-full h-10" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="w-full h-10" />
                    <Skeleton className="w-full h-10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddRecipePage() {
  return (
    <Suspense fallback={<AddRecipeLoading />}>
      <AddEditRecipeView mode="add" />
    </Suspense>
  );
}
