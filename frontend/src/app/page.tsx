"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MOBILE_BREAKPOINT = 768; // Matches Tailwind's md: breakpoint

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to meal planner on mobile, dashboard on desktop
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    router.replace(isMobile ? "/meal-planner" : "/dashboard");
  }, [router]);

  return null;
}
