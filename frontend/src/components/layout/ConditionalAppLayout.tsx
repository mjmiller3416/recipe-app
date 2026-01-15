"use client";

import { usePathname } from "next/navigation";
import { AppLayout } from "./AppLayout";

// Routes that should skip AppLayout entirely (for isolated testing)
const ISOLATED_ROUTES: string[] = []; // Cleared - no longer need isolated testing

export function ConditionalAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isIsolated = ISOLATED_ROUTES.some(route => pathname?.startsWith(route));

  if (isIsolated) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}
