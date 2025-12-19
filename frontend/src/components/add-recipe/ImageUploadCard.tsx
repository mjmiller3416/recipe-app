"use client";

import { Upload, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ImageUploadCardProps {
  imagePreview: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImageUploadCard({
  imagePreview,
  onImageUpload,
}: ImageUploadCardProps) {
  return (
    <Card className="sticky top-8">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              Recipe Image
            </h2>
            <p className="text-sm text-muted mt-0.5">
              Upload an appetizing photo of your dish
            </p>
          </div>
        </div>

        {/* Image Preview */}
        <div className="aspect-square rounded-lg overflow-hidden bg-elevated border-2 border-dashed border-border mb-4">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Recipe preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <ImageIcon className="h-12 w-12 text-primary" />
              </div>
              <p className="text-sm font-medium">No image uploaded</p>
              <p className="text-xs mt-1">Click below to add one</p>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div>
          <input
            type="file"
            id="recipe-image"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
          />
          <Label htmlFor="recipe-image">
            <Button
              type="button"
              variant="secondary"
              className="w-full gap-2"
              onClick={() =>
                document.getElementById("recipe-image")?.click()
              }
            >
              <Upload className="h-4 w-4" />
              {imagePreview ? "Change Image" : "Upload Image"}
            </Button>
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
