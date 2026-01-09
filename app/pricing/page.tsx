import { PricingTable } from "@clerk/nextjs";
import { LandingHeader } from "@/components/landing/landing-header";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <LandingHeader />
      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pt-40">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Choose the plan that works best for you. All plans include a 14-day
            free trial.
          </p>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="pb-20 sm:pb-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <PricingTable />
        </div>
      </section>
    </div>
  );
}
