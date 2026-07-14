import type { Metadata } from "next";
import { HomeView } from "./_components";

export const metadata: Metadata = { title: "Home" };

/**
 * Home Page
 *
 * Route: /dashboard
 *
 * One Home for all devices — no mobile redirect. Signed-in users land here
 * from the root redirect in (marketing)/page.tsx.
 */
export default function HomePage() {
  return <HomeView />;
}
