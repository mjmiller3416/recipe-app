import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";
import { Hero } from "./_components/Hero";
import { HowItWorks } from "./_components/HowItWorks";
import { FeatureGrid } from "./_components/FeatureGrid";
import { CtaBand } from "./_components/CtaBand";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: appConfig.appName,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  description:
    "Save recipes, plan your week, and get an auto-built shopping list. AI-powered recipe import and generation.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default async function RootPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <HowItWorks />
      <FeatureGrid />
      <CtaBand />
    </>
  );
}
