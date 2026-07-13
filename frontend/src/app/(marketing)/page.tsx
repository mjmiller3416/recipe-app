import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";

function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background p-4 text-center">
      <Logo className="h-16 w-16 text-primary" />
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Meal Genie
        </h1>
        <p className="text-lg text-muted-foreground">
          Save recipes, plan your week, and shop smarter.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button asChild size="lg">
          <Link href="/sign-up">Get started</Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}

export default async function RootPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return <LandingPage />;
}
