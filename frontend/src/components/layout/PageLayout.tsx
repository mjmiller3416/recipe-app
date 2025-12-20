import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderActions,
} from "./PageHeader";

interface PageLayoutProps {
  /** Page title displayed in the header */
  title: string;
  /** Optional description displayed below the title */
  description?: string;
  /** Optional actions (buttons, etc.) displayed on the right side of the header */
  actions?: React.ReactNode;
  /** Optional custom header content that replaces the default title/actions layout */
  headerContent?: React.ReactNode;
  /** Optional back button href - when provided, shows a back arrow before the title */
  backHref?: string;
  /** Optional callback when back button is clicked (for custom navigation with unsaved changes) */
  onBackClick?: () => void;
  /** Page content */
  children: React.ReactNode;
  /** Optional className for the outer wrapper */
  className?: string;
  /** Optional className for the content container */
  contentClassName?: string;
  /** Enable fixed viewport mode - page doesn't scroll, children manage their own scroll */
  fixedViewport?: boolean;
  /** Optional hero section that scrolls away (only used with fixedViewport) */
  hero?: React.ReactNode;
  /** Optional sticky header bar below the main header (for sort options, active filters, etc.) */
  stickyHeader?: React.ReactNode;
}

/**
 * PageLayout - Standard page layout wrapper
 *
 * Supports three modes:
 * 1. Standard (default) - Page scrolls normally
 * 2. Fixed Viewport (fixedViewport=true) - No page scroll, content fills viewport
 * 3. Hero + Fixed (hero + fixedViewport) - Hero scrolls away, then content locks
 *
 * @example
 * // Standard scrolling page
 * <PageLayout title="Shopping List">
 *   {content}
 * </PageLayout>
 *
 * @example
 * // Fixed viewport (MealPlanner)
 * <PageLayout title="Meal Planner" fixedViewport>
 *   {content}
 * </PageLayout>
 *
 * @example
 * // Hero + fixed content (RecipeBrowser)
 * <PageLayout
 *   hero={<HeroSection />}
 *   stickyHeader={<SortAndFilters />}
 *   fixedViewport
 * >
 *   {content}
 * </PageLayout>
 */
export function PageLayout({
  title,
  description,
  actions,
  headerContent,
  backHref,
  onBackClick,
  children,
  className,
  contentClassName,
  fixedViewport = false,
  hero,
  stickyHeader,
}: PageLayoutProps) {
  // Determine if we should show a back button
  const showBackButton = backHref || onBackClick;

  // Handle back button click
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else if (backHref) {
      window.location.href = backHref;
    }
  };

  // Build the header content (shared across modes)
  const headerElement = (
    <PageHeader>
      {headerContent ?? (
        <PageHeaderContent>
          {showBackButton ? (
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleBackClick}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <PageHeaderTitle title={title} description={description} />
            </div>
          ) : (
            <PageHeaderTitle title={title} description={description} />
          )}
          {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
        </PageHeaderContent>
      )}
    </PageHeader>
  );

  // ============================================
  // MODE 1: Standard scrolling page (default)
  // ============================================
  if (!fixedViewport && !hero) {
    return (
      <div className={cn("min-h-screen bg-background", className)}>
        {headerElement}
        <div className={cn("max-w-7xl mx-auto px-6 py-8", contentClassName)}>
          {children}
        </div>
      </div>
    );
  }

  // ============================================
  // MODE 2: Fixed viewport (no hero)
  // Used by: MealPlanner
  // ============================================
  if (fixedViewport && !hero) {
    return (
      <div className={cn("h-screen flex flex-col overflow-hidden bg-background", className)}>
        {headerElement}
        {stickyHeader && (
          <div className="flex-shrink-0 bg-background border-b border-border">
            {stickyHeader}
          </div>
        )}
        <div className={cn("flex-1 min-h-0 overflow-hidden fixed-viewport-scrollbar-hidden", contentClassName)}>
          <div className="h-full max-w-7xl mx-auto w-full px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MODE 3: Hero + fixed viewport
  // Used by: RecipeBrowser
  // Hero scrolls away, then content locks in place
  // ============================================
  if (hero) {
    return (
      <div className={cn("h-screen flex flex-col bg-background", className)}>
        {/* Scrollable container for hero */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Hero section - scrolls with content */}
          <div className="flex-shrink-0">
            {hero}
          </div>

          {/* Sticky header bar (sort options, active filters) */}
          {stickyHeader && (
            <div className="sticky top-0 z-40 bg-background border-b border-border">
              {stickyHeader}
            </div>
          )}

          {/* Main content area */}
          <div className={cn("max-w-7xl mx-auto w-full px-6 py-6", contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Fallback (shouldn't reach here)
  return null;
}
