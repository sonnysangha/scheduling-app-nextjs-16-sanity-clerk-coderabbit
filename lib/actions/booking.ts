"use server";

import { writeClient } from "@/sanity/lib/writeClient";
import { client } from "@/sanity/lib/client";
import {
  HOST_BY_SLUG_WITH_TOKENS_QUERY,
  type HostWithTokens,
} from "@/sanity/queries/users";
import { BOOKINGS_IN_RANGE_QUERY } from "@/sanity/queries/bookings";
import { MEETING_TYPE_BY_SLUGS_QUERY } from "@/sanity/queries/meetingTypes";
import {
  getCalendarClient,
  getEventAttendeeStatus,
  fetchCalendarEvents,
} from "@/lib/google-calendar";
import { getHostBookingQuotaStatus } from "@/lib/features";
import {
  startOfDay,
  endOfDay,
  addMinutes,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { computeAvailableDates } from "@/lib/availability";

// ============================================================================
// Types
// ============================================================================

export type TimeSlot = {
  start: Date;
  end: Date;
};

export type BookingData = {
  hostSlug: string;
  meetingTypeSlug?: string;
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

  // 4. Get attendee statuses for bookings (to exclude declined ones)
  const defaultAccount = host.connectedAccounts?.find((a) => a.isDefault);
  const declinedBookingIds = new Set<string>();

  if (defaultAccount?.accessToken && defaultAccount?.refreshToken) {
    // Check attendee status for each booking with a Google event
    await Promise.all(
      existingBookings
        .filter((b) => b.googleEventId && b.guestEmail)
        .map(async (booking) => {
          // Skip if no googleEventId (satisfies type checker even though filter guarantees it)
          if (!booking.googleEventId) return;

          try {
            const status = await getEventAttendeeStatus(
              defaultAccount,
              booking.googleEventId,
              booking.guestEmail
            );
            if (status === "declined") {
              declinedBookingIds.add(booking._id);
            }
          } catch {
            // If we can't check status, assume booking is still valid
          }
        })
    );
  }

  // Filter out declined bookings - those slots are available again
  const activeBookings = existingBookings.filter(
    (b) => !declinedBookingIds.has(b._id)
  );

  // 5. Get Google Calendar busy times
  const busyTimes = await getGoogleBusyTimes(
    host.connectedAccounts,
    dayStart,
    dayEnd
  );

  // 6. Generate time slots from availability
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

  // 7. Filter out slots that overlap with active bookings or busy times
  const availableSlots = allSlots.filter((slot) => {
    // Check against active bookings (excluding declined ones)
    const hasBookingConflict = activeBookings.some((booking) => {
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
 * Get dates with available slots within a date range (for calendar highlighting)
 * Used for client-side month navigation when user navigates beyond initial data.
 * Returns an array of date strings (YYYY-MM-DD) that have at least one available slot.
 */
export async function getAvailableDates(
  hostSlug: string,
  startDate: Date,
  endDate: Date,
  slotDurationMinutes = 30
): Promise<string[]> {
  // 1. Get host with availability
  const host = await client.fetch(HOST_BY_SLUG_WITH_TOKENS_QUERY, {
    slug: hostSlug,
  });

  if (!host) {
    return [];
  }

  // 2. Get existing bookings in range
  const existingBookings = await client.fetch(BOOKINGS_IN_RANGE_QUERY, {
    hostId: host._id,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  // 3. Get Google Calendar busy times (if available)
  let busyTimes: Array<{ start: Date; end: Date }> = [];
  try {
    busyTimes = await getGoogleBusyTimes(
      host.connectedAccounts,
      startDate,
      endDate
    );
  } catch {
    // Continue without busy times if fetch fails
  }

  // 4. Compute available dates using shared utility
  return computeAvailableDates(
    host.availability ?? [],
    existingBookings,
    startDate,
    endDate,
    slotDurationMinutes,
    busyTimes
  );
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

  // 2. Check if host has exceeded their monthly booking quota
  const quotaStatus = await getHostBookingQuotaStatus(data.hostSlug);
  if (quotaStatus.isExceeded) {
    throw new Error("Host has reached their monthly booking limit");
  }

  // 3. Get the meeting type if provided
  let meetingTypeId: string | undefined;
  let meetingTypeName: string | undefined;

  if (data.meetingTypeSlug) {
    const meetingType = await client.fetch(MEETING_TYPE_BY_SLUGS_QUERY, {
      hostSlug: data.hostSlug,
      meetingTypeSlug: data.meetingTypeSlug,
    });

    if (meetingType) {
      meetingTypeId = meetingType._id;
      meetingTypeName = meetingType.name ?? undefined;
    }
  }

  // 4. Verify slot is still available (prevent race conditions)
  const isAvailable = await checkSlotAvailable(
    host,
    data.startTime,
    data.endTime
  );

  if (!isAvailable) {
    throw new Error("This time slot is no longer available");
  }

  // 5. Find the default connected account for creating calendar events
  const defaultAccount = host.connectedAccounts?.find((a) => a.isDefault);

  let googleEventId: string | undefined;
  let meetLink: string | undefined;

  // 6. Create Google Calendar event if we have a connected account
  if (defaultAccount?.accessToken && defaultAccount?.refreshToken) {
    try {
      const calendar = await getCalendarClient(defaultAccount);

      // Build event summary with meeting type if available
      const summary = meetingTypeName
        ? `${meetingTypeName}: ${host.name} x ${data.guestName}`
        : `Meeting: ${host.name} x ${data.guestName}`;

      const event = await calendar.events.insert({
        calendarId: "primary",
        sendUpdates: "all", // Sends email invites to attendees
        conferenceDataVersion: 1, // Required for conference data
        requestBody: {
          summary,
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
          conferenceData: {
            createRequest: {
              requestId: `booking-${Date.now()}-${Math.random()
                .toString(36)
                .substring(7)}`,
              conferenceSolutionKey: {
                type: "hangoutsMeet",
              },
            },
          },
        },
      });

      googleEventId = event.data.id ?? undefined;
      meetLink = event.data.hangoutLink ?? undefined;
    } catch (error) {
      console.error("Failed to create Google Calendar event:", error);
      // Continue without calendar event - booking still valid
    }
  }

  // 7. Create booking in Sanity
  const booking = await writeClient.create({
    _type: "booking",
    host: { _type: "reference", _ref: host._id },
    ...(meetingTypeId && {
      meetingType: { _type: "reference", _ref: meetingTypeId },
    }),
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    startTime: data.startTime.toISOString(),
    endTime: data.endTime.toISOString(),
    googleEventId,
    meetLink,
    status: "confirmed",
    notes: data.notes,
  });

  return { _id: booking._id };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get Google Calendar busy times from connected accounts
 */
export async function getGoogleBusyTimes(
  connectedAccounts: HostWithTokens["connectedAccounts"],
  startDate: Date,
  endDate: Date
): Promise<Array<{ start: Date; end: Date }>> {
  const events = await fetchCalendarEvents(
    connectedAccounts ?? [],
    startDate,
    endDate
  );

  return events.map((event) => ({
    start: event.start,
    end: event.end,
  }));
}

/**
 * Check if a time slot is available
 */
async function checkSlotAvailable(
  host: HostWithTokens,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const existingBookings = await client.fetch(BOOKINGS_IN_RANGE_QUERY, {
    hostId: host._id,
    startDate: startTime.toISOString(),
    endDate: endTime.toISOString(),
  });

  // Get attendee statuses for overlapping bookings
  const defaultAccount = host.connectedAccounts?.find((a) => a.isDefault);
  const declinedBookingIds = new Set<string>();

  if (defaultAccount?.accessToken && defaultAccount?.refreshToken) {
    // Find overlapping bookings first
    const overlappingBookings = existingBookings.filter((booking) => {
      const bookingStart = parseISO(booking.startTime);
      const bookingEnd = parseISO(booking.endTime);
      return startTime < bookingEnd && endTime > bookingStart;
    });

    // Check their attendee status
    await Promise.all(
      overlappingBookings
        .filter((b) => b.googleEventId && b.guestEmail)
        .map(async (booking) => {
          // Skip if no googleEventId (satisfies type checker even though filter guarantees it)
          if (!booking.googleEventId) return;

          try {
            const status = await getEventAttendeeStatus(
              defaultAccount,
              booking.googleEventId,
              booking.guestEmail
            );
            if (status === "declined") {
              declinedBookingIds.add(booking._id);
            }
          } catch {
            // If we can't check status, assume booking is still valid
          }
        })
    );
  }

  // Check for any overlapping bookings (excluding declined ones)
  return !existingBookings.some((booking) => {
    if (declinedBookingIds.has(booking._id)) return false; // Declined = available
    const bookingStart = parseISO(booking.startTime);
    const bookingEnd = parseISO(booking.endTime);
    return startTime < bookingEnd && endTime > bookingStart;
  });
}
