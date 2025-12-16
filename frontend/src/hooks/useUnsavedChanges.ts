"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UseUnsavedChangesOptions {
  /**
   * Whether the form has unsaved changes
   */
  isDirty: boolean;
  /**
   * Optional callback when user confirms leaving
   */
  onConfirmLeave?: () => void;
}

interface UseUnsavedChangesReturn {
  /**
   * Whether the leave confirmation dialog should be shown
   */
  showLeaveDialog: boolean;
  /**
   * Set the dialog visibility
   */
  setShowLeaveDialog: (show: boolean) => void;
  /**
   * The pending navigation path (if any)
   */
  pendingNavigation: string | null;
  /**
   * Handle navigation - will show dialog if dirty, otherwise navigate
   */
  handleNavigation: (path: string) => void;
  /**
   * Confirm leaving and navigate to pending path
   */
  confirmLeave: () => void;
  /**
   * Cancel leaving and stay on page
   */
  cancelLeave: () => void;
}

// Global registry for pages with unsaved changes
// This allows other components (like Sidebar) to check before navigating
const unsavedChangesRegistry = new Map<string, () => boolean>();

/**
 * Check if any page has unsaved changes
 */
export function hasAnyUnsavedChanges(): boolean {
  for (const [, checkFn] of unsavedChangesRegistry) {
    if (checkFn()) return true;
  }
  return false;
}

/**
 * Get the check function for a specific path
 */
export function getUnsavedChangesCheck(path: string): (() => boolean) | undefined {
  return unsavedChangesRegistry.get(path);
}

/**
 * Hook for handling unsaved changes warnings when navigating away from a page.
 * 
 * Features:
 * - Warns on browser refresh/close (native browser dialog)
 * - Warns on browser back/forward buttons
 * - Provides controlled navigation with confirmation dialog
 * - Registers with global registry for cross-component navigation checks
 * - Reusable across any form page
 * 
 * @example
 * ```tsx
 * const [isDirty, setIsDirty] = useState(false);
 * const {
 *   showLeaveDialog,
 *   setShowLeaveDialog,
 *   handleNavigation,
 *   confirmLeave,
 *   cancelLeave,
 * } = useUnsavedChanges({ isDirty });
 * 
 * // Use handleNavigation instead of router.push for internal links
 * <Button onClick={() => handleNavigation('/recipes')}>Cancel</Button>
 * 
 * // Render the dialog
 * <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
 *   ...
 * </AlertDialog>
 * ```
 */
export function useUnsavedChanges({
  isDirty,
  onConfirmLeave,
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn {
  const router = useRouter();
  const pathname = usePathname();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // Track if we're in the middle of a confirmed navigation
  const isNavigatingRef = useRef(false);
  // Track if we pushed a history state for interception
  const historyStateAddedRef = useRef(false);
  // Store isDirty in a ref so popstate handler has current value
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Register this page in the global registry
  useEffect(() => {
    unsavedChangesRegistry.set(pathname, () => isDirtyRef.current);
    return () => {
      unsavedChangesRegistry.delete(pathname);
    };
  }, [pathname]);

  // Handle browser refresh/close with beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Handle browser back/forward buttons with history manipulation
  useEffect(() => {
    // When dirty, push a state so we can intercept the back button
    if (isDirty && !historyStateAddedRef.current) {
      // Push a duplicate state so pressing back stays on same page
      window.history.pushState({ unsavedChangesGuard: true }, "", window.location.href);
      historyStateAddedRef.current = true;
    }

    // If no longer dirty, we could clean up but it's simpler to leave it
    // The state will be naturally cleaned up on navigation
  }, [isDirty]);

  // Listen for popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If we're in a confirmed navigation, let it proceed
      if (isNavigatingRef.current) {
        return;
      }

      // If dirty, intercept and show dialog
      if (isDirtyRef.current) {
        // Push state back to prevent navigation
        window.history.pushState({ unsavedChangesGuard: true }, "", window.location.href);
        
        // Set pending navigation to "back" (special case)
        setPendingNavigation("__BROWSER_BACK__");
        setShowLeaveDialog(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Handle navigation with unsaved changes check
  const handleNavigation = useCallback(
    (path: string) => {
      if (isDirty) {
        setPendingNavigation(path);
        setShowLeaveDialog(true);
      } else {
        router.push(path);
      }
    },
    [isDirty, router]
  );

  // Confirm leaving - navigate to pending path
  const confirmLeave = useCallback(() => {
    isNavigatingRef.current = true;
    historyStateAddedRef.current = false;
    onConfirmLeave?.();
    
    if (pendingNavigation === "__BROWSER_BACK__") {
      // For browser back, go back in history
      window.history.go(-1);
    } else if (pendingNavigation) {
      router.push(pendingNavigation);
    }
    
    setShowLeaveDialog(false);
    setPendingNavigation(null);
    
    // Reset after a short delay
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  }, [pendingNavigation, router, onConfirmLeave]);

  // Cancel leaving - stay on page
  const cancelLeave = useCallback(() => {
    setShowLeaveDialog(false);
    setPendingNavigation(null);
  }, []);

  return {
    showLeaveDialog,
    setShowLeaveDialog,
    pendingNavigation,
    handleNavigation,
    confirmLeave,
    cancelLeave,
  };
}