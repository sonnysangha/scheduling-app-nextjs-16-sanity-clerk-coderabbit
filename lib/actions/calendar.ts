"use server";

import { auth } from "@clerk/nextjs/server";
import { writeClient } from "@/sanity/lib/writeClient";
import { client } from "@/sanity/lib/client";
import { USER_WITH_TOKENS_QUERY } from "@/sanity/queries/users";
import { BOOKING_WITH_HOST_CALENDAR_QUERY } from "@/sanity/queries/bookings";
import {
  getCalendarClient,
  revokeGoogleToken,
  getEventAttendeeStatuses,
  type AttendeeStatus,
} from "@/lib/google-calendar";

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
 * Cancel a booking (Host only - requires authentication)
 * Deletes the Google Calendar event and removes the booking from Sanity.
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

  // Delete Google Calendar event if exists
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
        console.error("Failed to delete Google Calendar event:", error);
        // Continue anyway - delete booking from Sanity
      }
    }
  }

  // Delete booking from Sanity (Google Calendar is source of truth)
  await writeClient.delete(bookingId);
}

export type BookingStatuses = {
  guestStatus: AttendeeStatus;
  isCancelled: boolean;
};

/**
 * Get guest attendee statuses for multiple bookings from Google Calendar.
 * Google Calendar is the sole source of truth - we don't store status in Sanity.
 */
export async function getBookingAttendeeStatuses(
  bookings: Array<{
    id: string;
    googleEventId: string | null;
    guestEmail: string;
  }>
): Promise<Record<string, BookingStatuses>> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await client.fetch(USER_WITH_TOKENS_QUERY, { clerkId: userId });
  if (!user?.connectedAccounts?.length) {
    return {};
  }

  // Find the default account (which is also the host's email)
  const account = user.connectedAccounts.find((a) => a.isDefault);
  if (!account?.accessToken || !account?.refreshToken) {
    return {};
  }

  const hostEmail = account.email;
  const statuses: Record<string, BookingStatuses> = {};

  // Fetch statuses in parallel
  const bookingsWithEvents = bookings.filter((b) => b.googleEventId);

  await Promise.all(
    bookingsWithEvents.map(async (booking) => {
      if (booking.googleEventId) {
        const { hostStatus, guestStatus } = await getEventAttendeeStatuses(
          account,
          booking.googleEventId,
          hostEmail,
          booking.guestEmail
        );

        // Event is cancelled if hostStatus is "declined" (event deleted/cancelled)
        const isCancelled = hostStatus === "declined";
        statuses[booking.id] = { guestStatus, isCancelled };
      }
    })
  );

  return statuses;
}

/**
 * Check which bookings are cancelled in Google Calendar (for public booking page).
 * Uses the host's calendar credentials to check event status.
 * Google Calendar is the sole source of truth.
 */
export async function getActivebookingIds(
  hostAccount: {
    accessToken: string | null;
    refreshToken: string | null;
    expiryDate?: number | null;
    _key: string;
    email: string;
  } | null,
  bookings: Array<{
    id: string;
    googleEventId: string | null;
  }>
): Promise<Set<string>> {
  const activeIds = new Set<string>();

  // If no host account with valid tokens, assume all bookings are active (can't verify)
  if (!hostAccount?.accessToken || !hostAccount?.refreshToken) {
    for (const b of bookings) {
      activeIds.add(b.id);
    }
    return activeIds;
  }

  const accessToken = hostAccount.accessToken;
  const refreshToken = hostAccount.refreshToken;

  // Check each booking's status in Google Calendar
  await Promise.all(
    bookings.map(async (booking) => {
      if (!booking.googleEventId) {
        // No Google event - assume active
        activeIds.add(booking.id);
        return;
      }

      try {
        const { hostStatus } = await getEventAttendeeStatuses(
          {
            _key: hostAccount._key,
            accessToken,
            refreshToken,
            expiryDate: hostAccount.expiryDate ?? null,
            email: hostAccount.email,
            accountId: "",
            isDefault: true,
          },
          booking.googleEventId,
          hostAccount.email,
          "" // guest email not needed for cancellation check
        );

        // Only add to active if not cancelled
        if (hostStatus !== "declined") {
          activeIds.add(booking.id);
        }
      } catch (error) {
        console.error(`Failed to check booking ${booking.id}:`, error);
        // On error, assume active to avoid blocking valid slots
        activeIds.add(booking.id);
      }
    })
  );

  return activeIds;
}
