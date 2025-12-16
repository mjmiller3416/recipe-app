"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { hasAnyUnsavedChanges, setNavigationBypass } from "@/hooks/useUnsavedChanges";
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
import { AlertTriangle } from "lucide-react";

interface SafeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * A Link component that checks for unsaved changes before navigating.
 * If any page has registered unsaved changes, shows a confirmation dialog.
 * 
 * Use this in navigation components (like Sidebar) to respect unsaved changes.
 */
export function SafeLink({ href, children, className, onClick }: SafeLinkProps) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Call the original onClick if provided
      onClick?.(e);
      
      // If already prevented, don't do anything
      if (e.defaultPrevented) return;

      // Check for unsaved changes
      if (hasAnyUnsavedChanges()) {
        e.preventDefault();
        setPendingHref(href);
        setShowDialog(true);
      }
      // Otherwise, let the Link handle navigation normally
    },
    [href, onClick]
  );

  const handleConfirm = useCallback(() => {
    // Enable bypass to prevent re-interception
    setNavigationBypass(true);
    setShowDialog(false);
    
    if (pendingHref) {
      router.push(pendingHref);
    }
    setPendingHref(null);
  }, [pendingHref, router]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    setPendingHref(null);
  }, []);

  return (
    <>
      <Link href={href} className={className} onClick={handleClick}>
        {children}
      </Link>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-secondary" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Stay on Page</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className="bg-secondary hover:bg-secondary/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}