import { auth, clerkClient } from "@clerk/nextjs/server";
import { client } from "@/sanity/lib/client";
import { startOfMonth, endOfMonth } from "date-fns";

export type PlanType = "free" | "starter" | "pro";

export const PLAN_LIMITS = {
  free: {
    maxConnectedCalendars: 1,
    maxBookingsPerMonth: 2,
  },
  starter: {
    maxConnectedCalendars: 3,
    maxBookingsPerMonth: 10,
  },
  pro: {
    maxConnectedCalendars: Infinity,
    maxBookingsPerMonth: Infinity,
  },
} as const;

/**
 * Get the current user's plan based on Clerk subscription
 */
export async function getUserPlan(): Promise<PlanType> {
  const { has } = await auth();

  if (has({ plan: "pro" })) return "pro";
  if (has({ plan: "starter" })) return "starter";
  return "free";
}

/**
 * Get the plan limits for the current user
 */
export async function getUserPlanLimits() {
  const plan = await getUserPlan();
  return { ...PLAN_LIMITS[plan], plan };
}

/**
 * Check if the current user can connect more calendars
 */
export async function canConnectMoreCalendars(
  currentCount: number
): Promise<boolean> {
  const limits = await getUserPlanLimits();
  return currentCount < limits.maxConnectedCalendars;
}

// Query to get host's clerkId by their public slug
const HOST_CLERK_ID_BY_SLUG_QUERY = `*[
  _type == "user"
  && slug.current == $hostSlug
][0].clerkId`;

// Query to count bookings for a host in a date range
const COUNT_HOST_BOOKINGS_QUERY = `count(*[
  _type == "booking"
  && host->slug.current == $hostSlug
  && startTime >= $monthStart
  && startTime < $monthEnd
])`;

/**
 * Get a host's plan by checking their Clerk subscription via Backend API
 * Used for public pages where we can't use auth()
 */
export async function getHostPlan(hostClerkId: string): Promise<PlanType> {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(hostClerkId);

    // Check if user has an active subscription
    // Clerk Billing stores subscription info - check publicMetadata or subscription
    const metadata = user.publicMetadata as { plan?: string } | undefined;
    if (metadata?.plan === "pro") return "pro";
    if (metadata?.plan === "starter") return "starter";

    return "free";
  } catch (error) {
    console.error("Failed to fetch host plan from Clerk:", error);
    return "free";
  }
}

export type BookingQuotaStatus = {
  used: number;
  limit: number;
  remaining: number;
  isExceeded: boolean;
  plan: PlanType;
};

/**
 * Get booking quota status for a host (by their public slug)
 * Used on public booking pages to check if host has exceeded their monthly quota
 */
export async function getHostBookingQuotaStatus(
  hostSlug: string
): Promise<BookingQuotaStatus> {
  // Get the host's clerkId from Sanity
  const hostClerkId = await client.fetch<string | null>(
    HOST_CLERK_ID_BY_SLUG_QUERY,
    { hostSlug }
  );

  if (!hostClerkId) {
    // Host not found, return exceeded to block booking
    return {
      used: 0,
      limit: 0,
      remaining: 0,
      isExceeded: true,
      plan: "free",
    };
  }

  // Get the host's plan via Clerk Backend API
  const plan = await getHostPlan(hostClerkId);
  const limit = PLAN_LIMITS[plan].maxBookingsPerMonth;

  // Count bookings this month
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  const used = await client.fetch<number>(COUNT_HOST_BOOKINGS_QUERY, {
    hostSlug,
    monthStart,
    monthEnd,
  });

  const remaining = Math.max(0, limit - used);
  const isExceeded = used >= limit;

  return { used, limit, remaining, isExceeded, plan };
}
