import Link from "next/link";
import { Heart } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
      <p className="text-muted mb-8">
        Overview of your meal planning activities
      </p>

      {/* Quick Favorites - Temporary placement */}
      <Link
        href="/recipes?favoritesOnly=true"
        className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20 transition-all duration-200 hover:translate-x-1 active:scale-[0.98] mb-8"
      >
        <Heart className="w-5 h-5" strokeWidth={1.5} />
        <span className="font-medium">Quick Favorites</span>
      </Link>

      <div className="bg-elevated rounded-lg p-8 text-center">
        <p className="text-muted">Dashboard content coming soon...</p>
      </div>
    </div>
  );
}
