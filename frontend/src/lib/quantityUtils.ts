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

  // Try parsing as a simple decimal first (including leading decimals like .5)
  const decimal = parseFloat(trimmed);
  if (!isNaN(decimal) && /^-?(\d+\.?\d*|\.\d+)$/.test(trimmed)) {
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
 * Formats minutes into a compact time string for cards, badges, and inline displays.
 *
 * @param minutes - Duration in minutes (nullable)
 * @param fallback - String to return when minutes is null/undefined (default: em dash)
 * @returns Formatted string like "30m", "1h 30m", "2h", or the fallback
 */
export function formatTime(
  minutes: number | null | undefined,
  fallback: string = "\u2014"
): string {
  if (minutes == null || isNaN(minutes) || minutes <= 0) return fallback;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}