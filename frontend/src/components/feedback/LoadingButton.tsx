"use client";

import { forwardRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  /** Whether the button is in loading state */
  isLoading?: boolean;
  /** Text to show while loading (optional, shows spinner only if not provided) */
  loadingText?: string;
  /** Position of the spinner relative to text */
  spinnerPosition?: "left" | "right";
}

/**
 * Button component with built-in loading state
 *
 * @example
 * ```tsx
 * <LoadingButton
 *   isLoading={isSaving}
 *   loadingText="Saving..."
 *   onClick={handleSave}
 * >
 *   Save Changes
 * </LoadingButton>
 * ```
 */
export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      isLoading = false,
      loadingText,
      spinnerPosition = "left",
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const spinnerElement = (
      <Loader2
        className={cn(
          "h-4 w-4 animate-spin",
          loadingText && spinnerPosition === "left" && "mr-2",
          loadingText && spinnerPosition === "right" && "ml-2"
        )}
      />
    );

    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "relative",
          isLoading && "cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            {spinnerPosition === "left" && spinnerElement}
            {loadingText || (
              <span className="opacity-0">{children}</span>
            )}
            {spinnerPosition === "right" && spinnerElement}
            {!loadingText && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </span>
            )}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

/**
 * Icon button with loading state
 */
interface LoadingIconButtonProps extends Omit<ButtonProps, "children"> {
  /** Icon to display */
  icon: React.ReactNode;
  /** Whether the button is in loading state */
  isLoading?: boolean;
  /** Accessible label for the button */
  label: string;
}

export const LoadingIconButton = forwardRef<
  HTMLButtonElement,
  LoadingIconButtonProps
>(({ icon, isLoading = false, label, disabled, className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      disabled={disabled || isLoading}
      size="icon"
      className={cn(isLoading && "cursor-not-allowed", className)}
      aria-label={label}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    </Button>
  );
});

LoadingIconButton.displayName = "LoadingIconButton";

/**
 * Async button that automatically handles loading state
 */
interface AsyncButtonProps extends Omit<LoadingButtonProps, "isLoading"> {
  /** Async onClick handler */
  onClick: () => Promise<void>;
}

export function AsyncButton({
  onClick,
  loadingText,
  children,
  ...props
}: AsyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoadingButton
      isLoading={isLoading}
      loadingText={loadingText}
      onClick={handleClick}
      {...props}
    >
      {children}
    </LoadingButton>
  );
}