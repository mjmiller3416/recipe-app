/**
 * Haptic feedback utility for mobile devices
 *
 * Uses the Vibration API to provide tactile feedback on supported devices.
 * Falls back silently on unsupported devices.
 */

export type HapticType = "light" | "medium" | "heavy" | "success" | "error" | "warning";

/**
 * Vibration patterns for different haptic types
 * Values are in milliseconds
 */
const hapticPatterns: Record<HapticType, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 20], // Short, pause, short
  error: [30, 30, 30, 30, 30], // Three quick pulses
  warning: [20, 50, 20], // Two medium pulses
};

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

/**
 * Trigger haptic feedback
 *
 * @param type - Type of haptic feedback
 * @returns boolean indicating if the haptic was triggered
 *
 * @example
 * ```tsx
 * const handleComplete = async () => {
 *   triggerHaptic('success');
 *   await markAsComplete();
 * };
 *
 * const handleError = () => {
 *   triggerHaptic('error');
 *   showErrorMessage();
 * };
 * ```
 */
export function triggerHaptic(type: HapticType): boolean {
  if (!isHapticSupported()) {
    return false;
  }

  try {
    const pattern = hapticPatterns[type];
    return navigator.vibrate(pattern);
  } catch {
    // Silently fail if vibration is blocked
    return false;
  }
}

/**
 * Cancel any ongoing vibration
 */
export function cancelHaptic(): boolean {
  if (!isHapticSupported()) {
    return false;
  }

  try {
    return navigator.vibrate(0);
  } catch {
    return false;
  }
}

/**
 * Create a debounced haptic trigger to prevent rapid-fire haptics
 *
 * @param type - Type of haptic feedback
 * @param delay - Minimum delay between haptics in ms (default: 100)
 * @returns Debounced trigger function
 *
 * @example
 * ```tsx
 * const debouncedHaptic = createDebouncedHaptic('light', 100);
 *
 * // Can be called rapidly, but will only trigger every 100ms
 * items.forEach(() => debouncedHaptic());
 * ```
 */
export function createDebouncedHaptic(
  type: HapticType,
  delay: number = 100
): () => void {
  let lastTrigger = 0;

  return () => {
    const now = Date.now();
    if (now - lastTrigger >= delay) {
      triggerHaptic(type);
      lastTrigger = now;
    }
  };
}

/**
 * Trigger haptic with custom pattern
 *
 * @param pattern - Array of vibration/pause durations in ms
 * @returns boolean indicating if the haptic was triggered
 *
 * @example
 * ```tsx
 * // Vibrate: 100ms on, 50ms off, 200ms on
 * triggerCustomHaptic([100, 50, 200]);
 * ```
 */
export function triggerCustomHaptic(pattern: number[]): boolean {
  if (!isHapticSupported()) {
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}