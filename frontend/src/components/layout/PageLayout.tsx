import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  PageHeaderContent,
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
  /** Optional callback when back button is clicked (for custom navigation with unsaved changes) */
  onBackClick?: () => void;
  /** Page content */
  children: React.ReactNode;
  /** Optional className for the outer wrapper */
  className?: string;
  /** Optional className for the content container */
  contentClassName?: string;
  /** Optional hero section that replaces the standard header */
  hero?: React.ReactNode;
  /** Optional sticky header bar below the hero (for sort options, active filters, etc.) */
  stickyHeader?: React.ReactNode;
  /** When true, page fills viewport height exactly with no scrolling (content must manage its own overflow) */
  fillViewport?: boolean;
}

/**
 * PageLayout - Standard page layout wrapper
 *
 * Supports two modes:
 * 1. Standard (default) - Page scrolls normally with sticky header
 * 2. Hero mode - Hero section at top, sticky subheader for filters/sort
 *
 * For sticky sidebars, use CSS `position: sticky` on child elements.
 *
 * @example
 * // Standard scrolling page
 * <PageLayout title="Settings">
 *   {content}
 * </PageLayout>
 *
 * @example
 * // Page with sticky sidebar (use sticky positioning on the sidebar element)
 * <PageLayout title="Add Recipe">
 *   <div className="flex gap-6">
 *     <main className="flex-1">{formContent}</main>
 *     <aside className="sticky self-start top-24">{sidebar}</aside>
 *   </div>
 * </PageLayout>
 *
 * @example
 * // Hero mode (RecipeBrowser)
 * <PageLayout
 *   title="Recipes"
 *   hero={<HeroSection />}
 *   stickyHeader={<SortAndFilters />}
 * >
 *   {content}
 * </PageLayout>
 */
export function PageLayout(props: PageLayoutProps) {
  const {
    actions,
    headerContent,
    onBackClick,
    children,
    className,
    contentClassName,
    hero,
    stickyHeader,
    fillViewport = false,
  } = props;
  // Build the header content (shared across modes)
  // Only render header when there are actions, custom content, or a back button
  const hasHeader = !!(headerContent || actions || onBackClick);
  const headerElement = hasHeader ? (
    <PageHeader>
      {headerContent ?? (
        <PageHeaderContent>
          {onBackClick && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Go back"
              onClick={onBackClick}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
        </PageHeaderContent>
      )}
    </PageHeader>
  ) : null;

  // ============================================
  // HERO MODE: Hero section with sticky subheader
  // Used by: RecipeBrowser
  // ============================================
  if (hero) {
    return (
      <div className={cn("min-h-screen bg-background", className)}>
        {/* Hero section */}
        {hero}

        {/* Sticky header bar (sort options, active filters) */}
        {stickyHeader && (
          <div
            data-sticky-header
            className="sticky top-0 md:top-16 z-40 border-b bg-background border-border"
          >
            {stickyHeader}
          </div>
        )}

        {/* Main content area */}
        <div
          data-page-content
          className={cn("max-w-7xl mx-auto w-full px-4 md:px-6 py-6", contentClassName)}
        >
          {children}
        </div>
      </div>
    );
  }

  // ============================================
  // STANDARD MODE: Normal scrolling page
  // Used by: Settings, Add Recipe, Edit Recipe, Shopping List, Meal Planner
  // ============================================

  // fillViewport mode: fixed height, no page scroll, content fills available space
  // On mobile (< lg), use normal scrolling since there's no sidebar that needs independent scroll
  if (fillViewport) {
    return (
      <div className={cn("min-h-screen lg:h-dvh flex flex-col lg:overflow-hidden bg-background", className)}>
        {headerElement}
        <div className={cn("flex-1 lg:min-h-0 max-w-7xl mx-auto w-full px-4 md:px-6 py-6", contentClassName)}>
          {children}
        </div>
      </div>
    );
  }

  // Default: scrollable page
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {headerElement}
      <div className={cn("max-w-7xl mx-auto px-4 md:px-6 py-6", contentClassName)}>
        {children}
      </div>
    </div>
  );
}