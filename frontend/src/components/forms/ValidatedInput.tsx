"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ValidationResult } from "@/lib/formValidation";

interface ValidatedInputProps {
  /** Current value */
  value: string;
  /** Called with the raw input value on change */
  onChange: (value: string) => void;
  /** Validator function that normalizes and validates the input */
  validate?: (value: string) => ValidationResult<string>;
  /** Called with the validation result on change */
  onValidation?: (result: ValidationResult<string>) => void;
  /** Called when the input loses focus */
  onBlur?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional class names */
  className?: string;
  /** Input type */
  type?: "text" | "email" | "password" | "url";
  /** Whether to show the normalized preview (like QuantityInput) */
  showPreview?: boolean;
  /** Whether to show error styling immediately or only after blur */
  showErrorOnBlur?: boolean;
  /** Input ID for labels */
  id?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * A validated input component that provides:
 * - Real-time validation feedback
 * - Optional normalized value preview
 * - Error styling
 * - Blur-based error display option
 */
export function ValidatedInput({
  value,
  onChange,
  validate,
  onValidation,
  onBlur,
  placeholder,
  className,
  type = "text",
  showPreview = false,
  showErrorOnBlur = true,
  id,
  disabled,
}: ValidatedInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasBlurred, setHasBlurred] = React.useState(false);

  // Validate current value
  const validationResult = React.useMemo(() => {
    if (!validate) {
      return { value, isValid: true, error: null };
    }
    return validate(value);
  }, [value, validate]);

  // Notify parent of validation result changes
  React.useEffect(() => {
    onValidation?.(validationResult);
  }, [validationResult, onValidation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasBlurred(true);
    onBlur?.();
  };

  // Determine if we should show error styling
  const showError = showErrorOnBlur
    ? hasBlurred && !validationResult.isValid && value.trim() !== ""
    : !validationResult.isValid && value.trim() !== "";

  // Determine preview content
  const showPreviewContent = showPreview && isFocused && value.trim() !== "";
  const previewText = validationResult.isValid
    ? validationResult.value !== value
      ? validationResult.value
      : null
    : "?";

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          showPreviewContent && previewText && "pr-20",
          showError && "border-destructive focus-visible:border-destructive"
        )}
      />
      {showPreviewContent && previewText && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span
            className={cn(
              "text-sm",
              !validationResult.isValid ? "text-destructive" : "text-muted-foreground"
            )}
          >
            → {previewText}
          </span>
        </div>
      )}
    </div>
  );
}

interface ValidatedFieldProps extends ValidatedInputProps {
  /** Field label */
  label?: string;
  /** Help text shown below the input */
  helpText?: string;
  /** Whether to show the error message below the input */
  showErrorMessage?: boolean;
}

/**
 * A complete validated field with label, input, error message, and help text.
 */
export function ValidatedField({
  label,
  helpText,
  showErrorMessage = true,
  showErrorOnBlur = true,
  ...inputProps
}: ValidatedFieldProps) {
  const [validationResult, setValidationResult] = React.useState<ValidationResult<string>>({
    value: inputProps.value,
    isValid: true,
    error: null,
  });
  const [hasBlurred, setHasBlurred] = React.useState(false);

  const handleValidation = (result: ValidationResult<string>) => {
    setValidationResult(result);
    inputProps.onValidation?.(result);
  };

  const showError = showErrorOnBlur
    ? hasBlurred && !validationResult.isValid && inputProps.value.trim() !== ""
    : !validationResult.isValid && inputProps.value.trim() !== "";

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputProps.id}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <ValidatedInput
        {...inputProps}
        showErrorOnBlur={showErrorOnBlur}
        onValidation={handleValidation}
        onBlur={() => {
          setHasBlurred(true);
        }}
      />
      {showErrorMessage && showError && validationResult.error && (
        <p className="text-sm text-destructive">{validationResult.error}</p>
      )}
      {helpText && !showError && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}
