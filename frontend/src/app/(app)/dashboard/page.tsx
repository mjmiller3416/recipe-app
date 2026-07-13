"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardView } from "./_components";

const MOBILE_BREAKPOINT = 768; // Matches Tailwind's md: breakpoint

export default function DashboardPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(mobile);

    // Redirect mobile users to meal planner
    if (mobile) {
      router.replace("/meal-planner");
    }
  }, [router]);

  // Don't render anything until we know if it's mobile
  // This prevents flash of dashboard content on mobile
  if (isMobile === null || isMobile) {
    return null;
  }

  return <DashboardView />;
}
