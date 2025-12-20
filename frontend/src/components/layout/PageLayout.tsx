import * as React from "react";
import { cn } from "@/lib/utils";
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
  /** Page content */
  children: React.ReactNode;
  /** Optional className for the outer wrapper */
  className?: string;
  /** Optional className for the content container */
  contentClassName?: string;
}

/**
 * PageLayout - Standard page layout wrapper
 *
 * Provides consistent structure across pages:
 * - Full-screen background
 * - Sticky header with title, description, and actions
 * - Centered content container with standard max-width and padding
 *
 * @example
 * // Basic usage
 * <PageLayout
 *   title="Shopping List"
 *   description="Auto-generated from your meal plan"
 *   actions={<Button>Action</Button>}
 * >
 *   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 *     {content}
 *   </div>
 * </PageLayout>
 *
 * @example
 * // Custom header content (e.g., with back button)
 * <PageLayout
 *   title="Edit Recipe"
 *   headerContent={
 *     <PageHeaderContent>
 *       <div className="flex items-center gap-4 flex-1">
 *         <Button variant="ghost" size="icon"><ArrowLeft /></Button>
 *         <PageHeaderTitle title="Edit Recipe" description="..." />
 *       </div>
 *       <PageHeaderActions>...</PageHeaderActions>
 *     </PageHeaderContent>
 *   }
 * >
 *   {content}
 * </PageLayout>
 */
export function PageLayout({
  title,
  description,
  actions,
  headerContent,
  children,
  className,
  contentClassName,
}: PageLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Header */}
      <PageHeader>
        {headerContent ?? (
          <PageHeaderContent>
            <PageHeaderTitle title={title} description={description} />
            {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
          </PageHeaderContent>
        )}
      </PageHeader>

      {/* Main Content */}
      <div className={cn("max-w-7xl mx-auto px-6 py-8", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
