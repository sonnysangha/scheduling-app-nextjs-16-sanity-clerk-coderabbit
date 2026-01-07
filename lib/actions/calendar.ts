"use server";

import { auth } from "@clerk/nextjs/server";
import { writeClient } from "@/sanity/lib/writeClient";
import { client } from "@/sanity/lib/client";
import { USER_WITH_TOKENS_QUERY } from "@/sanity/queries/users";
import { BOOKING_WITH_HOST_CALENDAR_QUERY } from "@/sanity/queries/bookings";
import { getCalendarClient, revokeGoogleToken } from "@/lib/google-calendar";

// ============================================================================
// Types
// ============================================================================

export type BusySlot = {
  start: string;
  end: string;
  accountEmail: string;
};

// ============================================================================
// Host Actions (Authenticated)
// ============================================================================

/**
 * Fetch busy times from all connected Google Calendars
 */
export async function getGoogleBusyTimes(
  startDate: Date,
  endDate: Date
): Promise<BusySlot[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await client.fetch(USER_WITH_TOKENS_QUERY, { clerkId: userId });
  if (!user?.connectedAccounts?.length) {
    return [];
  }

  const busySlots: BusySlot[] = [];

  for (const account of user.connectedAccounts) {
    // Skip accounts without valid tokens
    if (!account.accessToken || !account.refreshToken) {
      continue;
    }

    try {
      const calendar = await getCalendarClient(account);

      const { data } = await calendar.events.list({
        calendarId: "primary",
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = data.items ?? [];

      for (const event of events) {
        // Skip all-day events (they have date instead of dateTime)
        if (!event.start?.dateTime || !event.end?.dateTime) {
          continue;
        }

        busySlots.push({
          start: event.start.dateTime,
          end: event.end.dateTime,
          accountEmail: account.email,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch busy times for ${account.email}:`, error);
      // Continue with other accounts
    }
  }

  return busySlots;
}

/**
 * Disconnect a Google account
 */
export async function disconnectGoogleAccount(
  accountKey: string
): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await client.fetch(USER_WITH_TOKENS_QUERY, { clerkId: userId });
  if (!user) throw new Error("User not found");

  // Find the account to disconnect
  const account = user.connectedAccounts?.find((a) => a._key === accountKey);
  if (!account) throw new Error("Account not found");

  // Revoke the token with Google
  if (account.accessToken) {
    await revokeGoogleToken(account.accessToken);
  }

  // Check if this was the default account
  const wasDefault = account.isDefault;
  const remainingAccounts = user.connectedAccounts?.filter(
    (a) => a._key !== accountKey
  );

  // Remove the account from Sanity
  await writeClient
    .patch(user._id)
    .unset([`connectedAccounts[_key=="${accountKey}"]`])
    .commit();

  // If the removed account was the default and there are other accounts,
  // set the first remaining account as default
  if (wasDefault && remainingAccounts && remainingAccounts.length > 0) {
    const newDefaultKey = remainingAccounts[0]._key;
    await writeClient
      .patch(user._id)
      .set({
        [`connectedAccounts[_key=="${newDefaultKey}"].isDefault`]: true,
      })
      .commit();
  }
}

/**
 * Set a connected account as the default for new bookings
 */
export async function setDefaultCalendarAccount(
  accountKey: string
): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await client.fetch(USER_WITH_TOKENS_QUERY, { clerkId: userId });
  if (!user) throw new Error("User not found");

  // Verify the account exists
  const account = user.connectedAccounts?.find((a) => a._key === accountKey);
  if (!account) throw new Error("Account not found");

  // Set all accounts to non-default, then set the target as default
  // We need to do this in two patches to avoid conflicts
  for (const acc of user.connectedAccounts ?? []) {
    if (acc._key !== accountKey && acc.isDefault) {
      await writeClient
        .patch(user._id)
        .set({
          [`connectedAccounts[_key=="${acc._key}"].isDefault`]: false,
        })
        .commit();
    }
  }

  // Set the target account as default
  await writeClient
    .patch(user._id)
    .set({
      [`connectedAccounts[_key=="${accountKey}"].isDefault`]: true,
    })
    .commit();
}

/**
 * Get the list of connected accounts for the current user (without tokens)
 */
export async function getConnectedAccounts() {
  const { userId } = await auth();
  if (!userId) return [];

  const user = await client.fetch(USER_WITH_TOKENS_QUERY, { clerkId: userId });

  // Return accounts without sensitive token data
  return (
    user?.connectedAccounts?.map((account) => ({
      _key: account._key,
      accountId: account.accountId,
      email: account.email,
      isDefault: account.isDefault,
    })) ?? []
  );
}

/**
 * Cancel a booking (Host only - requires authentication)
 */
export async function cancelBooking(bookingId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Get the booking with host info
  const booking = await client.fetch(BOOKING_WITH_HOST_CALENDAR_QUERY, {
    bookingId,
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Cancel Google Calendar event if exists
  if (booking.googleEventId && booking.host?.connectedAccounts) {
    const account = booking.host.connectedAccounts;
    if (account.accessToken && account.refreshToken) {
      try {
        const calendar = await getCalendarClient(account);
        await calendar.events.delete({
          calendarId: "primary",
          eventId: booking.googleEventId,
          sendUpdates: "all", // Sends cancellation emails
        });
      } catch (error) {
        console.error("Failed to cancel Google Calendar event:", error);
        // Continue anyway - update booking status
      }
    }
  }

  // Update booking status in Sanity
  await writeClient.patch(bookingId).set({ status: "cancelled" }).commit();
}
