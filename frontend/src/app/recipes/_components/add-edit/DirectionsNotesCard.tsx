"use client";

import { memo } from "react";
import { ListOrdered, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface DirectionsNotesCardProps {
  directions: string;
  setDirections: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  hasError: (field: string) => boolean;
  getError: (field: string) => string | undefined;
}

export const DirectionsNotesCard = memo(function DirectionsNotesCard({
  directions,
  setDirections,
  notes,
  setNotes,
  hasError,
  getError,
}: DirectionsNotesCardProps) {
  return (
    <Card data-field="directions">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ListOrdered className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              Directions & Notes
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Step-by-step cooking instructions and additional tips
            </p>
          </div>
        </div>
        <Tabs defaultValue="directions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="directions" className="gap-2">
              <ListOrdered className="h-4 w-4" />
              Directions
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="directions" className="mt-4">
            <Textarea
              placeholder="Enter cooking directions step by step...&#10;&#10;1. Preheat oven to 350°F&#10;2. Mix dry ingredients in a bowl&#10;3. ..."
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              rows={10}
              className={cn(
                "font-mono text-sm resize-none",
                hasError("directions") && "border-destructive"
              )}
            />
            {getError("directions") && (
              <p className="text-sm text-destructive mt-1">{getError("directions")}</p>
            )}
          </TabsContent>
          <TabsContent value="notes" className="mt-4">
            <Textarea
              placeholder="Add any helpful notes, tips, or variations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={10}
              className="resize-none"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});
