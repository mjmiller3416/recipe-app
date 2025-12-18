"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealName: string;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteMealDialog({
  open,
  onOpenChange,
  mealName,
  onConfirm,
  isDeleting = false,
}: DeleteMealDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Meal</AlertDialogTitle>
          <AlertDialogDescription className="text-muted">
            Are you sure you want to delete &quot;{mealName}&quot;? This will
            also remove it from your planner if it&apos;s currently there.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-error hover:bg-error/90 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Meal"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}