"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  // Create QueryClient inside useState to avoid recreating on every render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep data fresh - no aggressive caching per user preference
            staleTime: 0,
            // Refetch when window regains focus for freshness
            refetchOnWindowFocus: true,
            // Retry failed requests once
            retry: 1,
            // Don't refetch on reconnect (user can refresh manually)
            refetchOnReconnect: false,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
