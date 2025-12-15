/**
 * Common fractions for display formatting
 * Ordered by value for proper matching
 */
const COMMON_FRACTIONS: [number, string][] = [
  [1 / 8, "1/8"],
  [1 / 4, "1/4"],
  [1 / 3, "1/3"],
  [3 / 8, "3/8"],
  [1 / 2, "1/2"],
  [5 / 8, "5/8"],
  [2 / 3, "2/3"],
  [3 / 4, "3/4"],
  [7 / 8, "7/8"],
];

const FRACTION_TOLERANCE = 0.02;

/**
 * Parses a quantity string into a number.
 * Accepts decimals ("1.5"), simple fractions ("1/2"), and mixed numbers ("1 1/2" or "1-1/2")
 *
 * @param input - The string to parse
 * @returns The parsed number or null if unparseable
 */
export function parseQuantity(input: string): number | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // Try parsing as a simple decimal first
  const decimal = parseFloat(trimmed);
  if (!isNaN(decimal) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return decimal;
  }

  // Try parsing as a simple fraction (e.g., "1/2")
  const simpleFractionMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (simpleFractionMatch) {
    const numerator = parseInt(simpleFractionMatch[1], 10);
    const denominator = parseInt(simpleFractionMatch[2], 10);
    if (denominator !== 0) {
      return numerator / denominator;
    }
    return null;
  }

  // Try parsing as a mixed number with space (e.g., "1 1/2")
  const mixedSpaceMatch = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedSpaceMatch) {
    const whole = parseInt(mixedSpaceMatch[1], 10);
    const numerator = parseInt(mixedSpaceMatch[2], 10);
    const denominator = parseInt(mixedSpaceMatch[3], 10);
    if (denominator !== 0) {
      return whole + numerator / denominator;
    }
    return null;
  }

  // Try parsing as a mixed number with hyphen (e.g., "1-1/2")
  const mixedHyphenMatch = trimmed.match(/^(\d+)-(\d+)\s*\/\s*(\d+)$/);
  if (mixedHyphenMatch) {
    const whole = parseInt(mixedHyphenMatch[1], 10);
    const numerator = parseInt(mixedHyphenMatch[2], 10);
    const denominator = parseInt(mixedHyphenMatch[3], 10);
    if (denominator !== 0) {
      return whole + numerator / denominator;
    }
    return null;
  }

  // Try parsing as just a whole number
  const wholeMatch = trimmed.match(/^(\d+)$/);
  if (wholeMatch) {
    return parseInt(wholeMatch[1], 10);
  }

  return null;
}

/**
 * Formats a number as a user-friendly quantity string.
 * Uses common fractions when possible, falls back to decimal display.
 *
 * @param value - The number to format
 * @returns A formatted string representation
 */
export function formatQuantity(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "";
  }

  // Handle negative numbers
  const isNegative = value < 0;
  const absValue = Math.abs(value);

  const whole = Math.floor(absValue);
  const fractional = absValue - whole;

  // If it's a whole number (or very close to one)
  if (fractional < FRACTION_TOLERANCE) {
    const result = whole.toString();
    return isNegative ? `-${result}` : result;
  }

  // If fractional part is very close to 1, round up
  if (fractional > 1 - FRACTION_TOLERANCE) {
    const result = (whole + 1).toString();
    return isNegative ? `-${result}` : result;
  }

  // Try to match a common fraction
  for (const [fractionValue, fractionStr] of COMMON_FRACTIONS) {
    if (Math.abs(fractional - fractionValue) < FRACTION_TOLERANCE) {
      let result: string;
      if (whole === 0) {
        result = fractionStr;
      } else {
        result = `${whole} ${fractionStr}`;
      }
      return isNegative ? `-${result}` : result;
    }
  }

  // Fall back to decimal display
  // Round to 2 decimal places for cleaner display
  const rounded = Math.round(absValue * 100) / 100;
  const result = rounded.toString();
  return isNegative ? `-${result}` : result;
}
