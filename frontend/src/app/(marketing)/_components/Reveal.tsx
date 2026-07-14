"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stagger offset in ms, applied as transition-delay when revealing */
  delay?: number;
}

/**
 * Fades + slides children in the first time they scroll into view.
 * Renders visible on the server (content is never hidden without JS or under
 * prefers-reduced-motion); useLayoutEffect hides below-fold elements before
 * first paint, so there's no flash.
 */
export function Reveal({ className, delay = 0, children, ...props }: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<"static" | "hidden" | "shown">("static");

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already on screen at load — leave it static rather than animating late.
    if (el.getBoundingClientRect().top <= window.innerHeight) return;

    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        state === "hidden" && "translate-y-6 opacity-0",
        className
      )}
      style={state === "shown" && delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
