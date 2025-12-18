"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Breakpoint values matching Tailwind CSS defaults
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook that returns whether a media query matches
 *
 * @example
 * ```tsx
 * const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
 * const isLargeScreen = useMediaQuery("(min-width: 1024px)");
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/**
 * Hook that returns current breakpoint information
 *
 * @example
 * ```tsx
 * const { isSm, isMd, isLg, current } = useBreakpoints();
 *
 * return (
 *   <div className={isLg ? "grid-cols-3" : isMd ? "grid-cols-2" : "grid-cols-1"}>
 *     ...
 *   </div>
 * );
 * ```
 */
export function useBreakpoints(): {
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  current: Breakpoint | "xs";
  isAtLeast: (breakpoint: Breakpoint) => boolean;
  isAtMost: (breakpoint: Breakpoint) => boolean;
} {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => setWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const isSm = width >= breakpoints.sm;
  const isMd = width >= breakpoints.md;
  const isLg = width >= breakpoints.lg;
  const isXl = width >= breakpoints.xl;
  const is2xl = width >= breakpoints["2xl"];

  const current: Breakpoint | "xs" = is2xl
    ? "2xl"
    : isXl
    ? "xl"
    : isLg
    ? "lg"
    : isMd
    ? "md"
    : isSm
    ? "sm"
    : "xs";

  const isAtLeast = useCallback(
    (breakpoint: Breakpoint) => width >= breakpoints[breakpoint],
    [width]
  );

  const isAtMost = useCallback(
    (breakpoint: Breakpoint) => width < breakpoints[breakpoint],
    [width]
  );

  return {
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    current,
    isAtLeast,
    isAtMost,
  };
}

/**
 * Simple hook that returns whether the screen is mobile-sized (< md breakpoint)
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 *
 * return isMobile ? <MobileNav /> : <DesktopNav />;
 * ```
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoints.md);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

/**
 * Hook that returns whether the user prefers reduced motion
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = usePrefersReducedMotion();
 *
 * return prefersReducedMotion ? (
 *   <StaticComponent />
 * ) : (
 *   <AnimatedComponent />
 * );
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
