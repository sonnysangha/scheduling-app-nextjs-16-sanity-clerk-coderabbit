"use server";

import { writeClient } from "@/sanity/lib/writeClient";
import { client } from "@/sanity/lib/client";
import {
  HOST_BY_SLUG_WITH_TOKENS_QUERY,
  type HostWithTokens,
} from "@/sanity/queries/users";
import { BOOKINGS_IN_RANGE_QUERY } from "@/sanity/queries/bookings";
import { getCalendarClient } from "@/lib/google-calendar";
import {
  startOfDay,
  endOfDay,
  addMinutes,
  isWithinInterval,
  parseISO,
} from "date-fns";

// ============================================================================
// Types
// ============================================================================

export type TimeSlot = {
  start: Date;
  end: Date;
};

export type BookingData = {
  hostSlug: string;
  startTime: Date;
  endTime: Date;
  guestName: string;
  guestEmail: string;
  notes?: string;
};

// ============================================================================
// Public Actions (No Auth Required)
// ============================================================================

/**
 * Get available time slots for a host on a specific date
 */
export async function getAvailableSlots(
  hostSlug: string,
  date: Date,
  slotDurationMinutes = 30
): Promise<TimeSlot[]> {
  // 1. Get host with availability and connected accounts
  const host = await client.fetch(HOST_BY_SLUG_WITH_TOKENS_QUERY, {
    slug: hostSlug,
  });

  if (!host) {
    throw new Error("Host not found");
  }

  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // 2. Get host's availability blocks for this date
  const availabilityForDate = (host.availability ?? []).filter((slot) => {
    const slotStart = parseISO(slot.startDateTime);
    const slotEnd = parseISO(slot.endDateTime);

    // Check if the slot overlaps with the requested date
    return (
      isWithinInterval(slotStart, { start: dayStart, end: dayEnd }) ||
      isWithinInterval(slotEnd, { start: dayStart, end: dayEnd }) ||
      (slotStart <= dayStart && slotEnd >= dayEnd)
    );
  });

  if (availabilityForDate.length === 0) {
    return [];
  }

  // 3. Get existing bookings for this date
  const existingBookings = await client.fetch(BOOKINGS_IN_RANGE_QUERY, {
    hostId: host._id,
    startDate: dayStart.toISOString(),
    endDate: dayEnd.toISOString(),
  });

  // 4. Get Google Calendar busy times
  const busyTimes = await getHostGoogleBusyTimes(host, dayStart, dayEnd);

  // 5. Generate time slots from availability
  const allSlots: TimeSlot[] = [];

  for (const availSlot of availabilityForDate) {
    const availStart = parseISO(availSlot.startDateTime);
    const availEnd = parseISO(availSlot.endDateTime);

    // Clamp to the requested date
    const slotStart = availStart < dayStart ? dayStart : availStart;
    const slotEnd = availEnd > dayEnd ? dayEnd : availEnd;

    // Generate slots
    let currentStart = slotStart;
    while (addMinutes(currentStart, slotDurationMinutes) <= slotEnd) {
      const currentEnd = addMinutes(currentStart, slotDurationMinutes);
      allSlots.push({ start: currentStart, end: currentEnd });
      currentStart = currentEnd;
    }
  }

  // 6. Filter out slots that overlap with bookings or busy times
  const availableSlots = allSlots.filter((slot) => {
    // Check against existing bookings
    const hasBookingConflict = existingBookings.some((booking) => {
      const bookingStart = parseISO(booking.startTime);
      const bookingEnd = parseISO(booking.endTime);
      return slot.start < bookingEnd && slot.end > bookingStart;
    });

    if (hasBookingConflict) return false;

    // Check against Google Calendar busy times
    const hasBusyConflict = busyTimes.some((busy) => {
      return slot.start < busy.end && slot.end > busy.start;
    });

    return !hasBusyConflict;
  });

  return availableSlots;
}

/**
 * Create a booking
 */
export async function createBooking(
  data: BookingData
): Promise<{ _id: string }> {
  // 1. Get the host
  const host = await client.fetch(HOST_BY_SLUG_WITH_TOKENS_QUERY, {
    slug: data.hostSlug,
  });

  if (!host) {
    throw new Error("Host not found");
  }

  // 2. Verify slot is still available (prevent race conditions)
  const isAvailable = await checkSlotAvailable(
    host._id,
    data.startTime,
    data.endTime
  );

  if (!isAvailable) {
    throw new Error("This time slot is no longer available");
  }

  // 3. Find the default connected account for creating calendar events
  const defaultAccount = host.connectedAccounts?.find((a) => a.isDefault);

  let googleEventId: string | undefined;

  // 4. Create Google Calendar event if we have a connected account
  if (defaultAccount?.accessToken && defaultAccount?.refreshToken) {
    try {
      const calendar = await getCalendarClient(defaultAccount);

      const event = await calendar.events.insert({
        calendarId: "primary",
        sendUpdates: "all", // Sends email invites to attendees
        requestBody: {
          summary: `Meeting with ${data.guestName}`,
          description: data.notes || undefined,
          start: {
            dateTime: data.startTime.toISOString(),
          },
          end: {
            dateTime: data.endTime.toISOString(),
          },
          attendees: [
            { email: host.email, responseStatus: "accepted" },
            { email: data.guestEmail },
          ],
        },
      });

      googleEventId = event.data.id ?? undefined;
    } catch (error) {
      console.error("Failed to create Google Calendar event:", error);
      // Continue without calendar event - booking still valid
    }
  }

  // 5. Create booking in Sanity
  const booking = await writeClient.create({
    _type: "booking",
    host: { _type: "reference", _ref: host._id },
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    startTime: data.startTime.toISOString(),
    endTime: data.endTime.toISOString(),
    googleEventId,
    status: "confirmed",
    notes: data.notes,
  });

  return { _id: booking._id };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get Google Calendar busy times for a host
 */
async function getHostGoogleBusyTimes(
  host: HostWithTokens,
  startDate: Date,
  endDate: Date
): Promise<Array<{ start: Date; end: Date }>> {
  const busyTimes: Array<{ start: Date; end: Date }> = [];

  for (const account of host.connectedAccounts ?? []) {
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

      for (const event of data.items ?? []) {
        if (!event.start?.dateTime || !event.end?.dateTime) {
          continue;
        }

        busyTimes.push({
          start: parseISO(event.start.dateTime),
          end: parseISO(event.end.dateTime),
        });
      }
    } catch (error) {
      console.error(`Failed to fetch busy times for ${account.email}:`, error);
    }
  }

  return busyTimes;
}

/**
 * Check if a time slot is available
 */
async function checkSlotAvailable(
  hostId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const existingBookings = await client.fetch(BOOKINGS_IN_RANGE_QUERY, {
    hostId,
    startDate: startTime.toISOString(),
    endDate: endTime.toISOString(),
  });

  // Check for any overlapping bookings
  return !existingBookings.some((booking) => {
    const bookingStart = parseISO(booking.startTime);
    const bookingEnd = parseISO(booking.endTime);
    return startTime < bookingEnd && endTime > bookingStart;
  });
}
