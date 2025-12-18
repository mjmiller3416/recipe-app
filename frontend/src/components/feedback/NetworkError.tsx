"use client";

import { WifiOff, RefreshCw, AlertTriangle, ServerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorType = "network" | "server" | "timeout" | "unknown";

interface NetworkErrorProps {
  /** Callback to retry the failed operation */
  onRetry?: () => void;
  /** Error type for appropriate messaging */
  type?: ErrorType;
  /** Custom title */
  title?: string;
  /** Custom message */
  message?: string;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Additional class names */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const errorConfig: Record<
  ErrorType,
  { icon: typeof WifiOff; title: string; message: string }
> = {
  network: {
    icon: WifiOff,
    title: "Connection Error",
    message:
      "We couldn't connect to the server. Please check your internet connection and try again.",
  },
  server: {
    icon: ServerOff,
    title: "Server Error",
    message:
      "Something went wrong on our end. Please try again in a moment.",
  },
  timeout: {
    icon: AlertTriangle,
    title: "Request Timeout",
    message:
      "The request took too long to complete. Please check your connection and try again.",
  },
  unknown: {
    icon: AlertTriangle,
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again.",
  },
};

const sizeStyles = {
  sm: {
    container: "py-6 px-4",
    iconWrapper: "w-12 h-12",
    icon: "h-6 w-6",
    title: "text-base",
    message: "text-sm max-w-xs",
    button: "h-8 text-sm",
  },
  md: {
    container: "py-12 px-4",
    iconWrapper: "w-16 h-16",
    icon: "h-8 w-8",
    title: "text-lg",
    message: "text-sm max-w-sm",
    button: "h-9",
  },
  lg: {
    container: "py-16 px-6",
    iconWrapper: "w-20 h-20",
    icon: "h-10 w-10",
    title: "text-xl",
    message: "text-base max-w-md",
    button: "h-10",
  },
};

/**
 * Network error state component with retry action
 *
 * @example
 * ```tsx
 * if (error) {
 *   return (
 *     <NetworkError
 *       type="network"
 *       onRetry={fetchData}
 *       isRetrying={isLoading}
 *     />
 *   );
 * }
 * ```
 */
export function NetworkError({
  onRetry,
  type = "unknown",
  title,
  message,
  isRetrying = false,
  className,
  size = "md",
}: NetworkErrorProps) {
  const config = errorConfig[type];
  const Icon = config.icon;
  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.container,
        className
      )}
      role="alert"
    >
      <div
        className={cn(
          "rounded-full bg-error/10 flex items-center justify-center mb-4",
          styles.iconWrapper
        )}
      >
        <Icon className={cn("text-error", styles.icon)} />
      </div>

      <h3
        className={cn(
          "font-semibold text-foreground mb-2",
          styles.title
        )}
      >
        {title || config.title}
      </h3>

      <p className={cn("text-muted mb-6", styles.message)}>
        {message || config.message}
      </p>

      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="outline"
          className={cn("gap-2", styles.button)}
        >
          <RefreshCw
            className={cn("h-4 w-4", isRetrying && "animate-spin")}
          />
          {isRetrying ? "Retrying..." : "Try Again"}
        </Button>
      )}
    </div>
  );
}

/**
 * Inline error message for smaller error states
 */
export function InlineError({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "bg-error/10 border border-error/20 text-error",
        className
      )}
      role="alert"
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium hover:underline focus:outline-none focus-visible:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}