import { Check, X, Loader2 } from "lucide-react";
import { PricingTable } from "@clerk/nextjs";
import { LandingHeader } from "@/components/landing/landing-header";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    features: {
      calendars: "1 calendar",
      bookings: "2 / month",
      availability: true,
      googleCalendar: true,
      customBookingPage: true,
    },
  },
  {
    name: "Starter",
    features: {
      calendars: "3 calendars",
      bookings: "10 / month",
      availability: true,
      googleCalendar: true,
      customBookingPage: true,
    },
  },
  {
    name: "Pro",
    highlighted: true,
    features: {
      calendars: "Unlimited",
      bookings: "Unlimited",
      availability: true,
      googleCalendar: true,
      customBookingPage: true,
    },
  },
];

const featureLabels: Record<string, string> = {
  calendars: "Connected calendars",
  bookings: "Monthly bookings",
  availability: "Availability management",
  googleCalendar: "Google Calendar sync",
  customBookingPage: "Custom booking page",
};

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

      {/* Comparison Table */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Compare all features
          </h2>
          <div className="overflow-x-auto bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left py-4 px-6 font-semibold">Feature</th>
                  {plans.map((plan) => (
                    <th
                      key={plan.name}
                      className={cn(
                        "text-center py-4 px-4 font-semibold",
                        plan.highlighted && "text-blue-600"
                      )}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(featureLabels).map((featureKey, index) => (
                  <tr
                    key={featureKey}
                    className={cn(
                      "border-b border-zinc-100 dark:border-zinc-700",
                      index % 2 === 0 && "bg-zinc-50/50 dark:bg-zinc-800/50"
                    )}
                  >
                    <td className="py-4 px-6 text-sm font-medium">
                      {featureLabels[featureKey]}
                    </td>
                    {plans.map((plan) => {
                      const value =
                        plan.features[featureKey as keyof typeof plan.features];
                      return (
                        <td key={plan.name} className="text-center py-4 px-4">
                          {typeof value === "boolean" ? (
                            value ? (
                              <Check className="size-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="size-5 text-zinc-300 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm font-semibold">{value}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Clerk Pricing Table */}
      <section className="pb-20 sm:pb-32 bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Choose your plan
          </h2>
          <PricingTable
            appearance={{
              elements: {
                pricingTable: {
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "1.5rem",
                },
                pricingTableCard: {
                  borderRadius: "1rem",
                  border: "1px solid rgba(59, 130, 246, 0.15)",
                  boxShadow: "0 4px 24px rgba(59, 130, 246, 0.08)",
                  transition: "all 0.3s ease",
                  overflow: "hidden",
                  background: "#ffffff",
                },
                pricingTableCardHeader: {
                  background:
                    "linear-gradient(135deg, rgb(59, 130, 246), rgb(96, 165, 250))",
                  color: "white",
                  borderRadius: "1rem 1rem 0 0",
                  padding: "2rem",
                },
                pricingTableCardTitle: {
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  color: "white",
                  marginBottom: "0.25rem",
                },
                pricingTableCardDescription: {
                  fontSize: "0.9rem",
                  color: "rgba(255, 255, 255, 0.9)",
                  fontWeight: "500",
                },
                pricingTableCardFee: {
                  color: "white",
                  fontWeight: "800",
                  fontSize: "2.5rem",
                },
                pricingTableCardFeePeriod: {
                  color: "rgba(255, 255, 255, 0.85)",
                  fontSize: "1rem",
                },
                pricingTableCardBody: {
                  padding: "1.5rem",
                  background: "#ffffff",
                },
                pricingTableCardFeatures: {
                  marginTop: "1rem",
                  gap: "0.75rem",
                },
                pricingTableCardFeature: {
                  fontSize: "0.9rem",
                  padding: "0.5rem 0",
                  fontWeight: "500",
                  color: "#64748b",
                },
                pricingTableCardButton: {
                  marginTop: "1.5rem",
                  borderRadius: "0.75rem",
                  fontWeight: "700",
                  padding: "0.875rem 2rem",
                  transition: "all 0.2s ease",
                  fontSize: "1rem",
                  background:
                    "linear-gradient(135deg, rgb(59, 130, 246), rgb(96, 165, 250))",
                  border: "none",
                  color: "white",
                  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                },
                pricingTableCardPeriodToggle: {
                  color: "#1f2937",
                },
              },
            }}
            fallback={
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                  <p className="text-muted-foreground text-lg font-medium">
                    Loading pricing options...
                  </p>
                </div>
              </div>
            }
          />
        </div>
      </section>
    </div>
  );
}
